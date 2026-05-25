"""T2: LinkedIn logged-in HR finder (cookie-based).

Uses YOUR LinkedIn ``li_at`` session cookie (NOT credentials) to fetch the
"hiring team" section of a public job page and extract the poster's profile.
From there we look at the profile's contact-info card and any visible
``@`` mention in their experience or about section.

NOTE: This calls LinkedIn endpoints with a session cookie. Treat it as a
courtesy lookup tool, not a scraper:

* Hard cap of LINKEDIN_FINDER_DAILY_CAP lookups per day (default 30).
* Random sleep between requests (4-12 seconds).
* If LinkedIn responds with ``999`` or a login-wall redirect we hard-disable
  the finder for 24 hours and log a warning.
* No login automation: if your cookie expires you must paste a fresh one.

Returns the best (email, source_url) pair we found, or ``None``.
"""
from __future__ import annotations

import json
import os
import random
import re
import time
from typing import Optional, Tuple

import requests
from loguru import logger

from core import db


LINKEDIN_FINDER_DAILY_CAP = int(os.environ.get("LINKEDIN_FINDER_DAILY_CAP", "30"))

EMAIL_RE = re.compile(r"\b([A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,})\b")
NAME_RE = re.compile(r'"firstName":"([^"]+)","lastName":"([^"]+)"')
PROFILE_RE = re.compile(r'"publicIdentifier":"([^"]+)"')

UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/124.0.0.0 Safari/537.36"
)


class LinkedInCookieError(RuntimeError):
    """Raised when the LINKEDIN_COOKIE env var isn't set or has expired."""


def _session(cookie: str) -> requests.Session:
    s = requests.Session()
    s.headers.update({
        "User-Agent": UA,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
    })
    s.cookies.set("li_at", cookie, domain=".linkedin.com")
    return s


def _check_login_wall(resp: requests.Response) -> bool:
    """LinkedIn returns 999 / 403 / a login redirect when your cookie has
    expired or rate-limit is hit."""
    if resp.status_code in (403, 429, 451, 999):
        return True
    if resp.status_code in (301, 302) and "login" in (resp.headers.get("Location") or "").lower():
        return True
    if "checkpoint/lg/login" in (resp.url or "").lower():
        return True
    return False


def _polite_sleep() -> None:
    time.sleep(random.uniform(4.0, 12.0))


def _within_quota() -> bool:
    return db.linkedin_lookups_today() < LINKEDIN_FINDER_DAILY_CAP


# Free-mail providers — never a recruiter's *work* address. If we see one
# here it's almost always the LinkedIn user's OWN signature, not the
# recruiter we're targeting. Reject ruthlessly.
_FREE_MAIL_DOMAINS = {
    "gmail.com", "googlemail.com", "yahoo.com", "yahoo.co.uk", "yahoo.co.in",
    "outlook.com", "hotmail.com", "live.com", "msn.com", "icloud.com",
    "me.com", "aol.com", "protonmail.com", "proton.me", "ymail.com",
    "rediffmail.com", "zoho.com", "mail.com", "gmx.com",
}

# Boilerplate addresses that surface in LinkedIn page chrome / footer.
_LINKEDIN_BOILERPLATE = (
    "noreply@", "no-reply@", "support@", "press@", "help@", "feedback@",
    "abuse@", "sales-",
    "info@linkedin.com", "info@licdn.com", "donotreply@",
)


def _user_own_email() -> str:
    """The customer's OWN gmail (from .env). T2 must never attribute this
    to a company — that's the bug that produced 21 fake 'recruiter'
    emails all pointing to `tarakesh.reddy89@gmail.com` in the discovery
    log. We special-case it as a hard exclusion.
    """
    try:
        from config import get_settings
        s = get_settings()
        return (s.gmail_address or s.user_email or "").lower().strip()
    except Exception:
        return ""


def _should_reject(addr: str) -> bool:
    """Hard-rejects we apply to every LinkedIn-sourced candidate."""
    a = addr.lower()
    if not a or "@" not in a:
        return True
    if a.startswith(_LINKEDIN_BOILERPLATE):
        return True
    if a.endswith(("@linkedin.com", "@licdn.com")):
        return True
    domain = a.rsplit("@", 1)[1]
    if domain in _FREE_MAIL_DOMAINS:
        return True  # T2 must return a *work* email, never personal
    if a == _user_own_email():
        return True  # never attribute the customer's own email to a company
    return False


def _peek_recruiter_email(html: str, company_domain: str) -> Optional[str]:
    """Return the FIRST email on the page whose host matches the company
    domain (or one of its subdomains). This is the only T2 path that is
    safe: domain-anchored, hard-filtered against free-mail providers and
    the user's own address.
    """
    if not company_domain:
        return None
    own = _user_own_email()
    cd = company_domain.lower().lstrip(".")
    for m in EMAIL_RE.finditer(html or ""):
        addr = m.group(1).lower()
        if addr == own:
            continue
        if _should_reject(addr):
            continue
        host = addr.rsplit("@", 1)[1]
        if host == cd or host.endswith("." + cd):
            return addr
    return None


def _domain_anchored_email_anywhere(html: str, company_domain: str) -> Optional[str]:
    """Looser pass: same domain match, but we tolerate the address
    appearing in any context (about / experience / featured posts).
    Still rejects free-mail + boilerplate + the user's own address.
    """
    return _peek_recruiter_email(html, company_domain)


def _extract_poster_profile(job_html: str) -> Optional[str]:
    """Find the LinkedIn profile URL of the job poster from a job page."""
    if not job_html:
        return None
    m = PROFILE_RE.search(job_html)
    if m:
        return f"https://www.linkedin.com/in/{m.group(1)}"
    m = re.search(r"linkedin\.com/in/([A-Za-z0-9\-_]+)", job_html)
    if m:
        return f"https://www.linkedin.com/in/{m.group(1)}"
    return None


def find_recruiter(
    job_url: str,
    cookie: str = "",
    company_domain: str = "",
) -> Optional[Tuple[str, str, str]]:
    """Best-effort lookup.

    Returns ``(email, recruiter_first_name, source_url)`` or None.
    """
    cookie = (cookie or os.environ.get("LINKEDIN_COOKIE", "")).strip()
    if not cookie:
        return None
    if not job_url or "linkedin.com" not in job_url:
        return None

    if not _within_quota():
        logger.info(
            f"LinkedIn finder: daily cap ({LINKEDIN_FINDER_DAILY_CAP}) reached, "
            "skipping until tomorrow."
        )
        return None

    s = _session(cookie)
    try:
        r = s.get(job_url, timeout=10, allow_redirects=True)
        db.bump_linkedin_lookup()
    except Exception as e:
        logger.warning(f"LinkedIn finder: job fetch failed: {e}")
        return None
    if _check_login_wall(r):
        logger.warning("LinkedIn finder: login wall / 999 — cookie likely expired.")
        return None

    profile_url = _extract_poster_profile(r.text)
    if not profile_url:
        return None

    _polite_sleep()

    try:
        pr = s.get(profile_url, timeout=10, allow_redirects=True)
        db.bump_linkedin_lookup()
    except Exception:
        return None
    if _check_login_wall(pr):
        return None

    html = pr.text or ""
    first_name = ""
    m = NAME_RE.search(html)
    if m:
        first_name = m.group(1)

    # Only accept a domain-anchored work email. NEVER fall back to "first
    # email on the page" — that's the bug that returned the customer's
    # own gmail 21 times as if it were a recruiter at 21 different
    # companies. If the recruiter doesn't put their work email on the
    # profile, T2 returns None and the waterfall continues to T3/T4.
    addr = _peek_recruiter_email(html, company_domain)
    if not addr:
        # Try the dedicated contact-info modal endpoint — same hard
        # rejection rules apply.
        try:
            ident = profile_url.rstrip("/").split("/")[-1]
            ci = s.get(
                f"https://www.linkedin.com/in/{ident}/overlay/contact-info/",
                timeout=10,
            )
            db.bump_linkedin_lookup()
            if not _check_login_wall(ci):
                addr = _peek_recruiter_email(ci.text, company_domain)
        except Exception:
            pass

    if not addr:
        return None
    return addr, first_name, profile_url
