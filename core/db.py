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
