"""SQLite tracker for jobs, applications, emails and dedup."""
from __future__ import annotations

import sqlite3
import datetime as dt
from pathlib import Path
from typing import Any, Dict, List, Optional

DB_PATH = Path("data") / "jobybot.db"


def _conn() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    c = sqlite3.connect(DB_PATH)
    c.row_factory = sqlite3.Row
    return c


def init_db() -> None:
    """Create all tables if not present."""
    with _conn() as c:
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


# ─── Stats ────────────────────────────────────────────────────────
def stats_summary() -> Dict[str, Any]:
    with _conn() as c:
        total_jobs    = c.execute("SELECT COUNT(*) FROM jobs").fetchone()[0]
        total_applied = c.execute("SELECT COUNT(*) FROM jobs WHERE status='applied'").fetchone()[0]
        total_emails  = c.execute("SELECT COUNT(*) FROM emails_sent").fetchone()[0]
        today_emails  = emails_sent_today()
        return {
            "total_jobs":      total_jobs,
            "total_applied":   total_applied,
            "total_emails":    total_emails,
            "emails_today":    today_emails,
        }
