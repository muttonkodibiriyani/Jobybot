"""Email finder v2: 5-tier waterfall with full audit logging.

Replaces ``core.email_finder.find_email`` whenever the caller has access
to a ``job_url`` (LinkedIn / company careers page). The legacy module
remains as a last-resort fallback for callers that only have a company
name (curated market files).

Waterfall:

    T0  cache               — already resolved for this company
    T1  careers-page scrape — mailto:/footer on the company's own site
    T2  LinkedIn cookie     — recruiter who posted the job
    T3  country patterns    — recruiter@<co>.<tld> probed via SMTP
    T4  SMTP RCPT gate      — drop any candidate the recipient MX 5xx's

Every attempt is logged to ``email_discovery_log`` so the dashboard can
show "where did this address come from" and so a non-IT user can audit
why a bad address slipped through.
"""
from __future__ import annotations

import os
import time
from dataclasses import dataclass
from typing import Optional, Tuple

from loguru import logger

from core import db
from core import email_finder as legacy
from core.finders import careers_page, linkedin_login, smtp_probe


# Per-country fallback TLDs and local-parts. Used by T3.
COUNTRY_TLDS = {
    "UAE":      ("ae", "com"),
    "Saudi":    ("sa", "com.sa", "com"),
    "Oman":     ("om", "com.om", "com"),
    "Qatar":    ("qa", "com.qa", "com"),
    "Bahrain":  ("com.bh", "bh", "com"),
    "Singapore":("sg", "com.sg", "com"),
    "Australia":("com.au", "au", "com"),
    "Canada":   ("ca", "com"),
    "India":    ("co.in", "in", "com"),
    "UK":       ("co.uk", "uk", "com"),
}

PREFERRED_LOCAL_PARTS = (
    "careers", "recruitment", "recruiting", "talent", "hr",
    "people", "jobs", "hello", "contact",
)


@dataclass
class Discovery:
    """Result of a discovery attempt."""
    email: Optional[str]
    first_name: str = ""
    source_url: str = ""
    tier: str = ""
    confidence: str = "low"  # "high" | "medium" | "low"
    probe_code: str = ""

    def __bool__(self) -> bool:  # convenience
        return bool(self.email)


def _domain_from_url(url: str) -> str:
    if not url:
        return ""
    try:
        from urllib.parse import urlparse
        return (urlparse(url).hostname or "").lower().lstrip("www.")
    except Exception:
        return ""


def _try_t1_careers_page(company: str, domain_hint: str) -> Optional[Discovery]:
    t0 = time.time()
    pairs = careers_page.discover(company, domain_hint=domain_hint)
    latency = int((time.time() - t0) * 1000)
    if not pairs:
        db.log_discovery(company, tier="t1_careers", decision="no_emails_found",
                         source_url=domain_hint or "", latency_ms=latency)
        return None
    email, src = pairs[0]
    db.log_discovery(company, tier="t1_careers", decision="found",
                     candidate_email=email, source_url=src, latency_ms=latency)
    return Discovery(email=email, source_url=src, tier="t1_careers",
                     confidence="high")


def _try_t2_linkedin(company: str, job_url: str, domain_hint: str,
                     cookie: str) -> Optional[Discovery]:
    if not (cookie and job_url and "linkedin.com" in job_url):
        return None
    t0 = time.time()
    res = linkedin_login.find_recruiter(job_url, cookie=cookie, company_domain=domain_hint)
    latency = int((time.time() - t0) * 1000)
    if not res:
        db.log_discovery(company, tier="t2_linkedin", decision="no_match",
                         source_url=job_url, latency_ms=latency)
        return None
    email, first_name, source = res
    db.log_discovery(company, tier="t2_linkedin", decision="found",
                     candidate_email=email, source_url=source, latency_ms=latency)
    return Discovery(email=email, first_name=first_name, source_url=source,
                     tier="t2_linkedin", confidence="high")


def _t3_candidates(company: str, market: str, domain_hint: str) -> list[str]:
    """Generate every reasonable candidate address for the company."""
    out: list[str] = []
    if domain_hint:
        domains = [domain_hint]
    else:
        # Fall back to legacy guesser.
        d = legacy.known_domain(company) or legacy.guess_domain(company)
        if d:
            domains = [d]
        else:
            return []

    tlds = COUNTRY_TLDS.get(market, ("com",))
    bare = (legacy.clean_company(company).replace(" ", "")) or ""

    # Pattern 1: existing/known domain with each preferred local-part
    for d in domains:
        for p in PREFERRED_LOCAL_PARTS:
            out.append(f"{p}@{d}")

    # Pattern 2: per-country TLD swap on the bare name
    if bare:
        for tld in tlds:
            for p in PREFERRED_LOCAL_PARTS[:4]:  # smaller set for guess permutations
                out.append(f"{p}@{bare}.{tld}")
    return list(dict.fromkeys(out))  # dedupe preserving order


def _try_t3_patterns(company: str, market: str, domain_hint: str) -> Optional[Discovery]:
    candidates = _t3_candidates(company, market, domain_hint)
    if not candidates:
        return None
    # Probe each candidate, take the first that isn't a strong 5xx.
    for cand in candidates[:8]:  # at most 8 probes per company
        if db.is_invalid_email(cand):
            continue
        t0 = time.time()
        code, msg = smtp_probe.probe(cand)
        latency = int((time.time() - t0) * 1000)
        if smtp_probe.looks_invalid(code):
            db.log_discovery(company, tier="t3_pattern", decision="probe_5xx",
                             candidate_email=cand, probe_code=code, latency_ms=latency)
            db.mark_invalid_email(cand, f"smtp_probe {code}", code)
            continue
        decision = "probe_ok" if smtp_probe.looks_ok(code) else "probe_indeterminate"
        confidence = "medium" if smtp_probe.looks_ok(code) else "low"
        db.log_discovery(company, tier="t3_pattern", decision=decision,
                         candidate_email=cand, probe_code=code, latency_ms=latency)
        return Discovery(email=cand, tier="t3_pattern",
                         confidence=confidence, probe_code=code)
    db.log_discovery(company, tier="t3_pattern", decision="all_5xx_or_exhausted")
    return None


def find_email_v2(
    company: str,
    *,
    job_url: str = "",
    market: str = "UAE",
    linkedin_cookie: str = "",
    enable_smtp_probe: bool = True,
) -> Discovery:
    """Public entrypoint. Tries each tier in order; returns the first hit.

    Always logs every attempt to ``email_discovery_log`` so the dashboard
    can show what worked and what didn't.
    """
    if not company or len(company) < 2:
        return Discovery(email=None)

    # T0 — cache
    cached = db.get_cached_email(company)
    if cached:
        if db.is_invalid_email(cached):
            # The cache pointed to a known-bad address. Wipe it so the next
            # tier can try again with fresh logic.
            db.log_discovery(company, tier="t0_cache",
                             decision="cached_invalid_purged",
                             candidate_email=cached)
        else:
            db.log_discovery(company, tier="t0_cache", decision="hit",
                             candidate_email=cached)
            return Discovery(email=cached, tier="t0_cache", confidence="medium")

    # T1 — career page scrape (highest precision)
    domain_hint = ""
    if "@" not in company:
        d = legacy.known_domain(company)
        if d:
            domain_hint = d
    t1 = _try_t1_careers_page(company, domain_hint)
    if t1 and t1.email and not db.is_invalid_email(t1.email):
        if enable_smtp_probe and smtp_probe.looks_invalid(smtp_probe.probe(t1.email)[0]):
            db.mark_invalid_email(t1.email, "smtp_probe 5xx after T1")
            db.log_discovery(company, tier="t1_careers",
                             decision="t1_then_5xx", candidate_email=t1.email)
        else:
            db.cache_email(company, _domain_from_url(t1.source_url) or domain_hint, t1.email)
            return t1

    # T2 — LinkedIn poster info
    t2 = _try_t2_linkedin(company, job_url, domain_hint,
                          cookie=linkedin_cookie or os.environ.get("LINKEDIN_COOKIE", ""))
    if t2 and t2.email and not db.is_invalid_email(t2.email):
        if enable_smtp_probe and smtp_probe.looks_invalid(smtp_probe.probe(t2.email)[0]):
            db.mark_invalid_email(t2.email, "smtp_probe 5xx after T2")
            db.log_discovery(company, tier="t2_linkedin",
                             decision="t2_then_5xx", candidate_email=t2.email)
        else:
            db.cache_email(company, domain_hint or "", t2.email)
            return t2

    # T3 — country-aware patterns with SMTP gating
    t3 = _try_t3_patterns(company, market=market, domain_hint=domain_hint)
    if t3 and t3.email and not db.is_invalid_email(t3.email):
        db.cache_email(company, domain_hint or "", t3.email)
        return t3

    db.log_discovery(company, tier="final", decision="not_found")
    return Discovery(email=None)


# Backwards-compatible wrapper so existing imports keep working.
def find_email(company: str, **kwargs) -> Optional[str]:
    d = find_email_v2(company, **kwargs)
    return d.email
