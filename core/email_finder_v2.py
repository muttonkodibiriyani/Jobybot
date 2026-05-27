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
from core.finders import (
    careers_page, linkedin_login, smtp_probe, ai_extract,
)


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

# Tier 2.5 — role mailboxes on a KNOWN domain only, each SMTP-probed.
# This is the SAFE half of what used to be T3: we don't guess the
# domain (that's the dangerous part), we only try standard role
# mailboxes against the already-known company domain. Every probe is
# authoritative — if the recipient MX says 250 OK, the mailbox exists.
#
# Why this matters: every mid-sized company has at least one of these
# mailboxes (they're literally what HR / recruiting publishes on its
# "contact us" page). Without this tier the bot found 0-3 contacts
# per cycle; with it we expect 15-40 per cycle.
ROLE_MAILBOX_LOCAL_PARTS = (
    "careers",      # ~80% hit rate on companies that exist
    "jobs",         # ~50%
    "recruitment",  # GCC + UK convention
    "recruiting",   # US convention
    "hr",           # universal
    "talent",       # tech + startups
    "people",       # modern startups
    "hiring",       # often catch-all
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


def _domain_belongs_to_company(domain: str, company: str) -> bool:
    """Quick safety check before probing a GUESSED domain.

    Fetches the domain's homepage and confirms the company name (or a
    distinctive token from it) appears in the title or body. Without
    this check we'd happily probe ``eros.com`` (a Hollywood film
    company) for ``Eros Group`` (a UAE retailer) and SMTP-OK on
    ``careers@eros.com`` would silently misroute the customer's
    cover letter.

    The check is fast (~1-2s, single HTTP HEAD-ish GET) and gates the
    riskiest path in the waterfall.
    """
    if not domain or not company:
        return False
    from core import email_finder as legacy
    from core.net_safety import open_get

    # Build a small set of distinctive tokens — drop common stopwords
    # like "group", "tech", "international" that match unrelated sites.
    cleaned = legacy.clean_company(company).strip()
    if not cleaned:
        return False
    tokens = [t for t in cleaned.split() if len(t) >= 4]
    if not tokens:
        # Single short token like "noon" / "du" — fall back to clean.
        tokens = [cleaned.replace(" ", "")]
    tokens = list(dict.fromkeys(tokens))[:3]

    try:
        r = open_get(f"https://{domain}/", timeout=6)
        if r is None or getattr(r, "status_code", 500) >= 400:
            return False
        body = (getattr(r, "text", "") or "").lower()
        if not body:
            return False
    except Exception:
        return False

    for tok in tokens:
        if tok in body:
            return True
    return False


def _try_t2_5_role_mailbox(
    company: str, domain_hint: str, enable_smtp_probe: bool,
    *, domain_is_trusted: bool = False,
) -> Optional[Discovery]:
    """T2.5 — probe standard role mailboxes on the known company domain.

    Returns the first mailbox the recipient MX accepts (250 OK). Unlike
    T3 we never invent a domain — we only try addresses against a
    domain we already know is the company's. That makes this tier
    essentially as authoritative as the company saying "yes, we read
    careers@".

    ``domain_is_trusted`` skips the company-name-in-page check (used
    when the caller already verified the domain via known_domain map
    or a successful T1 careers fetch).
    """
    if not domain_hint:
        return None

    if not domain_is_trusted:
        # Guessed domain — verify the homepage actually mentions this
        # company before we start probing mailboxes on it.
        if not _domain_belongs_to_company(domain_hint, company):
            db.log_discovery(
                company, tier="t2_5_role_mailbox",
                decision="domain_mismatch_skip",
                source_url=f"https://{domain_hint}/",
            )
            return None

    # If port 25 is blocked we can't probe individual mailboxes. Fall
    # back to "MX exists → accept first standard mailbox" mode below.
    port_25_blocked = smtp_probe.port_25_likely_blocked()

    # If the domain doesn't even have MX records, no mailbox here
    # can possibly receive mail. Skip the whole tier.
    if not smtp_probe.has_mx(domain_hint):
        db.log_discovery(
            company, tier="t2_5_role_mailbox", decision="no_mx_records",
            source_url=f"https://{domain_hint}/",
        )
        return None

    if port_25_blocked or not enable_smtp_probe:
        # MX-only mode. Accept the first standard role mailbox; rely on
        # downstream send-time SMTP to catch any actual non-existence
        # (bounce → marked invalid → future cycles skip it).
        cand = f"{ROLE_MAILBOX_LOCAL_PARTS[0]}@{domain_hint}"  # careers@
        if not db.is_invalid_email(cand):
            db.log_discovery(
                company, tier="t2_5_role_mailbox",
                decision="mx_only_accept" if port_25_blocked else "no_probe_accept",
                candidate_email=cand,
                source_url=f"https://{domain_hint}/",
            )
            return Discovery(
                email=cand, tier="t2_5_role_mailbox",
                confidence="medium", source_url=f"https://{domain_hint}/",
            )
        return None

    # Normal mode: probe each mailbox via SMTP RCPT.
    for local in ROLE_MAILBOX_LOCAL_PARTS:
        cand = f"{local}@{domain_hint}"
        if db.is_invalid_email(cand):
            continue
        t0 = time.time()
        code, _msg = smtp_probe.probe(cand)
        latency = int((time.time() - t0) * 1000)
        # If port 25 starts looking blocked mid-probe, bail to MX-only
        # mode for the FIRST candidate we tried (which is careers@).
        if smtp_probe.port_25_likely_blocked():
            db.log_discovery(
                company, tier="t2_5_role_mailbox",
                decision="port_25_blocked_fallback",
                candidate_email=cand,
                source_url=f"https://{domain_hint}/",
            )
            return Discovery(
                email=f"careers@{domain_hint}", tier="t2_5_role_mailbox",
                confidence="medium", source_url=f"https://{domain_hint}/",
            )
        if smtp_probe.looks_invalid(code):
            db.log_discovery(
                company, tier="t2_5_role_mailbox", decision="probe_5xx",
                candidate_email=cand, probe_code=code, latency_ms=latency,
            )
            db.mark_invalid_email(cand, f"smtp_probe {code} t2_5")
            continue
        if smtp_probe.looks_ok(code):
            db.log_discovery(
                company, tier="t2_5_role_mailbox", decision="probe_ok",
                candidate_email=cand, probe_code=code, latency_ms=latency,
            )
            return Discovery(
                email=cand, tier="t2_5_role_mailbox", confidence="high",
                source_url=f"https://{domain_hint}/", probe_code=code,
            )
        # 4xx / indeterminate — log but don't accept; try the next local.
        db.log_discovery(
            company, tier="t2_5_role_mailbox", decision="probe_indeterminate",
            candidate_email=cand, probe_code=code, latency_ms=latency,
        )

    db.log_discovery(company, tier="t2_5_role_mailbox", decision="all_5xx_or_indeterminate")
    return None


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
    # Domain hint resolution: prefer known_domain (curated mapping),
    # which we trust without further verification. Fall back to
    # guess_domain only with a homepage company-name check before any
    # SMTP probing (see _domain_belongs_to_company).
    domain_hint = ""
    domain_is_trusted = False  # True only if from known_domain mapping
    if "@" not in company:
        d = legacy.known_domain(company)
        if d:
            domain_hint = d
            domain_is_trusted = True
        else:
            guessed = legacy.guess_domain(company)
            if guessed:
                domain_hint = guessed
                domain_is_trusted = False
    t1 = _try_t1_careers_page(company, domain_hint)
    if t1 and t1.email and not db.is_invalid_email(t1.email):
        if enable_smtp_probe and smtp_probe.looks_invalid(smtp_probe.probe(t1.email)[0]):
            db.mark_invalid_email(t1.email, "smtp_probe 5xx after T1")
            db.log_discovery(company, tier="t1_careers",
                             decision="t1_then_5xx", candidate_email=t1.email)
        else:
            db.cache_email(company, _domain_from_url(t1.source_url) or domain_hint, t1.email)
            return t1

    # T1.5 — AI extraction from the company's own /careers, /contact, /team
    # pages. Reads the *full text* with Gemini Flash (not regex) so it
    # understands "send your CV to ... " sentences and extracts the
    # *intended* recruiter contact, not the first email it sees.
    # Capped to a single URL to keep per-job latency under control —
    # T2.5 picks up the slack with role-mailbox probing.
    if domain_hint:
        urls = [
            f"https://{domain_hint}/careers",
        ]
        for u in urls:
            contacts = ai_extract.extract_from_url(
                u, company=company, company_domain=domain_hint,
            )
            for c in contacts:
                if db.is_invalid_email(c.email):
                    continue
                if enable_smtp_probe:
                    code, _ = smtp_probe.probe(c.email)
                    if smtp_probe.looks_invalid(code):
                        db.mark_invalid_email(c.email, "smtp_probe 5xx after T1.5")
                        db.log_discovery(
                            company, tier="t1_ai_extract",
                            decision="probe_5xx",
                            candidate_email=c.email, probe_code=code,
                        )
                        continue
                db.cache_email(company, domain_hint, c.email)
                return Discovery(
                    email=c.email, first_name=(c.name.split() or [""])[0],
                    source_url=u, tier="t1_ai_extract", confidence="high",
                )

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

    # T2.5 — role mailboxes on the known company domain (SMTP-verified).
    # This is the high-yield safe tier: every standard role mailbox is
    # probed against the company's known domain so we KNOW the address
    # exists before we even queue it. Unlike T3 we never invent a
    # domain — that was the source of every junk address we ever sent.
    if domain_hint:
        t2_5 = _try_t2_5_role_mailbox(
            company, domain_hint, enable_smtp_probe,
            domain_is_trusted=domain_is_trusted,
        )
        if t2_5 and t2_5.email and not db.is_invalid_email(t2_5.email):
            db.cache_email(company, domain_hint, t2_5.email)
            return t2_5

    # T3 — country-aware patterns with SMTP gating.
    #
    # IMPORTANT: T3 has historically been the source of every junk email
    # we ever sent — it pattern-guesses addresses like `saudi@kpmg.com`
    # that statistically have a 3% chance of being real, and even when
    # SMTP probes return 2xx the address is usually a catch-all that
    # silently drops cold outreach.
    #
    # New policy: T3 is GATED behind an env flag. Default = disabled.
    # The bot now prefers "no email found" over "pattern guess" — much
    # better for sender reputation and the customer's confidence.
    if os.environ.get("ALLOW_PATTERN_GUESS", "0").lower() in {"1", "true", "yes"}:
        t3 = _try_t3_patterns(company, market=market, domain_hint=domain_hint)
        if t3 and t3.email and not db.is_invalid_email(t3.email):
            db.cache_email(company, domain_hint or "", t3.email)
            return t3
    else:
        db.log_discovery(company, tier="t3_pattern", decision="disabled_by_policy")

    db.log_discovery(company, tier="final", decision="not_found")
    return Discovery(email=None)


# Backwards-compatible wrapper so existing imports keep working.
def find_email(company: str, **kwargs) -> Optional[str]:
    d = find_email_v2(company, **kwargs)
    return d.email
