"""Outbound HTTP safety helpers — TLS verify, timeouts, host allowlist."""
from __future__ import annotations

import requests

# Hosts Jobybot may contact for job search / domain checks
ALLOWED_HOST_SUFFIXES = (
    "linkedin.com",
    "indeed.com",
    "bayt.com",
    "naukrigulf.com",
    "remoteok.com",
    "remoteok.io",
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
