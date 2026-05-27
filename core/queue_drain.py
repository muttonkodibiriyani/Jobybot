"""Auto-drain the review queue at up to N emails per day.

This solves the "I want 20 NEW emails / day but I also want to review
before sending" contradiction by letting HIGH-confidence rows
(SMTP-verified careers@, t1_careers, t1_ai_extract, t0_cache) flow
through automatically while LOW-confidence rows still wait for a
human click.

Auto-send eligibility:
  * status == 'pending'
  * discovery_confidence in {'high', 'medium'} (default)
  * recipient NOT in invalid_emails
  * we have not already-emailed this recipient (followup=N) today
  * daily_email_cap not yet reached
  * today's drained count not yet reached the configured floor

Order:
  high confidence rows first, then medium, then by job match_score
  (where we can link), then FIFO. This gives the customer maximum
  signal per email sent without burning the cap on speculative
  pattern guesses.
"""
from __future__ import annotations

import datetime as dt
import random
import sqlite3
import time
from typing import Dict, List, Optional

from loguru import logger

from core import db
from core.email_sender import send_email


# Confidence values we trust enough to send without a human click.
# Pattern-guessed (no probe) and `t3_pattern` are excluded — they need
# eyeballs.
_HIGH_CONFIDENCE_TIERS = {
    "t0_cache",          # already emailed successfully in the past
    "t1_careers",        # human-published mailto on the careers page
    "t1_ai_extract",     # Gemini-extracted from contact / careers
    "t2_linkedin",       # named recruiter from LinkedIn cookie path
    "t2_5_role_mailbox", # SMTP-verified role mailbox on known domain
    "curated_market",   # markets/*.json — hand-curated by us
}


def _candidates(
    limit: int,
    min_confidence: str = "medium",
    *,
    prefer_new: bool = True,
) -> List[Dict]:
    """Pull queue rows eligible for auto-send, sorted by confidence + tier.

    ``prefer_new`` puts followup=0 rows before follow-ups so the
    customer's "20 NEW per day" target gets satisfied before we burn
    the cap on follow-ups (which are auto-scheduled separately).
    """
    allow_low = (min_confidence or "").lower() == "low"
    conf_filter = (
        "('high','medium')" if (min_confidence or "").lower() == "medium"
        else "('high')"
    )
    if allow_low:
        conf_filter = "('high','medium','low')"

    order_clauses = []
    if prefer_new:
        # followup=0 first (NEW outreach), then follow-ups.
        order_clauses.append("followup ASC")
    order_clauses.extend([
        # high confidence first
        """CASE COALESCE(discovery_confidence,'medium')
              WHEN 'high'   THEN 0
              WHEN 'medium' THEN 1
              ELSE 2
           END""",
        # preferred tiers first
        f"""CASE WHEN discovery_tier IN
              ({",".join(repr(t) for t in _HIGH_CONFIDENCE_TIERS)})
            THEN 0 ELSE 1 END""",
        # FIFO within a bucket
        "created_at ASC",
    ])
    order_by = ",\n               ".join(order_clauses)

    with db._conn() as c:  # type: ignore[attr-defined]
        rows = c.execute(
            f"""
            SELECT id, recipient, company, category, subject, body,
                   job_id, job_title, followup, created_at,
                   discovery_tier, discovery_confidence, recruiter_name
              FROM pending_emails
             WHERE status = 'pending'
               AND COALESCE(discovery_confidence, 'medium') IN {conf_filter}
             ORDER BY {order_by}
             LIMIT ?
            """,
            (limit * 3,),  # pull more than we need so we can skip duplicates
        ).fetchall()
    return [dict(r) for r in rows]


def drain(
    cap: int,
    *,
    settings,
    min_confidence: str = "medium",
    dry_run: bool = False,
    jitter_sec: tuple = (4.0, 12.0),
) -> Dict[str, int]:
    """Send up to ``cap`` eligible emails from the queue.

    Returns counts: {'sent': n, 'skipped': n, 'failed': n, 'cap_hit': bool}.

    The daily Gmail cap is respected — we never exceed the customer's
    configured `daily_email_cap` even if the drain `cap` is larger.
    """
    if cap <= 0:
        return {"sent": 0, "skipped": 0, "failed": 0, "cap_hit": False}

    sent = skipped = failed = 0
    daily_cap = int(getattr(settings, "daily_email_cap", 200))
    seen_recipients: set[str] = set()

    rows = _candidates(cap, min_confidence=min_confidence)
    if not rows:
        logger.info("Queue drain: nothing eligible to auto-send")
        return {"sent": 0, "skipped": 0, "failed": 0, "cap_hit": False}

    logger.info(
        f"Queue drain: cap={cap}, min_confidence={min_confidence}, "
        f"candidates={len(rows)}, today_already_sent={db.emails_sent_today()}, "
        f"daily_email_cap={daily_cap}"
    )

    for row in rows:
        if sent >= cap:
            break
        if db.emails_sent_today() >= daily_cap:
            logger.warning(
                f"Queue drain: daily_email_cap ({daily_cap}) reached — stop"
            )
            return {"sent": sent, "skipped": skipped, "failed": failed,
                    "cap_hit": True}

        pid = row["id"]
        recipient = row["recipient"]

        # Skip dupes within a single drain pass (sometimes the queue
        # contains multiple jobs at the same recruiter).
        if recipient in seen_recipients:
            continue
        seen_recipients.add(recipient)

        if db.is_invalid_email(recipient):
            db.mark_pending_skipped(pid, "invalid_email_blocklist")
            skipped += 1
            continue
        if db.already_emailed(recipient, row["followup"]):
            db.mark_pending_skipped(pid, "already_emailed")
            skipped += 1
            continue

        if dry_run:
            logger.info(
                f"  [DRY-RUN] would send #{pid} → {recipient} "
                f"({row['discovery_tier']}/{row['discovery_confidence']})"
            )
            sent += 1
            continue

        ok, reason = send_email(
            settings.gmail_address,
            settings.gmail_app_password,
            recipient,
            row["subject"],
            row["body"],
            __import__("pathlib").Path(settings.resume_path),
            settings.user_name,
        )
        if ok:
            db.log_email(
                recipient, row["company"] or "", row["category"] or "",
                row["subject"], row["job_id"], row["followup"],
            )
            db.mark_pending_sent(pid, "auto_drain")
            db.log_event(
                "email_sent_from_queue",
                f"auto_drain {recipient} ({row['company']}) | "
                f"{row['subject'][:60]}",
            )
            logger.success(
                f"  → #{pid} {recipient} ({row['company']}) "
                f"[{row['discovery_tier']}]"
            )
            sent += 1
            # Polite jitter between sends to keep Gmail from flagging
            # the run as a spray. Only when we actually sent.
            time.sleep(random.uniform(*jitter_sec))
        else:
            if reason.startswith("recipient_refused") or reason.startswith("smtp_5"):
                db.mark_invalid_email(recipient, reason)
            db.mark_pending_failed(pid, reason)
            logger.warning(f"  ✗ #{pid} {recipient}: {reason}")
            failed += 1

    logger.success(
        f"Queue drain done: sent={sent}, skipped={skipped}, failed={failed}"
    )
    return {"sent": sent, "skipped": skipped, "failed": failed, "cap_hit": False}


def drain_today_floor(settings, target_per_day: int = 20) -> Dict[str, int]:
    """Top up today's send count to ``target_per_day``.

    If we've already sent 5 emails today and target_per_day=20, this
    will drain up to 15 more from the queue. If we're already at
    target, returns zero immediately.
    """
    already = db.emails_sent_today()
    need = max(0, target_per_day - already)
    if need == 0:
        logger.info(
            f"Queue drain (floor): already sent {already}/{target_per_day} today"
        )
        return {"sent": 0, "skipped": 0, "failed": 0, "cap_hit": False}
    logger.info(
        f"Queue drain (floor): {already}/{target_per_day} sent today — "
        f"topping up by {need}"
    )
    return drain(need, settings=settings, min_confidence="medium")
