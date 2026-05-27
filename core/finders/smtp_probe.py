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


# Public DNS resolvers — the system resolver on corporate networks /
# phone hotspots / VPNs often blackholes MX queries. We've observed this
# producing thousands of false "mx_missing" probes that incorrectly
# quarantine perfectly-good recruiter mailboxes (careers@bayzat.com,
# careers@foodics.com, etc. all SMTP-validated via 1.1.1.1 even when the
# system resolver returned timeout).
_PUBLIC_DNS_RESOLVERS = ["1.1.1.1", "8.8.8.8", "9.9.9.9"]


def _best_mx(domain: str, timeout: float = 4.0) -> Optional[str]:
    """Lowest-preference (highest priority) MX host for the domain.

    Falls back from system resolver to public resolvers so a broken
    LAN resolver doesn't poison thousands of probes.
    """
    if not domain:
        return None

    def _query(resolver: dns.resolver.Resolver) -> Optional[str]:
        try:
            answers = sorted(resolver.resolve(domain, "MX"),
                             key=lambda a: a.preference)
            if answers:
                return str(answers[0].exchange).rstrip(".")
        except Exception:
            return None
        return None

    # 1. System resolver (fast path when it works).
    r = dns.resolver.Resolver()
    r.timeout = timeout
    r.lifetime = timeout
    mx = _query(r)
    if mx:
        return mx

    # 2. Public DNS fallback — won't be blocked by phone hotspots etc.
    for ns in _PUBLIC_DNS_RESOLVERS:
        try:
            pub = dns.resolver.Resolver(configure=False)
            pub.nameservers = [ns]
            pub.timeout = timeout
            pub.lifetime = timeout
            mx = _query(pub)
            if mx:
                return mx
        except Exception:
            continue
    return None


# Track whether outbound SMTP (port 25) is reachable on this network.
# If it's not, every probe will time out and we'd reject valid mailboxes
# en masse. We detect this after a small number of failures and then
# stop probing for the rest of the process lifetime — callers should
# fall back to "MX exists → accept with medium confidence" mode.
_PORT_25_BLOCKED_FAILURES = 0
_PORT_25_BLOCKED_THRESHOLD = 3
_PORT_25_BLOCKED = False


def port_25_likely_blocked() -> bool:
    """Set by ``probe()`` once we've seen enough connection timeouts
    to conclude the network is blocking outbound port 25 (a very
    common ISP / corporate policy)."""
    return _PORT_25_BLOCKED


def _bump_port25_block() -> None:
    """Mark a connection failure. After 3 in a row we set the global
    ``_PORT_25_BLOCKED`` flag so callers can switch to MX-only mode."""
    global _PORT_25_BLOCKED_FAILURES, _PORT_25_BLOCKED
    _PORT_25_BLOCKED_FAILURES += 1
    if _PORT_25_BLOCKED_FAILURES >= _PORT_25_BLOCKED_THRESHOLD:
        if not _PORT_25_BLOCKED:
            logger.warning(
                "SMTP port 25 appears blocked on this network. "
                "Switching probe path to 'MX exists → accept' mode "
                "(role mailboxes get medium confidence instead of high)."
            )
        _PORT_25_BLOCKED = True


def has_mx(domain: str, timeout: float = 4.0) -> bool:
    """Public helper: True iff the domain has at least one MX record."""
    return _best_mx(domain, timeout=timeout) is not None


def precheck_port_25(test_domain: str = "google.com",
                     timeout: float = 5.0) -> bool:
    """Try one quick TCP connect to a known MX. Returns True iff we
    can reach port 25. Sets the global block flag on failure so the
    rest of the cycle skips full-probe paths.

    Call this once at the start of a cycle to avoid wasting 30s on
    timeouts per job. Idempotent."""
    global _PORT_25_BLOCKED
    mx = _best_mx(test_domain, timeout=3.0)
    if not mx:
        return False  # DNS broken; treat as blocked-ish
    try:
        with smtplib.SMTP(mx, 25, timeout=timeout) as s:
            try:
                s.ehlo("jobybots.com")
                s.quit()
            except Exception:
                pass
        return True
    except (socket.timeout, TimeoutError, OSError, ConnectionError):
        _PORT_25_BLOCKED = True
        logger.info(
            f"SMTP precheck: outbound port 25 is BLOCKED on this network "
            f"(can't reach {mx}:25). Falling back to MX-only validation "
            f"for role mailboxes."
        )
        return False
    except Exception:
        return False


def probe(
    email: str,
    *,
    from_address: str = "",
    helo_host: str = "jobybots.com",
    timeout: float = 4.0,
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
        _bump_port25_block()
        db.cache_smtp_probe(email, "timeout", "")
        return "timeout", ""
    except (socket.gaierror, ConnectionError, OSError) as e:
        _bump_port25_block()
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
