"""T1: Find recruiter emails by scraping the company's own website.

This is the highest-precision tier — we only return an address if it was
actually published by the company itself (mailto link, footer text, or a
careers/contact page). Falls back through likely paths:

    https://<domain>/
    https://<domain>/careers
    https://<domain>/careers/contact
    https://<domain>/about/contact
    https://<domain>/contact
    https://<domain>/contact-us
    https://<domain>/jobs

Returns a list of (email, source_url) pairs, deduplicated.
"""
from __future__ import annotations

import re
from typing import List, Optional, Set, Tuple

from loguru import logger

from core.net_safety import open_get as _http_get


CANDIDATE_PATHS: Tuple[str, ...] = (
    # Standard
    "/",
    "/careers",
    "/careers/contact",
    "/careers/contact-us",
    "/careers/our-people",
    "/careers/team",
    "/about/contact",
    "/about/careers",
    "/about/team",
    "/about/people",
    "/contact",
    "/contact-us",
    "/contactus",
    "/jobs",
    "/jobs/contact",
    "/work-with-us",
    "/join-us",
    # Less common but high-signal
    "/team",
    "/people",
    "/leadership",
    "/press",
    "/press-contact",
    "/media",
    "/investor-relations",
    "/investors",
    # Region-coded sub-paths used by big consultancies
    "/uae/contact",
    "/me/contact",
    "/ae/contact",
    "/en-ae/contact",
    "/en/contact",
)

MAILTO_RE = re.compile(r'href\s*=\s*["\']mailto:([A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,})', re.IGNORECASE)
RAW_EMAIL_RE = re.compile(r'\b([A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,})\b')

# Email prefixes we trust (recruiter-shaped). If we find these on the
# company's own domain, they are very likely real.
TRUSTED_LOCAL_PARTS: Tuple[str, ...] = (
    "careers",
    "career",
    "recruit",
    "recruiting",
    "recruitment",
    "hr",
    "people",
    "talent",
    "talentacquisition",
    "jobs",
    "joinus",
    "hello",
    "contact",
    "info",
)

# Email prefixes that look like recruiters even if a personal name appears
RECRUITER_KEYWORDS = ("recruit", "talent", "hiring", "people-team")


def _likely_recruiter_email(addr: str, domain: str) -> bool:
    """True if the address looks like a recruiter/HR mailbox on the company domain."""
    addr_low = addr.lower()
    local, _, host = addr_low.partition("@")
    if not host:
        return False
    # Domain must match the company domain (or a subdomain of it). This
    # filters out unrelated emails (analytics, support partners, etc.).
    if not (host == domain or host.endswith("." + domain)):
        return False
    if local in TRUSTED_LOCAL_PARTS:
        return True
    if any(k in local for k in RECRUITER_KEYWORDS):
        return True
    return False


def _extract_emails(html: str, domain: str) -> Set[str]:
    """Pull every mailto link + every raw `@domain` match from HTML."""
    found: Set[str] = set()
    if not html:
        return found

    for m in MAILTO_RE.finditer(html):
        found.add(m.group(1).lower())
    for m in RAW_EMAIL_RE.finditer(html):
        found.add(m.group(1).lower())

    # Keep only the addresses on the company's own domain (or sub).
    return {a for a in found if _likely_recruiter_email(a, domain)}


def discover_from_domain(domain: str, *, timeout: float = 6.0,
                         max_paths: int = 8) -> List[Tuple[str, str]]:
    """Crawl up to ``max_paths`` likely pages on the company domain and
    return distinct (email, source_url) pairs in order of preference.
    """
    if not domain:
        return []
    domain = domain.lower().strip()

    seen: Set[str] = set()
    pairs: List[Tuple[str, str]] = []

    base_options = [f"https://{domain}", f"https://www.{domain}"]
    paths_remaining = max_paths

    for base in base_options:
        for path in CANDIDATE_PATHS:
            if paths_remaining <= 0:
                break
            url = base + path
            try:
                r = _http_get(url, timeout=timeout)
                if r is None or getattr(r, "status_code", 500) >= 400:
                    continue
                html = getattr(r, "text", "") or ""
                if not html:
                    continue
            except Exception:
                continue
            paths_remaining -= 1
            emails = _extract_emails(html, domain)
            for e in sorted(emails, key=lambda a: TRUSTED_LOCAL_PARTS.index(a.split("@", 1)[0])
                            if a.split("@", 1)[0] in TRUSTED_LOCAL_PARTS else 99):
                if e in seen:
                    continue
                seen.add(e)
                pairs.append((e, url))
        if pairs:
            # Stop after first base that yielded results — avoid duplicating
            # work across www. and root.
            break

    return pairs


def discover(company_name: str, domain_hint: Optional[str] = None) -> List[Tuple[str, str]]:
    """Public entrypoint. ``domain_hint`` skips guessing if known."""
    domain = (domain_hint or "").lower().strip()
    if not domain:
        # Fall back to email_finder's guess machinery.
        from core import email_finder
        d = email_finder.known_domain(company_name)
        if not d:
            d = email_finder.guess_domain(company_name)
        domain = d or ""
    if not domain:
        return []
    return discover_from_domain(domain)
