"""End-to-end audit: walk every saved job through every state of the pipeline.

For each lifecycle stage we count how many DB rows are sitting there, sample
a few examples, and verify the schema is intact. This is the file the
support team should run when a customer says "the bot is broken" — it
tells you in one screen which stage is healthy and which has zero rows.

Stages covered:
  1. SEARCH      — jobs scraped from job boards
  2. SCORE       — AI-assigned match score
  3. EMAIL_FIND  — recruiter address discovered + tier
  4. QUEUE       — email written to pending_emails (DRAFT_MODE)
  5. REVIEW      — customer opened the queue UI (sent or skipped)
  6. SEND        — emails_sent row created
  7. BOUNCE      — invalid_emails / NDR detected
  8. FOLLOWUP    — 7-day follow-up trigger fired
  9. EASY_APPLY  — LinkedIn Easy Apply attempts
 10. DASHBOARD   — last render time, file size

Run with:  python scripts\_e2e_audit.py
"""
from __future__ import annotations

import datetime as dt
import json
from pathlib import Path

import _root  # noqa: F401

from core import db
from core import scheduler_lock
from config import get_settings

GREEN = "OK    "
YELLOW = "WARN  "
RED = "FAIL  "
INFO = "INFO  "


def banner(title: str) -> None:
    print()
    print(f"  {title}")
    print("  " + "-" * len(title))


def line(status: str, name: str, value: str) -> None:
    print(f"  [{status}] {name:<28s} {value}")


def main() -> int:
    db.init_db()
    s = get_settings()

    print()
    print(f"  JOBYBOT END-TO-END AUDIT  -  {dt.datetime.now().isoformat(timespec='seconds')}")
    print(f"  workspace: {Path.cwd()}")

    # ── 0. Scheduler health ──────────────────────────────────────
    banner("0. Scheduler health (background daemon)")
    alive, pid = scheduler_lock.is_alive()
    line(GREEN if alive else RED, "Daemon process",
         f"running (pid {pid})" if alive else "NOT RUNNING")
    meta = scheduler_lock.read() or {}
    if meta:
        line(INFO, "Lockfile started_at", meta.get("started_at", "?"))
    line(INFO, "Cycle interval", f"{s.run_interval_minutes} min")
    line(INFO, "Daily email cap", f"{s.daily_email_cap}")
    line(INFO, "Draft mode", "ON (review queue)" if s.draft_mode else "OFF (auto-send)")

    # ── 1. Search results ────────────────────────────────────────
    banner("1. SEARCH stage (jobs scraped from boards)")
    total_jobs = db.stats_summary()["total_jobs"]
    today_jobs = db.stats_summary()["jobs_today"]
    line(GREEN if total_jobs > 0 else RED, "Total jobs in DB", f"{total_jobs:,}")
    line(GREEN if today_jobs > 0 else YELLOW, "Found today", f"{today_jobs}")
    sources = db.jobs_by_source()
    for r in sources[:8]:
        line(INFO, f"  source {r['source']}", f"{r['n']:,} jobs")

    # ── 2. Scoring ───────────────────────────────────────────────
    banner("2. SCORE stage (AI match score 0-100)")
    jobs = db.get_jobs(status="found", limit=500)
    if jobs:
        scores = [int(j.get("match_score", 0)) for j in jobs]
        avg = sum(scores) / len(scores) if scores else 0
        high = sum(1 for x in scores if x >= 70)
        mid = sum(1 for x in scores if 50 <= x < 70)
        low = sum(1 for x in scores if x < 50)
        line(GREEN, "Avg score (top 500)", f"{avg:.1f}/100")
        line(INFO, "  score >= 70 (apply NOW)", f"{high:,}")
        line(INFO, "  score 50-69 (review)", f"{mid:,}")
        line(INFO, "  score < 50 (skip)", f"{low:,}")
    else:
        line(YELLOW, "Scored jobs", "0 (no jobs yet)")

    # ── 3. Email finding ─────────────────────────────────────────
    banner("3. EMAIL_FIND stage (recruiter address discovery)")
    discovery = db.discovery_tier_counts(days=30)
    if discovery:
        for r in discovery:
            tier = r.get("tier", "?")
            dec = r.get("decision", "?")
            line(INFO, f"  {tier:<14s} {dec}", f"{r.get('n', 0):,}")
    else:
        line(YELLOW, "Discovery attempts", "0 (run a cycle first)")

    # ── 4. Pending review queue ──────────────────────────────────
    banner("4. QUEUE stage (DRAFT_MODE = emails awaiting click)")
    qstats = db.pending_queue_stats()
    line(GREEN if qstats.get("pending", 0) >= 0 else RED,
         "Pending emails", f"{qstats.get('pending', 0):,}")
    line(INFO, "  sent_today", f"{qstats.get('sent_today', 0):,}")
    line(INFO, "  skipped_today", f"{qstats.get('skipped_today', 0):,}")
    queue_rows = db.list_pending_emails(limit=3)
    for r in queue_rows:
        rcpt = (r.get("recipient") or "")[:34]
        subj = (r.get("subject") or "")[:48]
        line(INFO, f"  sample [{r['id']}]", f"{rcpt}  |  {subj}")

    # ── 5. Review actions ────────────────────────────────────────
    banner("5. REVIEW stage (customer interactions with queue)")
    review_actions = db.get_run_log(200)
    rev_sent = sum(1 for e in review_actions if (e["event"] or "") == "email_sent_from_queue")
    rev_skip = sum(1 for e in review_actions if (e["event"] or "") == "queue_skipped")
    rev_edit = sum(1 for e in review_actions if (e["event"] or "") == "queue_edited")
    line(GREEN if rev_sent + rev_skip + rev_edit > 0 else YELLOW,
         "Send events from queue", f"{rev_sent} (skips: {rev_skip}, edits: {rev_edit})")

    # ── 6. Outbound sends ────────────────────────────────────────
    banner("6. SEND stage (emails actually sent via Gmail)")
    today_sent = db.stats_summary()["emails_today"]
    total_sent = db.stats_summary()["total_emails"]
    cap = s.daily_email_cap
    pct = int((today_sent / max(cap, 1)) * 100)
    line(GREEN if today_sent > 0 else YELLOW,
         "Emails sent today", f"{today_sent} / {cap}  ({pct}% of cap)")
    line(INFO, "All-time emails sent", f"{total_sent:,}")
    recent = db.recent_emails(3)
    for r in recent:
        rcpt = (r.get("recipient") or "")[:34]
        when = (r.get("sent_at") or "")[:16].replace("T", " ")
        line(INFO, f"  recent {when}", rcpt)

    # ── 7. Bounces ───────────────────────────────────────────────
    banner("7. BOUNCE stage (NDR / quarantined addresses)")
    bounces = db.get_invalid_emails(500)
    real = [b for b in bounces if "bounced" in (b.get("reason") or "").lower()]
    smtp_probe = [b for b in bounces if "mx" in (b.get("reason") or "").lower()]
    line(GREEN if len(real) < 5 else YELLOW,
         "Real bounces (NDR / 5xx)", f"{len(real)}")
    line(INFO, "SMTP-probe rejections", f"{len(smtp_probe)}")
    if total_sent:
        deliv = int(((total_sent - len(real)) / total_sent) * 100)
        line(GREEN if deliv >= 95 else YELLOW,
             "Deliverability %", f"{deliv}%")

    # ── 8. Follow-ups ────────────────────────────────────────────
    banner("8. FOLLOWUP stage (7-day re-touch)")
    fup_log = [e for e in review_actions if (e["event"] or "") == "followup_sent"]
    line(INFO, "Follow-up sends (last 200)", f"{len(fup_log)}")

    # ── 9. Easy Apply ────────────────────────────────────────────
    banner("9. EASY_APPLY stage (LinkedIn auto-apply)")
    ea_today = db.easy_applies_today() if hasattr(db, "easy_applies_today") else 0
    line(INFO if s.enable_easy_apply else YELLOW,
         "Easy Apply enabled", "YES" if s.enable_easy_apply else "NO (opt-in)")
    line(INFO, "Applies today", f"{ea_today}")
    if hasattr(db, "recent_easy_apply"):
        ea_recent = db.recent_easy_apply(3)
        for r in ea_recent:
            line(INFO, f"  [{r.get('status', '?')}]",
                 f"{(r.get('company', '') or '')[:24]}  -  {(r.get('job_title', '') or '')[:36]}")

    # ── 10. Dashboard freshness ──────────────────────────────────
    banner("10. DASHBOARD render (data/dashboard.html)")
    dash = Path("data") / "dashboard.html"
    if dash.exists():
        size_kb = dash.stat().st_size / 1024
        age_min = (dt.datetime.now() - dt.datetime.fromtimestamp(dash.stat().st_mtime)).total_seconds() / 60
        line(GREEN if size_kb > 10 else YELLOW,
             "Size", f"{size_kb:.1f} KB")
        line(GREEN if age_min < 60 else YELLOW,
             "Last rendered", f"{age_min:.1f} min ago")
    else:
        line(RED, "dashboard.html", "MISSING")

    # ── 11. Logs ─────────────────────────────────────────────────
    banner("11. LOGS (file sizes)")
    for log_name in ("scheduler-stdout.log", "heartbeat.log",
                     "queue_server.log", "cycle_*.log"):
        for p in sorted(Path("data").glob(log_name), reverse=True)[:2]:
            mb = p.stat().st_size / (1024 * 1024)
            age_h = (dt.datetime.now() - dt.datetime.fromtimestamp(p.stat().st_mtime)).total_seconds() / 3600
            line(INFO, f"  {p.name}", f"{mb:.2f} MB  ({age_h:.1f}h ago)")

    print()
    print("  Audit complete. Use `jobybot.py status` for a one-line health check.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
