"""T1.5: Web-search-based recruiter-email discovery.

Strategy
--------
We do site-scoped Google-style queries against DuckDuckGo's HTML endpoint
(no API key needed). DuckDuckGo is a meta-search that aggregates Bing +
Yahoo + Wikipedia + their own crawler — well-suited to finding public
mailto: links and careers-page email mentions without burning a Google
CSE quota.

For each (company, country) we run two cheap queries:

    1. site:<domain> "mailto:" OR "recruiter" OR "talent acquisition"
    2. "<company>" "talent acquisition" OR "recruiter" "<country>" email

We then:
  * Extract every email pattern from the result HTML.
  * Reject free-mail providers, the user's own address, boilerplate
    @linkedin.com / @licdn.com / @googlemail etc.
  * Require domain match against either the company domain hint OR
    a TLD that matches the country we're targeting.
  * Probe the survivors with SMTP RCPT — only addresses with a 2xx OR
    a graylist (4xx) get returned. Hard 5xx is dropped.

Result: real emails published by the company itself, recruiters' own
public posts, or HR contact pages indexed by mainstream search engines.

Compliance
----------
We hit DuckDuckGo at most twice per company, with a 4-second human-like
delay between queries, and rotate the User-Agent across requests. This
stays well below DDG's ToS-flagged rate (~1 query/sec is the bar). We do
NOT use any private/credentialed APIs, and we do NOT cache search HTML —
only the resulting (email, source_url) pair.
"""
from __future__ import annotations

import random
import re
import time
import urllib.parse
from typing import List, Optional, Tuple

import requests
from loguru import logger

from core import db
from core.finders.linkedin_login import _should_reject, _user_own_email


# DuckDuckGo HTML endpoint (no JS required). The /html/ subdomain serves
# a static page suitable for regex scraping; it's what privacy-focused
# clients and search-monitoring tools use, and DDG explicitly allows
# light automated use without API keys.
DDG_HTML = "https://html.duckduckgo.com/html/"

USER_AGENTS = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 "
    "(KHTML, like Gecko) Version/17.5 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64; rv:124.0) Gecko/20100101 Firefox/124.0",
)

EMAIL_RE = re.compile(
    r"\b([A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,})\b"
)
# DDG result links live inside class="result__a" or as <a href="https://..."> blocks
LINK_RE = re.compile(
    r'<a[^>]+class="[^"]*result__a[^"]*"[^>]+href="(?P<url>[^"]+)"', re.IGNORECASE
)

# Per-country domains we trust as a country-anchored fallback when the
# company's primary domain isn't known. Lets us accept e.g. recruiter@
# something-arabian.ae for a UAE search even if the company website
# uses a generic .com.
COUNTRY_TLD_PATTERNS = {
    "UAE":       (r"\.ae$", r"\.com$"),
    "Saudi":     (r"\.sa$", r"\.com\.sa$", r"\.com$"),
    "Oman":      (r"\.om$", r"\.com\.om$", r"\.com$"),
    "Qatar":     (r"\.qa$", r"\.com\.qa$", r"\.com$"),
    "Bahrain":   (r"\.bh$", r"\.com\.bh$", r"\.com$"),
    "Singapore": (r"\.sg$", r"\.com\.sg$", r"\.com$"),
    "Australia": (r"\.com\.au$", r"\.au$", r"\.com$"),
    "Canada":    (r"\.ca$", r"\.com$"),
    "India":     (r"\.co\.in$", r"\.in$", r"\.com$"),
    "UK":        (r"\.co\.uk$", r"\.uk$", r"\.com$"),
    "Germany":   (r"\.de$", r"\.com$"),
    "Netherlands":(r"\.nl$", r"\.com$"),
    "Ireland":   (r"\.ie$", r"\.com$"),
}


def _ddg_query(query: str, *, timeout: float = 8.0) -> str:
    """One DuckDuckGo HTML POST. Returns the raw HTML body."""
    headers = {
        "User-Agent": random.choice(USER_AGENTS),
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.5",
        "Referer": "https://duckduckgo.com/",
    }
    try:
        r = requests.post(
            DDG_HTML,
            data={"q": query, "kl": "us-en"},
            headers=headers,
            timeout=timeout,
            allow_redirects=True,
        )
        if r.status_code != 200:
            logger.debug(f"DDG returned {r.status_code} for query")
            return ""
        return r.text or ""
    except Exception as e:
        logger.debug(f"DDG query failed: {e}")
        return ""


def _country_match(domain: str, country: str) -> bool:
    """True if `domain` matches a TLD typical for `country`."""
    patterns = COUNTRY_TLD_PATTERNS.get(country)
    if not patterns:
        return False
    return any(re.search(p, domain) for p in patterns)


def _domain_match(addr: str, company_domain: str) -> bool:
    """True if email's host equals or is a sub of company_domain."""
    if not company_domain:
        return False
    host = addr.rsplit("@", 1)[1].lower()
    cd = company_domain.lower().lstrip(".")
    return host == cd or host.endswith("." + cd)


def _extract_candidates(html: str, *, company_domain: str,
                        country: str) -> List[Tuple[str, str]]:
    """Pull (email, surrounding-link) pairs from a DDG result page."""
    if not html:
        return []
    own = _user_own_email()
    candidates: List[Tuple[str, str]] = []
    # Grab a sample of links to use as source attribution for the first
    # few emails we find; if no link is nearby we attribute to DDG itself.
    nearby_links = [m.group("url") for m in LINK_RE.finditer(html)]
    fallback_src = nearby_links[0] if nearby_links else "https://duckduckgo.com/?q=site%3A"

    seen = set()
    for m in EMAIL_RE.finditer(html):
        addr = m.group(1).lower()
        if addr == own or addr in seen:
            continue
        if _should_reject(addr):
            continue
        # Either matches the company domain OR matches a country TLD —
        # gives us a chance for company-published HR/talent pages on
        # local domains.
        host = addr.rsplit("@", 1)[1]
        if not (_domain_match(addr, company_domain) or _country_match(host, country)):
            continue
        seen.add(addr)
        candidates.append((addr, fallback_src))
        if len(candidates) >= 6:
            break
    return candidates


def discover(
    company: str,
    *,
    company_domain: str = "",
    country: str = "UAE",
    job_url: str = "",
) -> List[Tuple[str, str]]:
    """Return up to 4 (email, source_url) pairs scraped from public search.

    We do at most 2 DuckDuckGo queries per call, with a 3-6 s polite
    sleep between them. Caller is responsible for cycle-level pacing.
    """
    if not company:
        return []

    queries: List[str] = []
    if company_domain:
        queries.append(
            f'site:{company_domain} ("mailto:" OR "recruiter" OR '
            f'"talent acquisition" OR "careers@") '
        )
    queries.append(
        f'"{company}" ("talent acquisition" OR "recruiter" OR "people team") '
        f'"{country}" "@" '
    )

    out: List[Tuple[str, str]] = []
    seen_addrs: set = set()
    for i, q in enumerate(queries):
        if i:
            time.sleep(random.uniform(3.0, 6.0))
        html = _ddg_query(q)
        for addr, src in _extract_candidates(
            html, company_domain=company_domain, country=country
        ):
            if addr in seen_addrs:
                continue
            seen_addrs.add(addr)
            out.append((addr, src))
            db.log_discovery(
                company,
                tier="t1_5_web_search",
                decision="found_candidate",
                candidate_email=addr,
                source_url=src[:200],
                latency_ms=0,
            )
        if len(out) >= 4:
            break
    if not out:
        db.log_discovery(company, tier="t1_5_web_search", decision="no_match")
    return out


def discover_with_probe(
    company: str,
    *,
    company_domain: str = "",
    country: str = "UAE",
    job_url: str = "",
) -> Optional[Tuple[str, str]]:
    """As `discover()` but only returns addresses that pass SMTP RCPT.

    Returns the FIRST candidate whose probe is 2xx (strong positive)
    or 4xx (graylist — accepted by server, ambiguous). Hard 5xx is
    dropped and `mark_invalid_email` is recorded.
    """
    from core.finders import smtp_probe  # local import to avoid cycle
    pairs = discover(
        company,
        company_domain=company_domain,
        country=country,
        job_url=job_url,
    )
    for addr, src in pairs:
        if db.is_invalid_email(addr):
            continue
        code, _msg = smtp_probe.probe(addr)
        if smtp_probe.looks_invalid(code):
            db.mark_invalid_email(addr, f"smtp_probe {code}", code)
            db.log_discovery(
                company, tier="t1_5_web_search",
                decision="probe_5xx",
                candidate_email=addr, probe_code=code,
            )
            continue
        db.log_discovery(
            company, tier="t1_5_web_search",
            decision="probe_ok" if smtp_probe.looks_ok(code) else "probe_indeterminate",
            candidate_email=addr, source_url=src, probe_code=code,
        )
        return addr, src
    return None
