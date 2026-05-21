"""Outbound HTTP safety helpers — TLS verify, timeouts, host allowlist."""
from __future__ import annotations

import requests

# Hosts Jobybot may contact for job search / domain checks.
# Adding a new source? Append the bare suffix here (e.g. "foo.com").
# The allow-list is enforced for every outbound HTTP GET / HEAD.
ALLOWED_HOST_SUFFIXES = (
    # Major job boards
    "linkedin.com",
    "indeed.com",
    "bayt.com",
    "naukrigulf.com",
    "naukri.com",
    "gulftalent.com",
    "remoteok.com",
    "remoteok.io",
    "glassdoor.com",
    # Company-careers ATS APIs (public, no auth, JSON)
    "greenhouse.io",
    "lever.co",
    "workable.com",
    "ashbyhq.com",
    "smartrecruiters.com",
    "jobvite.com",
    "myworkdayjobs.com",
)

DEFAULT_TIMEOUT = 8


def host_allowed(url: str) -> bool:
    try:
        from urllib.parse import urlparse

        host = (urlparse(url).hostname or "").lower()
    except Exception:
        return False
    if not host:
        return False
    return any(host == s or host.endswith("." + s) for s in ALLOWED_HOST_SUFFIXES)


def safe_get(url: str, **kwargs) -> requests.Response:
    """GET with TLS verify, timeout, and host allowlist."""
    if not host_allowed(url):
        raise ValueError(f"Blocked outbound URL (not a known job site): {url[:80]}")
    kwargs.setdefault("timeout", DEFAULT_TIMEOUT)
    kwargs.setdefault("verify", True)
    return requests.get(url, **kwargs)


def safe_head(url: str, **kwargs) -> requests.Response:
    if not host_allowed(url):
        raise ValueError(f"Blocked outbound URL (not a known job site): {url[:80]}")
    kwargs.setdefault("timeout", DEFAULT_TIMEOUT)
    kwargs.setdefault("verify", True)
    return requests.head(url, **kwargs)


def open_get(url: str, **kwargs) -> requests.Response:
    """Generic HTTP GET for *any* host (e.g. scraping a company careers
    page). Same TLS-verify + timeout defaults as ``safe_get`` but without
    the job-board allowlist.

    Use this only for read-only, public web pages that don't receive any
    of the user's secrets. The bot still uses ``safe_get`` for the job
    boards themselves.
    """
    kwargs.setdefault("timeout", DEFAULT_TIMEOUT)
    kwargs.setdefault("verify", True)
    kwargs.setdefault("allow_redirects", True)
    kwargs.setdefault("headers", {"User-Agent": "Mozilla/5.0 JobyBots-careers-page-finder"})
    return requests.get(url, **kwargs)
