"""Read Gmail mailbox for bounce / NDR notifications and learn bad addresses.

Connects via IMAP using the same Gmail App Password used to send.
Searches for messages from Mailer-Daemon / postmaster / mail-delivery-subsystem
and extracts the original failed recipient from the RFC 3464 DSN body.
"""
from __future__ import annotations

import email
import imaplib
import re
from email.header import decode_header
from typing import List, Tuple

from loguru import logger

from . import db


BOUNCE_SENDERS = (
    "mailer-daemon",
    "postmaster",
    "mail delivery subsystem",
    "mail delivery system",
    "noreply",
)

RCPT_RE = re.compile(
    r"(?:Final-Recipient:.*?rfc822;|Original-Recipient:.*?rfc822;|"
    r"failed recipient[:\s]+|to <)([A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,})",
    re.IGNORECASE,
)

STATUS_RE = re.compile(r"Status:\s*([0-9]\.[0-9]\.[0-9])")


def _decode(s: str) -> str:
    try:
        parts = decode_header(s)
        return "".join(
            (b.decode(enc or "utf-8", errors="replace") if isinstance(b, bytes) else b)
            for b, enc in parts
        )
    except Exception:
        return s


def _extract_bounced(msg: email.message.Message) -> List[Tuple[str, str]]:
    """Return list of (recipient, status_code)."""
    text_parts: List[str] = []
    for part in msg.walk():
        ctype = part.get_content_type()
        if ctype in ("text/plain", "message/delivery-status", "message/rfc822"):
            try:
                payload = part.get_payload(decode=True) or b""
                text_parts.append(payload.decode("utf-8", errors="replace"))
            except Exception:
                continue
    body = "\n".join(text_parts)
    rcpts = {m.group(1).lower() for m in RCPT_RE.finditer(body)}
    code_match = STATUS_RE.search(body)
    code = code_match.group(1) if code_match else ""
    return [(r, code) for r in rcpts]


def scan_bounces(
    gmail_address: str,
    gmail_app_password: str,
    folder: str = "INBOX",
    days_back: int = 14,
) -> int:
    """Connect to Gmail IMAP and mark all bounced recipients.

    Returns count of newly-marked invalid emails this run.
    """
    new_marked = 0
    try:
        m = imaplib.IMAP4_SSL("imap.gmail.com", 993)
        m.login(gmail_address, gmail_app_password)
        m.select(folder)

        # Search for bounce-like senders in the recent window
        since = ""
        try:
            import datetime as dt

            since = (dt.date.today() - dt.timedelta(days=days_back)).strftime("%d-%b-%Y")
        except Exception:
            since = ""

        criteria = '(FROM "Mailer-Daemon")'
        if since:
            criteria = f'(FROM "Mailer-Daemon" SINCE {since})'

        typ, data = m.search(None, criteria)
        if typ != "OK" or not data or not data[0]:
            # Also try postmaster
            typ2, data2 = m.search(None, '(FROM "postmaster")')
            if typ2 != "OK" or not data2 or not data2[0]:
                m.logout()
                logger.info("Bounce scan: no NDR messages found")
                return 0
            ids = data2[0].split()
        else:
            ids = data[0].split()

        logger.info(f"Bounce scan: checking {len(ids)} NDR message(s)")
        for mid in ids[-200:]:
            try:
                typ, msg_data = m.fetch(mid, "(RFC822)")
                if typ != "OK" or not msg_data:
                    continue
                msg = email.message_from_bytes(msg_data[0][1])  # type: ignore[index]
                subj = _decode(msg.get("Subject", ""))
                bounced = _extract_bounced(msg)
                for addr, code in bounced:
                    sender_l = (msg.get("From") or "").lower()
                    if not any(s in sender_l for s in BOUNCE_SENDERS):
                        continue
                    if not db.is_invalid_email(addr):
                        db.mark_invalid_email(addr, f"bounced ({subj[:60]})", code)
                        logger.warning(f"Bounce: {addr} [{code}]")
                        new_marked += 1
            except Exception as e:
                logger.debug(f"bounce parse error: {e}")
                continue

        m.logout()
    except Exception as e:
        logger.error(f"Bounce scan failed: {e}")
    return new_marked
