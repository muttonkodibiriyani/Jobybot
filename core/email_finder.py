"""Email finder: domain inference + DNS MX verification."""
from __future__ import annotations

import re
import time
from typing import Optional

import dns.resolver
import requests
from loguru import logger

from . import db

# Known company → domain overrides (helps for ambiguous names)
KNOWN_DOMAINS = {
    "talabat":               "talabat.com",
    "careem":                "careem.com",
    "noon":                  "noon.com",
    "emirates nbd":          "emiratesnbd.com",
    "enbd":                  "enbd.com",
    "mashreq":               "mashreqbank.com",
    "first abu dhabi bank":  "bankfab.com",
    "fab":                   "bankfab.com",
    "emirates":              "emirates.com",
    "etihad":                "etihad.ae",
    "flydubai":              "flydubai.com",
    "dp world":              "dpworld.com",
    "adnoc":                 "adnoc.ae",
    "dewa":                  "dewa.gov.ae",
    "du":                    "du.ae",
    "etisalat":              "etisalat.ae",
    "alshaya":               "alshaya.com",
    "majid al futtaim":      "maf.ae",
    "chalhoub":              "chalhoub.com",
    "apparel group":         "apparelglobal.com",
    "landmark group":        "landmarkgroup.com",
    "gmg":                   "gmg.com",
    "lulu":                  "luluhypermarket.com",
    "aldar":                 "aldar.com",
    "emaar":                 "emaar.ae",
    "damac":                 "damacproperties.com",
    "nakheel":               "nakheel.com",
    "deloitte":              "deloitte.com",
    "kpmg":                  "kpmg.com",
    "pwc":                   "pwc.com",
    "pricewaterhousecoopers":"pwc.com",
    "ey":                    "ey.com",
    "ernst & young":         "ey.com",
    "accenture":             "accenture.com",
    "mckinsey":              "mckinsey.com",
    "bain":                  "bain.com",
    "bcg":                   "bcg.com",
    "boston consulting":     "bcg.com",
    "cognizant":             "cognizant.com",
    "tcs":                   "tcs.com",
    "tata consultancy":      "tcs.com",
    "wipro":                 "wipro.com",
    "infosys":               "infosys.com",
    "ibm":                   "ibm.com",
    "microsoft":             "microsoft.com",
    "google":                "google.com",
    "amazon":                "amazon.com",
    "oracle":                "oracle.com",
    "sap":                   "sap.com",
    "datarobot":             "datarobot.com",
    "virtusa":               "virtusa.com",
    "linesight":             "linesight.com",
    "transguard":            "transguardgroup.com",
    "whiteshield":           "whiteshield.ai",
    "michael page":          "michaelpage.ae",
    "robert half":           "roberthalf.com",
    "hays":                  "hays.com",
    "charterhouse":          "charterhouseme.ae",
    "cooper fitch":          "cooperfitch.ae",
    "mark williams":         "markwilliams.com",
    "salt":                  "welovesalt.com",
    "kingston stanley":      "kingstonstanley.com",
    "manpower":              "manpowergroup.com",
    "adecco":                "adecco.com",
    "bac":                   "bacme.com",
    "mackenzie jones":       "mackenziejones.com",
    "nathan & nathan":       "nathannathan.com",
    "black pearl":           "blackpearlconsult.com",
    "tiger recruitment":     "tiger-recruitment.com",
    "stryker":               "stryker.com",
    "aster dm":              "asterdmhealthcare.com",
    "nmc":                   "nmc.ae",
}

# Email patterns to try in order
PATTERNS = ["careers", "jobs", "hr", "recruit", "recruiting",
            "talent", "talentacquisition", "hello", "contact"]


def clean_company(name: str) -> str:
    """Normalize company name for lookup."""
    n = name.lower()
    n = re.sub(r"\b(llc|ltd|inc|group|corp|corporation|company|co\.?|"
               r"plc|pvt|private|limited|fz|fze|fzco|fz-llc|fzllc|"
               r"middle east|me|uae|dubai|abu dhabi|gulf|mena|"
               r"international|global|holdings?|technologies?|tech|"
               r"solutions?|consulting|services|systems?|digital|"
               r"data|ai|labs?)\b", "", n)
    n = re.sub(r"[^a-z0-9\s]", "", n).strip()
    n = re.sub(r"\s+", " ", n)
    return n


def known_domain(company: str) -> Optional[str]:
    """Check overrides map using *whole-word* matching.

    A naïve `k in co` substring check incorrectly matches "noon" inside
    "snoonu", "ey" inside "honeywell", "du" inside "dubai holding", etc.
    Those mismatches cause us to send to the wrong domain and bounce.
    Use regex word boundaries so the company name has to contain the key
    as a discrete token (longer multi-word keys still match left-to-right).
    """
    co = company.lower()
    # Prefer longer keys first so "emirates nbd" wins over plain "emirates"
    for k in sorted(KNOWN_DOMAINS.keys(), key=len, reverse=True):
        if re.search(rf"\b{re.escape(k)}\b", co):
            return KNOWN_DOMAINS[k]
    return None


def guess_domain(company: str) -> str:
    """Best-effort guess of company website domain."""
    clean = clean_company(company).replace(" ", "")
    if len(clean) < 3:
        return ""
    return f"{clean}.com"


def has_mx(domain: str, timeout: float = 3.0) -> bool:
    """Check if a domain has MX records."""
    if not domain:
        return False
    try:
        resolver = dns.resolver.Resolver()
        resolver.timeout = timeout
        resolver.lifetime = timeout
        answers = resolver.resolve(domain, "MX")
        return len(list(answers)) > 0
    except Exception:
        return False


def verify_domain_via_http(domain: str) -> bool:
    """Quick HEAD/GET to see if the domain serves a website."""
    for proto in ("https", "http"):
        try:
            r = requests.head(
                f"{proto}://{domain}",
                timeout=4,
                allow_redirects=True,
                headers={"User-Agent": "Mozilla/5.0"},
            )
            if r.status_code < 500:
                return True
        except Exception:
            continue
    return False


def find_email(company: str) -> Optional[str]:
    """
    Find a likely valid HR/careers email address for a company.
    Returns None if no domain found, else best-guess email.
    """
    if not company or len(company) < 2:
        return None

    # 1. Cache
    cached = db.get_cached_email(company)
    if cached:
        return cached

    # 2. Known domain map
    domain = known_domain(company)
    if not domain:
        # 3. Guess from company name
        guess = guess_domain(company)
        if guess and (has_mx(guess) or verify_domain_via_http(guess)):
            domain = guess

    if not domain:
        return None

    # Prefer careers@ — that's almost universally valid
    chosen = f"careers@{domain}"
    db.cache_email(company, domain, chosen)
    logger.info(f"Resolved {company} → {chosen}")
    return chosen


def all_candidate_emails(domain: str) -> list[str]:
    """Generate every email pattern for the domain."""
    return [f"{p}@{domain}" for p in PATTERNS]
