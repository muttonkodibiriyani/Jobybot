"""SMTP RCPT-only probe: ask the recipient's MX whether the mailbox exists.

We open an SMTP conversation to the domain's lowest-priority MX, send
``MAIL FROM`` and ``RCPT TO``, then immediately QUIT. No ``DATA`` is ever
transmitted — so no email is delivered, no opens are tracked, and we
generate no log entries on the recipient's side.

CAVEAT: Large providers (Google, Microsoft, Mimecast, Proofpoint) routinely
accept all RCPTs to defeat email enumeration, so a 2xx is only a *weak*
positive. A 5xx, however, is a strong negative — those addresses are
permanently invalid and we cache them.
"""
from __future__ import annotations

import smtplib
import socket
from typing import Optional, Tuple

import dns.resolver
from loguru import logger

from core import db


def _best_mx(domain: str, timeout: float = 4.0) -> Optional[str]:
    """Lowest-preference (highest priority) MX host for the domain."""
    try:
        r = dns.resolver.Resolver()
        r.timeout = timeout
        r.lifetime = timeout
        answers = sorted(r.resolve(domain, "MX"), key=lambda a: a.preference)
        if answers:
            return str(answers[0].exchange).rstrip(".")
    except Exception:
        return None
    return None


def probe(
    email: str,
    *,
    from_address: str = "",
    helo_host: str = "jobybots.com",
    timeout: float = 7.0,
) -> Tuple[str, str]:
    """Return ``(code, message)`` after an SMTP RCPT probe.

    ``code`` is the textual SMTP code (e.g. ``"250"``) or ``"timeout"`` /
    ``"mx_missing"`` / ``"connect_failed"``.
    """
    cached = db.get_smtp_probe(email)
    if cached and cached.get("code"):
        return str(cached["code"]), str(cached.get("message", "") or "")

    if "@" not in email:
        return "syntax", "no_at"
    domain = email.rsplit("@", 1)[1]
    mx = _best_mx(domain)
    if not mx:
        db.cache_smtp_probe(email, "mx_missing", "no MX record")
        return "mx_missing", "no MX record"

    fr = from_address or f"verify@{helo_host}"

    try:
        with smtplib.SMTP(mx, 25, timeout=timeout) as s:
            try:
                s.ehlo(helo_host)
            except smtplib.SMTPException:
                s.helo(helo_host)
            try:
                s.starttls()
                s.ehlo(helo_host)
            except Exception:
                pass
            try:
                code, msg = s.mail(fr)
            except smtplib.SMTPException as e:
                code, msg = (550, str(e).encode())
            if code >= 400:
                cstr = str(code)
                db.cache_smtp_probe(email, cstr, msg.decode("ascii", "replace") if isinstance(msg, bytes) else str(msg))
                return cstr, msg.decode("ascii", "replace") if isinstance(msg, bytes) else str(msg)
            code, msg = s.rcpt(email)
            try:
                s.quit()
            except Exception:
                pass
    except (socket.timeout, TimeoutError):
        db.cache_smtp_probe(email, "timeout", "")
        return "timeout", ""
    except (socket.gaierror, ConnectionError, OSError) as e:
        db.cache_smtp_probe(email, "connect_failed", str(e)[:120])
        return "connect_failed", str(e)[:120]
    except smtplib.SMTPException as e:
        db.cache_smtp_probe(email, "smtp_error", str(e)[:120])
        return "smtp_error", str(e)[:120]

    msg_text = msg.decode("ascii", "replace") if isinstance(msg, bytes) else str(msg)
    cstr = str(code)
    db.cache_smtp_probe(email, cstr, msg_text)
    return cstr, msg_text


def looks_invalid(code: str) -> bool:
    """True if the SMTP code is a strong "user unknown" signal."""
    if not code:
        return False
    if code.startswith("5"):
        return True
    if code in {"mx_missing", "syntax"}:
        return True
    return False


def looks_ok(code: str) -> bool:
    """True if the SMTP code is a strong "exists" signal."""
    return bool(code) and code.startswith("2")
