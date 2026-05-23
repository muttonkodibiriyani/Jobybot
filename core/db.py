"""SQLite tracker for jobs, applications, emails and dedup."""
from __future__ import annotations

import sqlite3
import datetime as dt
from pathlib import Path
from typing import Any, Dict, List, Optional

DB_PATH = Path("data") / "jobybot.db"


def _conn() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    # Generous timeout so concurrent readers (dashboard render + queue UI +
    # scheduler cycle + audit script) don't trip over each other on a slow
    # disk. SQLite already serialises writes via the WAL set up in init_db.
    c = sqlite3.connect(DB_PATH, timeout=30.0)
    c.row_factory = sqlite3.Row
    return c


def init_db() -> None:
    """Create all tables if not present.

    Also switches the DB into WAL (Write-Ahead Logging) mode so the
    scheduler can WRITE while the dashboard renderer and queue UI READ
    concurrently. The previous default 'delete' journal mode forced
    exclusive locks which produced 'database is locked' errors whenever
    a customer opened the dashboard while a cycle was mid-flight.
    """
    with _conn() as c:
        # PRAGMA statements must run OUTSIDE a transaction. `executescript`
        # commits each statement, so this is safe.
        c.execute("PRAGMA journal_mode=WAL")
        c.execute("PRAGMA synchronous=NORMAL")  # safe with WAL, much faster
        c.executescript(
            """
            CREATE TABLE IF NOT EXISTS jobs (
                id          TEXT PRIMARY KEY,
                source      TEXT NOT NULL,
                title       TEXT NOT NULL,
                company     TEXT NOT NULL,
                location    TEXT,
                url         TEXT NOT NULL,
                description TEXT,
                match_score INTEGER DEFAULT 0,
                found_at    TEXT NOT NULL,
                status      TEXT NOT NULL DEFAULT 'found',
                applied_at  TEXT,
                notes       TEXT
            );

            CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
            CREATE INDEX IF NOT EXISTS idx_jobs_found  ON jobs(found_at);

            CREATE TABLE IF NOT EXISTS emails_sent (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                recipient  TEXT NOT NULL,
                company    TEXT,
                category   TEXT,
                subject    TEXT,
                sent_at    TEXT NOT NULL,
                followup   INTEGER DEFAULT 0,
                job_id     TEXT,
                UNIQUE(recipient, followup) ON CONFLICT IGNORE
            );

            CREATE INDEX IF NOT EXISTS idx_emails_sent ON emails_sent(sent_at);
            CREATE INDEX IF NOT EXISTS idx_emails_rcpt ON emails_sent(recipient);

            CREATE TABLE IF NOT EXISTS email_cache (
                company       TEXT PRIMARY KEY,
                domain        TEXT,
                resolved_email TEXT,
                verified_at   TEXT
            );

            CREATE TABLE IF NOT EXISTS daily_stats (
                date         TEXT PRIMARY KEY,
                emails_sent  INTEGER DEFAULT 0,
                jobs_found   INTEGER DEFAULT 0,
                applies      INTEGER DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS invalid_emails (
                email       TEXT PRIMARY KEY,
                reason      TEXT,
                bounced_at  TEXT NOT NULL,
                bounce_code TEXT
            );

            CREATE TABLE IF NOT EXISTS validation_cache (
                email       TEXT PRIMARY KEY,
                valid       INTEGER NOT NULL,
                reason      TEXT,
                checked_at  TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS run_log (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                event       TEXT NOT NULL,
                detail      TEXT,
                at          TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_runlog_at ON run_log(at);

            -- Per-company discovery audit: every attempt, every tier, every outcome.
            -- Used by the dashboard "Discovery quality" panel and to debug bad guesses.
            CREATE TABLE IF NOT EXISTS email_discovery_log (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                company         TEXT NOT NULL,
                source_url      TEXT,
                tier            TEXT NOT NULL,
                candidate_email TEXT,
                probe_code      TEXT,
                decision        TEXT NOT NULL,
                latency_ms      INTEGER DEFAULT 0,
                at              TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_discovery_co  ON email_discovery_log(company);
            CREATE INDEX IF NOT EXISTS idx_discovery_at  ON email_discovery_log(at);

            -- SMTP RCPT probe results (don't re-probe the same address per cycle).
            CREATE TABLE IF NOT EXISTS smtp_probe_cache (
                email       TEXT PRIMARY KEY,
                code        TEXT,
                message     TEXT,
                checked_at  TEXT NOT NULL
            );

            -- LinkedIn logged-in lookup quota (one row per day).
            CREATE TABLE IF NOT EXISTS linkedin_finder_quota (
                date        TEXT PRIMARY KEY,
                lookups     INTEGER NOT NULL DEFAULT 0
            );

            -- Bounce IMAP cursor (per-folder).
            CREATE TABLE IF NOT EXISTS bounce_cursor (
                folder      TEXT PRIMARY KEY,
                last_uid    INTEGER NOT NULL,
                updated_at  TEXT NOT NULL
            );

            -- LinkedIn Easy Apply audit log. One row per attempted application.
            -- Status flow: queued -> applied | skipped | needs_review | failed
            CREATE TABLE IF NOT EXISTS easy_apply_log (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                linkedin_job_id TEXT,
                job_title       TEXT,
                company         TEXT,
                location        TEXT,
                job_url         TEXT,
                status          TEXT NOT NULL,
                reason          TEXT,
                screenshot_path TEXT,
                step_count      INTEGER DEFAULT 0,
                duration_ms     INTEGER DEFAULT 0,
                at              TEXT NOT NULL,
                UNIQUE(linkedin_job_id) ON CONFLICT IGNORE
            );
            CREATE INDEX IF NOT EXISTS idx_easyapply_status ON easy_apply_log(status);
            CREATE INDEX IF NOT EXISTS idx_easyapply_at     ON easy_apply_log(at);

            -- Cached answers for Easy Apply questions. Once we learn that
            -- "Years of experience with Python?" should be "5", we remember
            -- it (per-user, per-canonical-question) so the AI doesn't re-decide
            -- every cycle and the answer stays consistent.
            CREATE TABLE IF NOT EXISTS easy_apply_answers (
                question_key TEXT PRIMARY KEY,   -- canonicalised label (lower, stripped)
                question_raw TEXT,               -- original label as seen on the form
                answer       TEXT NOT NULL,
                input_kind   TEXT NOT NULL,      -- text|number|select|radio|checkbox|textarea
                source       TEXT NOT NULL,      -- profile|pattern|ai|user|fallback
                updated_at   TEXT NOT NULL
            );

            -- Review queue (draft mode). Every email the bot WOULD send lands
            -- here first so the customer can review the recipient + body before
            -- a single message leaves the laptop. Sent rows are kept for audit.
            CREATE TABLE IF NOT EXISTS pending_emails (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                recipient   TEXT NOT NULL,
                company     TEXT,
                category    TEXT,
                subject     TEXT NOT NULL,
                body        TEXT NOT NULL,
                job_id      TEXT,
                job_title   TEXT,
                job_url     TEXT,
                followup    INTEGER DEFAULT 0,
                created_at  TEXT NOT NULL,
                edited_at   TEXT,
                status      TEXT NOT NULL DEFAULT 'pending',
                            -- pending | sent | skipped | failed | edited
                sent_at     TEXT,
                send_reason TEXT,
                UNIQUE(recipient, followup, job_id) ON CONFLICT IGNORE
            );
            CREATE INDEX IF NOT EXISTS idx_pending_status  ON pending_emails(status);
            CREATE INDEX IF NOT EXISTS idx_pending_created ON pending_emails(created_at);
            """
        )


# ─── Jobs ──────────────────────────────────────────────────────────
def upsert_job(job: Dict[str, Any]) -> bool:
    """Insert if not exists. Returns True if new."""
    with _conn() as c:
        if c.execute("SELECT 1 FROM jobs WHERE id=?", (job["id"],)).fetchone():
            return False
        c.execute(
            "INSERT INTO jobs (id, source, title, company, location, url, "
            "description, match_score, found_at, status) VALUES "
            "(?, ?, ?, ?, ?, ?, ?, ?, ?, 'found')",
            (
                job["id"],
                job.get("source", "unknown"),
                job["title"][:200],
                job["company"][:200],
                job.get("location", ""),
                job["url"],
                job.get("description", "")[:5000],
                int(job.get("match_score", 0)),
                dt.datetime.utcnow().isoformat(),
            ),
        )
        return True


def get_jobs(status: Optional[str] = None, limit: int = 500) -> List[Dict[str, Any]]:
    with _conn() as c:
        if status:
            rows = c.execute(
                "SELECT * FROM jobs WHERE status=? ORDER BY match_score DESC, found_at DESC LIMIT ?",
                (status, limit),
            ).fetchall()
        else:
            rows = c.execute(
                "SELECT * FROM jobs ORDER BY found_at DESC LIMIT ?", (limit,)
            ).fetchall()
        return [dict(r) for r in rows]


def update_job_status(job_id: str, status: str, notes: str = "") -> None:
    with _conn() as c:
        c.execute(
            "UPDATE jobs SET status=?, applied_at=?, notes=? WHERE id=?",
            (status, dt.datetime.utcnow().isoformat(), notes, job_id),
        )


# ─── Emails ────────────────────────────────────────────────────────
def already_emailed(recipient: str, followup: int = 0) -> bool:
    with _conn() as c:
        r = c.execute(
            "SELECT 1 FROM emails_sent WHERE recipient=? AND followup=?",
            (recipient, followup),
        ).fetchone()
        return bool(r)


def log_email(
    recipient: str,
    company: str,
    category: str,
    subject: str,
    job_id: Optional[str] = None,
    followup: int = 0,
) -> None:
    with _conn() as c:
        c.execute(
            "INSERT OR IGNORE INTO emails_sent "
            "(recipient, company, category, subject, sent_at, followup, job_id) "
            "VALUES (?, ?, ?, ?, ?, ?, ?)",
            (
                recipient,
                company,
                category,
                subject,
                dt.datetime.utcnow().isoformat(),
                followup,
                job_id,
            ),
        )


def emails_sent_today() -> int:
    today = dt.date.today().isoformat()
    with _conn() as c:
        r = c.execute(
            "SELECT COUNT(*) FROM emails_sent WHERE sent_at LIKE ?",
            (f"{today}%",),
        ).fetchone()
        return int(r[0]) if r else 0


# ─── Easy Apply audit log ────────────────────────────────────────
def log_easy_apply(
    *,
    linkedin_job_id: str,
    status: str,
    job_title: str = "",
    company: str = "",
    location: str = "",
    job_url: str = "",
    reason: str = "",
    screenshot_path: str = "",
    step_count: int = 0,
    duration_ms: int = 0,
) -> bool:
    """Insert one row. Returns False on dup (we already tried this job)."""
    with _conn() as c:
        cur = c.execute(
            "INSERT OR IGNORE INTO easy_apply_log "
            "(linkedin_job_id, job_title, company, location, job_url, status, "
            " reason, screenshot_path, step_count, duration_ms, at) "
            "VALUES (?,?,?,?,?,?,?,?,?,?,?)",
            (
                linkedin_job_id,
                job_title[:200],
                company[:200],
                location[:200],
                job_url[:500],
                status,
                reason[:500],
                screenshot_path[:300],
                int(step_count),
                int(duration_ms),
                dt.datetime.utcnow().isoformat(),
            ),
        )
        return cur.rowcount > 0


def already_easy_applied(linkedin_job_id: str) -> bool:
    with _conn() as c:
        r = c.execute(
            "SELECT 1 FROM easy_apply_log WHERE linkedin_job_id=?",
            (linkedin_job_id,),
        ).fetchone()
        return bool(r)


def easy_applies_today() -> int:
    today = dt.date.today().isoformat()
    with _conn() as c:
        r = c.execute(
            "SELECT COUNT(*) FROM easy_apply_log "
            "WHERE status='applied' AND at LIKE ?",
            (today + "%",),
        ).fetchone()
        return int(r[0]) if r else 0


def recent_easy_apply(limit: int = 50) -> List[Dict[str, Any]]:
    with _conn() as c:
        rows = c.execute(
            "SELECT * FROM easy_apply_log ORDER BY id DESC LIMIT ?", (limit,)
        ).fetchall()
        return [dict(r) for r in rows]


# ─── Easy Apply Q&A cache ────────────────────────────────────────
def get_easy_apply_answer(question_key: str) -> Optional[Dict[str, Any]]:
    with _conn() as c:
        r = c.execute(
            "SELECT * FROM easy_apply_answers WHERE question_key=?",
            (question_key,),
        ).fetchone()
        return dict(r) if r else None


def save_easy_apply_answer(
    question_key: str,
    *,
    answer: str,
    input_kind: str,
    source: str,
    question_raw: str = "",
) -> None:
    with _conn() as c:
        c.execute(
            "INSERT OR REPLACE INTO easy_apply_answers "
            "(question_key, question_raw, answer, input_kind, source, updated_at) "
            "VALUES (?,?,?,?,?,?)",
            (
                question_key,
                question_raw[:300],
                answer[:2000],
                input_kind,
                source,
                dt.datetime.utcnow().isoformat(),
            ),
        )


# ─── Pending review queue (DRAFT_MODE) ───────────────────────────
def queue_pending_email(
    *,
    recipient: str,
    company: str,
    category: str,
    subject: str,
    body: str,
    job_id: Optional[str] = None,
    job_title: str = "",
    job_url: str = "",
    followup: int = 0,
) -> Optional[int]:
    """Save an email for human review instead of sending it. Returns row id
    or None if (recipient, followup, job) was already queued or sent."""
    if already_emailed(recipient, followup):
        return None
    with _conn() as c:
        # Dedup against any already-queued (pending OR sent-from-queue).
        existing = c.execute(
            "SELECT id FROM pending_emails WHERE recipient=? AND followup=? "
            "AND COALESCE(job_id,'')=COALESCE(?,'')",
            (recipient, followup, job_id),
        ).fetchone()
        if existing:
            return None
        cur = c.execute(
            "INSERT INTO pending_emails "
            "(recipient, company, category, subject, body, job_id, job_title, "
            " job_url, followup, created_at) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (
                recipient,
                company,
                category,
                subject,
                body,
                job_id,
                job_title[:200],
                job_url[:500],
                followup,
                dt.datetime.utcnow().isoformat(),
            ),
        )
        return cur.lastrowid


def list_pending_emails(limit: int = 200) -> List[Dict[str, Any]]:
    """All emails awaiting customer review, oldest first (FIFO)."""
    with _conn() as c:
        rows = c.execute(
            "SELECT id, recipient, company, category, subject, body, job_id, "
            "job_title, job_url, followup, created_at, edited_at "
            "FROM pending_emails WHERE status = 'pending' "
            "ORDER BY created_at ASC LIMIT ?",
            (limit,),
        ).fetchall()
        return [dict(r) for r in rows]


def get_pending_email(pending_id: int) -> Optional[Dict[str, Any]]:
    with _conn() as c:
        r = c.execute(
            "SELECT * FROM pending_emails WHERE id = ?", (pending_id,)
        ).fetchone()
        return dict(r) if r else None


def update_pending_email(pending_id: int, *, subject: Optional[str] = None,
                         body: Optional[str] = None) -> bool:
    """Customer-edited subject/body. Returns True if the row was updated."""
    sets: List[str] = []
    args: List[Any] = []
    if subject is not None:
        sets.append("subject = ?")
        args.append(subject)
    if body is not None:
        sets.append("body = ?")
        args.append(body)
    if not sets:
        return False
    sets.append("edited_at = ?")
    args.append(dt.datetime.utcnow().isoformat())
    sets.append("status = 'edited'")
    args.append(pending_id)
    with _conn() as c:
        cur = c.execute(
            f"UPDATE pending_emails SET {', '.join(sets)} "
            "WHERE id = ? AND status IN ('pending','edited')",
            args,
        )
        return cur.rowcount > 0


def mark_pending_sent(pending_id: int, reason: str = "sent") -> bool:
    with _conn() as c:
        cur = c.execute(
            "UPDATE pending_emails SET status='sent', sent_at=?, send_reason=? "
            "WHERE id=? AND status IN ('pending','edited')",
            (dt.datetime.utcnow().isoformat(), reason, pending_id),
        )
        return cur.rowcount > 0


def mark_pending_skipped(pending_id: int, reason: str = "user_skipped") -> bool:
    with _conn() as c:
        cur = c.execute(
            "UPDATE pending_emails SET status='skipped', sent_at=?, send_reason=? "
            "WHERE id=? AND status IN ('pending','edited')",
            (dt.datetime.utcnow().isoformat(), reason, pending_id),
        )
        return cur.rowcount > 0


def mark_pending_failed(pending_id: int, reason: str) -> bool:
    with _conn() as c:
        cur = c.execute(
            "UPDATE pending_emails SET status='failed', sent_at=?, send_reason=? "
            "WHERE id=?",
            (dt.datetime.utcnow().isoformat(), reason[:200], pending_id),
        )
        return cur.rowcount > 0


def pending_queue_stats() -> Dict[str, int]:
    """Counts for the dashboard pill: pending / sent today / skipped today."""
    today = dt.date.today().isoformat()
    with _conn() as c:
        pending = c.execute(
            "SELECT COUNT(*) FROM pending_emails WHERE status='pending'"
        ).fetchone()[0]
        sent_today = c.execute(
            "SELECT COUNT(*) FROM pending_emails WHERE status='sent' AND sent_at LIKE ?",
            (today + "%",),
        ).fetchone()[0]
        skipped_today = c.execute(
            "SELECT COUNT(*) FROM pending_emails WHERE status='skipped' AND sent_at LIKE ?",
            (today + "%",),
        ).fetchone()[0]
        return {
            "pending": int(pending),
            "sent_today": int(sent_today),
            "skipped_today": int(skipped_today),
        }


# ─── Existing recent-emails helper (kept as-is below) ─────────────
def recent_emails(limit: int = 20) -> List[Dict[str, Any]]:
    """Most recent outbound emails (successfully sent, not bounces)."""
    with _conn() as c:
        rows = c.execute(
            "SELECT recipient, company, category, subject, sent_at, followup, job_id "
            "FROM emails_sent ORDER BY sent_at DESC LIMIT ?",
            (limit,),
        ).fetchall()
        return [dict(r) for r in rows]


def followups_due() -> List[Dict[str, Any]]:
    """Emails sent 7+ days ago that haven't been followed up yet."""
    cutoff = (dt.datetime.utcnow() - dt.timedelta(days=7)).isoformat()
    with _conn() as c:
        rows = c.execute(
            "SELECT * FROM emails_sent WHERE followup=0 AND sent_at < ? "
            "AND recipient NOT IN (SELECT recipient FROM emails_sent WHERE followup=1)",
            (cutoff,),
        ).fetchall()
        return [dict(r) for r in rows]


# ─── Email cache ──────────────────────────────────────────────────
def cache_email(company: str, domain: str, email: str) -> None:
    with _conn() as c:
        c.execute(
            "INSERT OR REPLACE INTO email_cache (company, domain, resolved_email, verified_at) "
            "VALUES (?, ?, ?, ?)",
            (company.lower(), domain, email, dt.datetime.utcnow().isoformat()),
        )


def get_cached_email(company: str) -> Optional[str]:
    with _conn() as c:
        r = c.execute(
            "SELECT resolved_email FROM email_cache WHERE company=?",
            (company.lower(),),
        ).fetchone()
        return r["resolved_email"] if r else None


# ─── Invalid emails (bounces) ────────────────────────────────────
def mark_invalid_email(email: str, reason: str, code: str = "") -> None:
    with _conn() as c:
        c.execute(
            "INSERT OR REPLACE INTO invalid_emails (email, reason, bounced_at, bounce_code) "
            "VALUES (?, ?, ?, ?)",
            (email.lower(), reason, dt.datetime.utcnow().isoformat(), code),
        )


def is_invalid_email(email: str) -> bool:
    with _conn() as c:
        r = c.execute(
            "SELECT 1 FROM invalid_emails WHERE email=?", (email.lower(),)
        ).fetchone()
        return bool(r)


def get_invalid_emails(limit: int = 200) -> List[Dict[str, Any]]:
    with _conn() as c:
        rows = c.execute(
            "SELECT * FROM invalid_emails ORDER BY bounced_at DESC LIMIT ?", (limit,)
        ).fetchall()
        return [dict(r) for r in rows]


# ─── Validation cache ────────────────────────────────────────────
def cache_validation(email: str, valid: bool, reason: str) -> None:
    with _conn() as c:
        c.execute(
            "INSERT OR REPLACE INTO validation_cache (email, valid, reason, checked_at) "
            "VALUES (?, ?, ?, ?)",
            (email.lower(), 1 if valid else 0, reason, dt.datetime.utcnow().isoformat()),
        )


def get_validation(email: str) -> Optional[Dict[str, Any]]:
    with _conn() as c:
        r = c.execute(
            "SELECT * FROM validation_cache WHERE email=?", (email.lower(),)
        ).fetchone()
        return dict(r) if r else None


# ─── Run log (dashboard) ─────────────────────────────────────────
def log_event(event: str, detail: str = "") -> None:
    with _conn() as c:
        c.execute(
            "INSERT INTO run_log (event, detail, at) VALUES (?, ?, ?)",
            (event, detail, dt.datetime.utcnow().isoformat()),
        )


def get_run_log(limit: int = 50) -> List[Dict[str, Any]]:
    with _conn() as c:
        rows = c.execute(
            "SELECT * FROM run_log ORDER BY id DESC LIMIT ?", (limit,)
        ).fetchall()
        return [dict(r) for r in rows]


# ─── Email discovery audit ───────────────────────────────────────
def log_discovery(
    company: str,
    tier: str,
    decision: str,
    *,
    source_url: str = "",
    candidate_email: str = "",
    probe_code: str = "",
    latency_ms: int = 0,
) -> None:
    """Record one attempt to discover a company's recruiter email."""
    with _conn() as c:
        c.execute(
            "INSERT INTO email_discovery_log "
            "(company, source_url, tier, candidate_email, probe_code, decision, latency_ms, at) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (company, source_url, tier, candidate_email, probe_code, decision,
             int(latency_ms), dt.datetime.utcnow().isoformat()),
        )


def recent_discovery(limit: int = 50) -> List[Dict[str, Any]]:
    """Newest discovery attempts for the dashboard panel."""
    with _conn() as c:
        rows = c.execute(
            "SELECT * FROM email_discovery_log ORDER BY id DESC LIMIT ?", (limit,)
        ).fetchall()
        return [dict(r) for r in rows]


def discovery_tier_counts(days: int = 7) -> List[Dict[str, Any]]:
    """Aggregate per-tier success counts for the last N days."""
    cutoff = (dt.datetime.utcnow() - dt.timedelta(days=days)).isoformat()
    with _conn() as c:
        rows = c.execute(
            "SELECT tier, decision, COUNT(*) AS n FROM email_discovery_log "
            "WHERE at >= ? GROUP BY tier, decision ORDER BY tier, decision",
            (cutoff,),
        ).fetchall()
        return [dict(r) for r in rows]


# ─── SMTP probe cache ────────────────────────────────────────────
def get_smtp_probe(email: str) -> Optional[Dict[str, Any]]:
    with _conn() as c:
        r = c.execute(
            "SELECT * FROM smtp_probe_cache WHERE email=?", (email.lower(),)
        ).fetchone()
        return dict(r) if r else None


def cache_smtp_probe(email: str, code: str, message: str = "") -> None:
    with _conn() as c:
        c.execute(
            "INSERT OR REPLACE INTO smtp_probe_cache (email, code, message, checked_at) "
            "VALUES (?, ?, ?, ?)",
            (email.lower(), code, message[:200], dt.datetime.utcnow().isoformat()),
        )


# ─── LinkedIn finder quota ────────────────────────────────────────
def linkedin_lookups_today() -> int:
    today = dt.date.today().isoformat()
    with _conn() as c:
        r = c.execute(
            "SELECT lookups FROM linkedin_finder_quota WHERE date=?", (today,)
        ).fetchone()
        return int(r[0]) if r else 0


def bump_linkedin_lookup() -> int:
    today = dt.date.today().isoformat()
    with _conn() as c:
        c.execute(
            "INSERT INTO linkedin_finder_quota (date, lookups) VALUES (?, 1) "
            "ON CONFLICT(date) DO UPDATE SET lookups = lookups + 1",
            (today,),
        )
        r = c.execute(
            "SELECT lookups FROM linkedin_finder_quota WHERE date=?", (today,)
        ).fetchone()
        return int(r[0]) if r else 0


def jobs_by_source() -> List[Dict[str, Any]]:
    with _conn() as c:
        rows = c.execute(
            "SELECT source, COUNT(*) AS n FROM jobs WHERE status='found' "
            "GROUP BY source ORDER BY n DESC"
        ).fetchall()
        return [dict(r) for r in rows]


# ─── Stats ────────────────────────────────────────────────────────
def stats_summary() -> Dict[str, Any]:
    today = dt.date.today().isoformat()
    with _conn() as c:
        total_jobs    = c.execute("SELECT COUNT(*) FROM jobs").fetchone()[0]
        total_applied = c.execute("SELECT COUNT(*) FROM jobs WHERE status='applied'").fetchone()[0]
        total_emails  = c.execute("SELECT COUNT(*) FROM emails_sent").fetchone()[0]
        today_emails  = emails_sent_today()
        bounces       = c.execute("SELECT COUNT(*) FROM invalid_emails").fetchone()[0]
        jobs_today    = c.execute(
            "SELECT COUNT(*) FROM jobs WHERE found_at LIKE ?", (today + "%",)
        ).fetchone()[0]
        return {
            "total_jobs":      total_jobs,
            "total_applied":   total_applied,
            "total_emails":    total_emails,
            "emails_today":    today_emails,
            "jobs_today":      jobs_today,
            "bounces":         bounces,
        }
