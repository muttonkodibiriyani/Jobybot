"""Read Gmail mailbox for bounce / NDR notifications and learn bad addresses.

Rewritten 2026-05-22:

The previous version only recognised "Mailer-Daemon" / "postmaster" senders
and required RFC 3464 DSN headers in the body. This silently missed:

  - Modern Gmail NDRs from ``mailer-daemon@googlemail.com`` whose machine
    headers are sometimes only in the attached ``message/delivery-status``
    part and whose human-readable body says ``The response was: 550 ...``.
  - Custom corporate NDRs like ``EY Support`` ("Your email was not
    processed"), Microsoft Exchange ("Your message couldn't be delivered"),
    Mimecast ("Recipient address rejected"), Proofpoint, etc.
  - "Final-Recipient" entries split across lines (Outlook / Exchange wraps).

This version detects bounces via a layered strategy and falls back to
**subject correlation** against ``emails_sent``: if a bounce-shaped reply
arrives whose subject equals one of our outgoing subjects, we mark the
*original recipient* as invalid even if no machine address was extractable.
"""
from __future__ import annotations

import email
import imaplib
import re
import datetime as dt
from email.header import decode_header
from email.message import Message
from pathlib import Path
from typing import List, Optional, Sequence, Set, Tuple

from loguru import logger

from . import db


# Senders that ALWAYS indicate a bounce (case-insensitive substring match)
BOUNCE_SENDERS: Tuple[str, ...] = (
    "mailer-daemon",
    "postmaster",
    "mail delivery subsystem",
    "mail delivery system",
    "mail-delivery",
    "mail delivery agent",
    "delivery-status",
    "delivery.status",
    "noreply",
    "no-reply",
    "do-not-reply",
    "donotreply",
    "bounce",
    "bounces",
    "bouncehandler",
    "mimecast",
    "proofpoint",
    "barracuda",
    "ironport",
    "messagelabs",
)

# Subject phrases that signal a bounce regardless of sender (e.g. EY Support).
BOUNCE_SUBJECT_PHRASES: Tuple[str, ...] = (
    "delivery status notification",
    "undeliverable",
    "undelivered mail",
    "undelivered mail returned",
    "address not found",
    "address rejected",
    "mail delivery failed",
    "delivery failure",
    "delivery has failed",
    "mail could not be delivered",
    "could not be delivered",
    "failure notice",
    "returned mail",
    "your email was not processed",
    "your message couldn't be delivered",
    "your message could not be delivered",
    "message blocked",
    "message rejected",
    "permanent failure",
    "550 ",
    "recipient address rejected",
    "user unknown",
    "no such user",
    "mailbox unavailable",
    "mailbox full",
    "quota exceeded",
)

# Recipient extractors — tried in order, first match wins.
RCPT_PATTERNS: Tuple[re.Pattern, ...] = (
    # RFC 3464 machine-readable lines
    re.compile(r"Final-Recipient\s*:\s*(?:rfc822|RFC822)\s*;\s*([A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,})",
               re.IGNORECASE),
    re.compile(r"Original-Recipient\s*:\s*(?:rfc822|RFC822)\s*;\s*([A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,})",
               re.IGNORECASE),
    # Human-readable patterns from Gmail / Microsoft / Mimecast / Proofpoint
    re.compile(r"(?:to|for)\s*<\s*([A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,})\s*>", re.IGNORECASE),
    re.compile(r"failed recipient[:\s]+([A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,})", re.IGNORECASE),
    re.compile(r"recipient[:\s]+([A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,})\s+(?:was rejected|rejected|not found|unknown)",
               re.IGNORECASE),
    # "Address not found ... 550 5.1.1 ... user@host"
    re.compile(r"5\d{2}[ \-]?\d?\.\d\.\d.+?([A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,})", re.IGNORECASE | re.DOTALL),
    # Generic "address not found" + later email
    re.compile(r"address not found.{0,200}?([A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,})", re.IGNORECASE | re.DOTALL),
)

STATUS_RE = re.compile(r"\b(\d\.\d\.\d)\b")
SMTP_CODE_RE = re.compile(r"\b(5\d{2}|4\d{2})\b")

# Local addresses to ignore even if regex matches them — those are our own.
SELF_DOMAINS_DEFAULT = ("gmail.com", "googlemail.com")

# How many messages to fetch per scan to keep IMAP fast.
DEFAULT_FETCH_LIMIT = 500
BACKFILL_FETCH_LIMIT = 5000

CURSOR_TABLE_INIT = """
CREATE TABLE IF NOT EXISTS bounce_cursor (
    folder      TEXT PRIMARY KEY,
    last_uid    INTEGER NOT NULL,
    updated_at  TEXT NOT NULL
);
"""


# ── helpers ────────────────────────────────────────────────────────
def _decode(s: str) -> str:
    """RFC 2047 decode of headers like Subject / From."""
    if not s:
        return ""
    try:
        parts = decode_header(s)
        return "".join(
            (b.decode(enc or "utf-8", errors="replace") if isinstance(b, bytes) else b)
            for b, enc in parts
        )
    except Exception:
        return s


def _all_text(msg: Message) -> str:
    """Walk every MIME part and return the concatenated decoded text body.

    Unlike the previous version, we DO NOT filter by content-type — modern
    NDRs sometimes put the failed recipient inside an attached original
    message (``message/rfc822`` -> ``text/html``) or inside an Exchange
    ``application/ms-tnef`` wrapper that decodes to text.
    """
    chunks: List[str] = []
    for part in msg.walk():
        try:
            ctype = part.get_content_type()
            if ctype.startswith("multipart/"):
                continue
            payload = part.get_payload(decode=True)
            if payload is None:
                continue
            charset = part.get_content_charset() or "utf-8"
            chunks.append(payload.decode(charset, errors="replace"))
        except Exception:
            continue
    return "\n".join(chunks)


def _extract_recipients(text: str, self_domains: Sequence[str]) -> Set[str]:
    """Run every recipient regex and return matches that aren't our own
    Gmail address or known noreply senders.
    """
    found: Set[str] = set()
    for pat in RCPT_PATTERNS:
        for m in pat.finditer(text):
            addr = m.group(1).strip().lower()
            domain = addr.rsplit("@", 1)[-1]
            if domain in self_domains:
                continue
            if addr.startswith(("postmaster@", "mailer-daemon@", "noreply@",
                                "no-reply@", "donotreply@")):
                continue
            found.add(addr)
    return found


def _extract_status_code(text: str) -> str:
    """Best-effort SMTP status, e.g. ``5.1.1`` or ``550``."""
    m = STATUS_RE.search(text)
    if m:
        return m.group(1)
    m = SMTP_CODE_RE.search(text)
    return m.group(1) if m else ""


def _looks_like_bounce(from_hdr: str, subject: str) -> bool:
    """True if the message is a delivery-failure-type message."""
    f = (from_hdr or "").lower()
    s = (subject or "").lower()
    if any(b in f for b in BOUNCE_SENDERS):
        return True
    if any(p in s for p in BOUNCE_SUBJECT_PHRASES):
        return True
    return False


def _subject_correlation(subject: str) -> Optional[str]:
    """If a bounce subject contains our outgoing subject string, return the
    original recipient(s) we sent to with that subject.

    Gmail bounces typically prefix with ``Delivery Status Notification`` or
    quote the original subject after ``Re:`` / a colon. We strip common
    prefixes and look up the bare subject in ``emails_sent``.
    """
    if not subject:
        return None
    bare = subject
    for prefix in (
        "Delivery Status Notification (Failure):",
        "Delivery Status Notification (Failure)",
        "Delivery Status Notification (Delay):",
        "Delivery Status Notification:",
        "Delivery Status Notification",
        "Undeliverable:",
        "Undelivered Mail Returned to Sender:",
        "Undelivered Mail Returned to Sender",
        "Mail delivery failed:",
        "Returned mail:",
        "Returned mail",
        "Failure Notice:",
        "Failure Notice",
        "Re:",
        "Fwd:",
        "Fw:",
    ):
        if bare.lower().startswith(prefix.lower()):
            bare = bare[len(prefix):].strip(": \t")
            break
    bare = bare.strip()
    if len(bare) < 8:
        return None

    # Look up the most recent outgoing email with this exact subject.
    try:
        import sqlite3
        con = sqlite3.connect(db.DB_PATH)
        con.row_factory = sqlite3.Row
        row = con.execute(
            "SELECT recipient FROM emails_sent WHERE subject = ? "
            "ORDER BY sent_at DESC LIMIT 1",
            (bare,),
        ).fetchone()
        con.close()
        return row["recipient"] if row else None
    except Exception:
        return None


# ── cursor ─────────────────────────────────────────────────────────
def _ensure_cursor_table() -> None:
    import sqlite3
    con = sqlite3.connect(db.DB_PATH)
    con.executescript(CURSOR_TABLE_INIT)
    con.commit()
    con.close()


def _get_cursor(folder: str) -> int:
    _ensure_cursor_table()
    import sqlite3
    con = sqlite3.connect(db.DB_PATH)
    row = con.execute("SELECT last_uid FROM bounce_cursor WHERE folder=?", (folder,)).fetchone()
    con.close()
    return int(row[0]) if row else 0


def _set_cursor(folder: str, uid: int) -> None:
    _ensure_cursor_table()
    import sqlite3
    con = sqlite3.connect(db.DB_PATH)
    con.execute(
        "INSERT OR REPLACE INTO bounce_cursor (folder, last_uid, updated_at) "
        "VALUES (?, ?, ?)",
        (folder, int(uid), dt.datetime.utcnow().isoformat()),
    )
    con.commit()
    con.close()


# ── main scan ──────────────────────────────────────────────────────
def scan_bounces(
    gmail_address: str,
    gmail_app_password: str,
    folder: str = "INBOX",
    days_back: int = 14,
    *,
    backfill: bool = False,
    fetch_limit: Optional[int] = None,
    self_domains: Optional[Sequence[str]] = None,
    use_cursor: bool = True,
) -> int:
    """Connect to Gmail IMAP, find delivery-failure messages, mark recipients.

    Args:
        backfill: if True, re-scan the entire history window (ignores cursor).
        fetch_limit: cap on how many messages to fetch (default 500, or 5000
            when ``backfill`` is True).
        use_cursor: when False, never read/update the per-folder UID cursor.

    Returns the number of *newly quarantined* email addresses this run.
    """
    if fetch_limit is None:
        fetch_limit = BACKFILL_FETCH_LIMIT if backfill else DEFAULT_FETCH_LIMIT

    self_domains_norm = tuple(d.lower() for d in (self_domains or SELF_DOMAINS_DEFAULT))
    new_marked = 0
    scanned = 0
    matched = 0

    try:
        m = imaplib.IMAP4_SSL("imap.gmail.com", 993)
        m.login(gmail_address, gmail_app_password)
        m.select(folder)

        # Build search criteria. Backfill widens the window; regular runs
        # use the cursor for incremental processing.
        criteria_parts: List[str] = []
        if backfill:
            since = (dt.date.today() - dt.timedelta(days=max(days_back, 90))).strftime("%d-%b-%Y")
            criteria_parts.append(f"SINCE {since}")
        else:
            since = (dt.date.today() - dt.timedelta(days=days_back)).strftime("%d-%b-%Y")
            criteria_parts.append(f"SINCE {since}")

        # We don't filter by sender here — we examine every recent message
        # and classify locally. IMAP's FROM filter would miss EY-style NDRs.
        criteria = "(" + " ".join(criteria_parts) + ")" if criteria_parts else "ALL"
        typ, data = m.uid("search", None, criteria)
        if typ != "OK" or not data or not data[0]:
            logger.info("Bounce scan: nothing in IMAP window")
            try:
                m.logout()
            except Exception:
                pass
            return 0

        uids: List[int] = [int(x) for x in data[0].split()]
        if use_cursor and not backfill:
            last_uid = _get_cursor(folder)
            uids = [u for u in uids if u > last_uid]

        # Newest first so we mark recent bounces before old.
        uids.sort(reverse=True)
        uids = uids[:fetch_limit]

        if not uids:
            logger.info("Bounce scan: no new messages since last cursor")
            try:
                m.logout()
            except Exception:
                pass
            return 0

        logger.info(
            f"Bounce scan: checking {len(uids)} message(s) "
            f"({'backfill' if backfill else 'incremental'})"
        )

        max_uid_seen = 0
        for uid in uids:
            try:
                typ, msg_data = m.uid("fetch", str(uid), "(RFC822)")
                if typ != "OK" or not msg_data or not msg_data[0]:
                    continue
                raw = msg_data[0][1]  # type: ignore[index]
                if not isinstance(raw, (bytes, bytearray)):
                    continue
                msg = email.message_from_bytes(raw)
                scanned += 1

                from_hdr = _decode(msg.get("From", ""))
                subject = _decode(msg.get("Subject", ""))

                if not _looks_like_bounce(from_hdr, subject):
                    if uid > max_uid_seen:
                        max_uid_seen = uid
                    continue
                matched += 1

                body = _all_text(msg)
                rcpts = _extract_recipients(body, self_domains_norm)
                status = _extract_status_code(body)

                if not rcpts:
                    corr = _subject_correlation(subject)
                    if corr:
                        rcpts = {corr}

                self_suffixes = tuple("@" + d for d in self_domains_norm)
                for addr in rcpts:
                    if addr.endswith(self_suffixes):
                        continue
                    if db.is_invalid_email(addr):
                        continue
                    reason = f"bounced [{subject[:80]}]" if subject else "bounced"
                    db.mark_invalid_email(addr, reason, status)
                    logger.warning(f"Bounce -> quarantine: {addr} [{status or 'n/a'}]")
                    new_marked += 1

                if uid > max_uid_seen:
                    max_uid_seen = uid
            except Exception as e:
                logger.debug(f"bounce parse error uid={uid}: {e}")
                continue

        if use_cursor and not backfill and max_uid_seen:
            _set_cursor(folder, max_uid_seen)

        try:
            m.logout()
        except Exception:
            pass

    except Exception as e:
        logger.error(f"Bounce scan failed: {e}")
        return new_marked

    logger.info(
        f"Bounce scan: scanned={scanned} matched={matched} newly_quarantined={new_marked}"
    )
    return new_marked


# ── public helpers ─────────────────────────────────────────────────
def recent_bounces(limit: int = 50) -> List[dict]:
    """Return the most recent quarantined addresses for the dashboard."""
    return db.get_invalid_emails(limit=limit)


def total_bounce_count() -> int:
    """Count of quarantined addresses overall."""
    try:
        import sqlite3
        con = sqlite3.connect(db.DB_PATH)
        n = con.execute("SELECT COUNT(*) FROM invalid_emails").fetchone()[0]
        con.close()
        return int(n)
    except Exception:
        return 0
