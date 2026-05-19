"""Validate recipient emails before sending.

Strategy (free + safe):
  1. Syntax check (RFC-light regex).
  2. Reject role addresses on free providers (gmail/yahoo) — those rarely
     belong to recruiters.
  3. Cached validation result (don't re-DNS every send).
  4. MX record lookup via dnspython.
  5. Reject if domain appears in `invalid_emails` (known bounces).

This is not a SaaS verifier — that requires Hunter/NeverBounce/Kickbox APIs.
Adding a paid provider here is one short function away (see verify_paid()).
"""
from __future__ import annotations

import re
from typing import Tuple

import dns.resolver
from loguru import logger

from . import db

EMAIL_RE = re.compile(r"^[A-Za-z0-9._%+\-]+@([A-Za-z0-9.\-]+\.[A-Za-z]{2,})$")

FREE_PROVIDERS = {
    "gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com",
    "live.com", "aol.com", "protonmail.com", "ymail.com", "msn.com",
}

# Caching MX results in-process to avoid repeat DNS per cycle
_mx_memo: dict[str, bool] = {}


_PUBLIC_DNS = ["1.1.1.1", "1.0.0.1", "8.8.8.8", "8.8.4.4", "9.9.9.9"]


def _resolve_mx(domain: str, timeout: float) -> bool:
    """Try system DNS first, then public DNS servers as fallback."""
    candidates = [None, _PUBLIC_DNS]
    for ns in candidates:
        try:
            r = dns.resolver.Resolver()
            r.timeout = timeout
            r.lifetime = timeout
            if ns:
                r.nameservers = ns  # type: ignore[assignment]
            answers = r.resolve(domain, "MX")
            if any(a.exchange.to_text() for a in answers):
                return True
        except dns.resolver.NoAnswer:
            # Domain exists, no MX — try A record fallback (some hosts accept mail on A)
            try:
                r2 = dns.resolver.Resolver()
                r2.timeout = timeout
                r2.lifetime = timeout
                if ns:
                    r2.nameservers = ns  # type: ignore[assignment]
                r2.resolve(domain, "A")
                return True
            except Exception:
                continue
        except Exception:
            continue
    return False


def _has_mx(domain: str, timeout: float = 4.0) -> bool:
    if not domain:
        return False
    domain = domain.lower().strip()
    if domain in _mx_memo:
        return _mx_memo[domain]
    ok = _resolve_mx(domain, timeout)
    _mx_memo[domain] = ok
    return ok


def validate_email(email: str) -> Tuple[bool, str]:
    """Return (valid, reason). Result is cached in SQLite."""
    if not email:
        return False, "empty"
    addr = email.strip().lower()

    # 1. Known-bad list
    if db.is_invalid_email(addr):
        return False, "previous_bounce"

    # 2. Cached validation
    cached = db.get_validation(addr)
    if cached:
        return bool(cached["valid"]), cached.get("reason", "cached")

    # 3. Syntax
    m = EMAIL_RE.match(addr)
    if not m:
        db.cache_validation(addr, False, "invalid_syntax")
        return False, "invalid_syntax"
    domain = m.group(1)

    # 4. Reject role-style address on free providers (probably wrong recruiter)
    local = addr.split("@", 1)[0]
    if domain in FREE_PROVIDERS and local in {
        "careers", "hr", "recruit", "recruiting", "hiring", "jobs",
        "talent", "info", "contact", "support",
    }:
        db.cache_validation(addr, False, "role_on_free_provider")
        return False, "role_on_free_provider"

    # 5. MX present
    if not _has_mx(domain):
        db.cache_validation(addr, False, "no_mx_record")
        return False, "no_mx_record"

    db.cache_validation(addr, True, "ok")
    return True, "ok"


def filter_valid(emails: list[str]) -> list[str]:
    out: list[str] = []
    for e in emails:
        ok, reason = validate_email(e)
        if ok:
            out.append(e)
        else:
            logger.debug(f"skip {e} ({reason})")
    return out
