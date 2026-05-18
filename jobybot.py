#!/usr/bin/env python3
"""Jobybot — main CLI."""
from __future__ import annotations

import json
import sys
import time
import random
import datetime as dt
import webbrowser
from pathlib import Path
from typing import List, Dict, Any

import click
from loguru import logger

from config import get_settings, Settings
from core import db
from core.resume_parser import build_profile, load_profile
from core.job_matcher import score_job
from core.email_finder import find_email
from core.email_sender import send_application
from core.utils import jitter_sleep

# Job sources
from sources.linkedin_search import LinkedInSearch
from sources.indeed          import Indeed
from sources.naukri_gulf     import NaukriGulf
from sources.bayt            import Bayt
from sources.remoteok        import RemoteOK


# ── Logging setup ─────────────────────────────────────────────────
def setup_logging(level: str) -> None:
    logger.remove()
    logger.add(sys.stdout, level=level,
               format="<green>{time:HH:mm:ss}</green> | <level>{level: <8}</level> | {message}")
    Path("data").mkdir(exist_ok=True)
    logger.add("data/jobybot.log",
               level=level,
               rotation="10 MB",
               retention=5,
               format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {message}")


# ── Sources by location ───────────────────────────────────────────
def country_locations(country: str) -> List[str]:
    """Return search location strings for a country."""
    cmap = {
        "UAE":         ["Dubai, United Arab Emirates", "Abu Dhabi, United Arab Emirates"],
        "Singapore":   ["Singapore"],
        "Germany":     ["Berlin, Germany", "Munich, Germany", "Frankfurt, Germany"],
        "Netherlands": ["Amsterdam, Netherlands"],
        "Ireland":     ["Dublin, Ireland"],
        "Canada":      ["Toronto, Canada", "Vancouver, Canada"],
        "Australia":   ["Sydney, Australia", "Melbourne, Australia"],
        "UK":          ["London, United Kingdom", "Manchester, United Kingdom"],
    }
    return cmap.get(country, [country])


def active_sources(settings: Settings) -> List:
    src = []
    if settings.enable_linkedin_search:
        src.append(LinkedInSearch())
    if settings.enable_indeed:
        src.append(Indeed())
    if settings.enable_naukrigulf:
        src.append(NaukriGulf())
    if settings.enable_bayt:
        src.append(Bayt())
    if settings.enable_remoteok:
        src.append(RemoteOK())
    return src


def load_market(country: str) -> Dict[str, Any]:
    fname = "primary_uae.json" if country.upper() == "UAE" \
        else f"secondary_{country.lower()}.json"
    fpath = Path(__file__).parent / "markets" / fname
    if not fpath.exists():
        return {"contacts": []}
    return json.loads(fpath.read_text(encoding="utf-8"))


# ── HTML click sheet ──────────────────────────────────────────────
INBOX_HTML = Path("data") / "click_apply_inbox.html"


def update_inbox_html(jobs: List[Dict[str, Any]]) -> None:
    """Rebuild the live HTML inbox of pending jobs."""
    if not jobs:
        return
    html = """<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Jobybot - Click & Apply Inbox</title>
<meta http-equiv="refresh" content="600">
<style>
body{font-family:-apple-system,Segoe UI,sans-serif;background:#0a66c2;color:#fff;padding:20px;margin:0}
.box{background:#fff;color:#000;max-width:1200px;margin:auto;padding:30px;border-radius:12px;
     box-shadow:0 4px 24px rgba(0,0,0,.2)}
h1{color:#0a66c2;margin-top:0}
.stats{background:#0a66c2;color:#fff;padding:15px;border-radius:8px;margin:20px 0;text-align:center;font-size:18px}
.job{border-bottom:1px solid #eee;padding:14px 0;display:flex;align-items:center;gap:15px}
.job:hover{background:#f8f9fa}
.score{background:#28a745;color:#fff;width:48px;height:48px;border-radius:50%;
       display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:14px;flex-shrink:0}
.score.med{background:#ffc107;color:#000}
.score.lo{background:#6c757d}
.info{flex:1;min-width:0}
.title{font-weight:600;color:#000;font-size:15px}
.company{color:#666;font-size:13px;margin-top:2px}
.tags{font-size:11px;color:#888;margin-top:4px}
.btn{background:#0a66c2;color:#fff;padding:10px 22px;border-radius:24px;text-decoration:none;
     font-weight:600;font-size:14px;flex-shrink:0;white-space:nowrap}
.btn:hover{background:#004182}
.tip{background:#fff3cd;padding:14px 18px;border-left:4px solid #ffc107;margin:18px 0;border-radius:4px;font-size:14px}
</style></head><body><div class="box">"""

    html += f'<h1>🎯 Jobybot — Click & Apply Inbox</h1>'
    html += f'<div class="stats"><b>{len(jobs)} matched jobs ready</b><br/>'
    html += f'<small>Updated {dt.datetime.now().strftime("%Y-%m-%d %H:%M")} · Auto-refreshes every 10 min</small></div>'

    html += '<div class="tip">💡 Click <b>Open & Apply</b>, then in LinkedIn click the blue <b>Easy Apply</b> button. 30 seconds per job.</div>'

    for j in jobs[:200]:
        score = j.get("match_score", 0)
        cls = "" if score >= 70 else ("med" if score >= 50 else "lo")
        html += f"""<div class="job">
  <div class="score {cls}">{score}</div>
  <div class="info">
    <div class="title">{j['title']}</div>
    <div class="company">@ {j['company']}</div>
    <div class="tags">{j['source']} · {j.get('location','')}</div>
  </div>
  <a class="btn" href="{j['url']}" target="_blank">Open & Apply →</a>
</div>"""

    html += "</div></body></html>"
    INBOX_HTML.parent.mkdir(parents=True, exist_ok=True)
    INBOX_HTML.write_text(html, encoding="utf-8")


# ── Core ops ──────────────────────────────────────────────────────
def do_search(settings: Settings) -> int:
    """Search all sources × all titles × all markets. Returns new jobs added."""
    profile = load_profile()
    sources = active_sources(settings)
    new_total = 0

    target_locations = []
    for country in settings.all_markets:
        target_locations += country_locations(country)

    for country in settings.all_markets:
        locations = country_locations(country)
        for title in settings.titles_list:
            for loc in locations:
                for src in sources:
                    try:
                        jobs = src.search(title, loc)
                        for j in jobs[: settings.hourly_job_limit]:
                            j["match_score"] = score_job(j, profile, target_locations)
                            if j["match_score"] < settings.match_threshold:
                                continue
                            if db.upsert_job(j):
                                new_total += 1
                                logger.info(
                                    f"  + [{j['match_score']}] {j['title'][:50]} "
                                    f"@ {j['company']} ({src.name}, {country})"
                                )
                    except Exception as e:
                        logger.warning(f"  {src.name} {title} {loc}: {e}")
                    time.sleep(random.uniform(1, 2))
    logger.success(f"Search complete: {new_total} new jobs added")
    return new_total


def do_email_blast(settings: Settings) -> int:
    """Send personalized emails to recruiters & employers in active markets."""
    profile = load_profile()
    sent = 0

    if db.emails_sent_today() >= settings.daily_email_cap:
        logger.warning(f"Daily cap ({settings.daily_email_cap}) already reached")
        return 0

    for country in settings.all_markets:
        market = load_market(country)
        contacts = market.get("contacts", [])
        logger.info(f"\n[{country}] {len(contacts)} contacts")

        for c in contacts:
            if db.emails_sent_today() >= settings.daily_email_cap:
                logger.warning("Daily cap reached, stopping")
                return sent

            ok = send_application(
                settings,
                recipient=c["email"],
                company=c["company"],
                category=c.get("category", "Employer"),
                profile=profile,
            )
            if ok:
                sent += 1
            jitter_sleep(settings.min_delay_sec, settings.max_delay_sec)

    logger.success(f"Email blast complete: {sent} new emails sent")
    return sent


def do_followups(settings: Settings) -> int:
    """Send 7-day follow-ups to recipients who haven't been followed up yet."""
    if not settings.enable_followup:
        return 0
    profile = load_profile()
    due = db.followups_due()
    sent = 0
    for row in due:
        if db.emails_sent_today() >= settings.daily_email_cap:
            break
        ok = send_application(
            settings,
            recipient=row["recipient"],
            company=row["company"] or "",
            category=row["category"] or "Employer",
            profile=profile,
            followup=1,
        )
        if ok:
            sent += 1
        jitter_sleep(settings.min_delay_sec, settings.max_delay_sec)
    if sent:
        logger.success(f"Sent {sent} follow-ups")
    return sent


# ── CLI ───────────────────────────────────────────────────────────
@click.group()
def cli() -> None:
    """Jobybot — your 24/7 automated job application assistant."""


@cli.command()
def init() -> None:
    """Parse resume, build profile, verify Gmail SMTP."""
    settings = get_settings()
    setup_logging(settings.log_level)
    db.init_db()

    logger.info("🚀 Jobybot init")
    if not Path(settings.resume_path).exists():
        logger.error(f"Resume not found: {settings.resume_path}")
        sys.exit(1)

    profile = build_profile(Path(settings.resume_path))
    logger.success(
        f"Profile: {profile['years_exp']}yr exp, "
        f"{len(profile['skills'])} skills, "
        f"{len(profile['titles'])} titles detected"
    )

    # Quick Gmail SMTP login test
    import smtplib
    import ssl
    logger.info("Testing Gmail SMTP...")
    try:
        ctx = ssl.create_default_context()
        with smtplib.SMTP("smtp.gmail.com", 587, timeout=10) as s:
            s.ehlo()
            s.starttls(context=ctx)
            s.login(settings.gmail_address, settings.gmail_app_password)
        logger.success("Gmail SMTP login OK ✓")
    except Exception as e:
        logger.error(f"Gmail SMTP failed: {e}")
        logger.error("Check GMAIL_APP_PASSWORD in .env — must be App Password, not regular password")
        sys.exit(1)

    logger.success("\n✓ Init complete. Now run:  python jobybot.py run    (one cycle)")
    logger.success("                          python jobybot.py schedule (24/7 daemon)")


@cli.command()
def search() -> None:
    """Search all sources for jobs (no apply)."""
    settings = get_settings()
    setup_logging(settings.log_level)
    db.init_db()
    n = do_search(settings)
    jobs = db.get_jobs(status="found", limit=200)
    update_inbox_html(jobs)
    logger.success(f"{n} new jobs. Inbox: {INBOX_HTML.absolute()}")


@cli.command()
def email() -> None:
    """Run email blast to curated market contacts (no search)."""
    settings = get_settings()
    setup_logging(settings.log_level)
    db.init_db()
    do_email_blast(settings)


@cli.command()
def run() -> None:
    """One full cycle: search → email blast → follow-ups → update inbox."""
    settings = get_settings()
    setup_logging(settings.log_level)
    db.init_db()

    logger.info("─" * 50)
    logger.info(f"CYCLE START: {dt.datetime.now()}")
    logger.info("─" * 50)

    new = do_search(settings)
    sent = do_email_blast(settings)
    fups = do_followups(settings)

    jobs = db.get_jobs(status="found", limit=200)
    update_inbox_html(jobs)

    s = db.stats_summary()
    logger.success(
        f"Done: +{new} jobs, {sent} emails, {fups} followups. "
        f"Today total emails: {s['emails_today']}/{settings.daily_email_cap}"
    )


@cli.command()
def schedule() -> None:
    """Start hourly background scheduler."""
    settings = get_settings()
    setup_logging(settings.log_level)
    db.init_db()

    from apscheduler.schedulers.blocking import BlockingScheduler
    from apscheduler.triggers.cron import CronTrigger
    from apscheduler.triggers.interval import IntervalTrigger

    sched = BlockingScheduler(timezone="UTC")

    def cycle() -> None:
        try:
            do_search(settings)
            do_email_blast(settings)
            do_followups(settings)
            jobs = db.get_jobs(status="found", limit=200)
            update_inbox_html(jobs)
        except Exception as e:
            logger.exception(f"Cycle error: {e}")

    # Hourly
    sched.add_job(
        cycle, IntervalTrigger(minutes=settings.run_interval_minutes),
        next_run_time=dt.datetime.utcnow() + dt.timedelta(seconds=10),
        id="hourly_cycle", max_instances=1, coalesce=True,
    )
    # Daily summary at user's hour
    sched.add_job(
        send_daily_summary, CronTrigger(hour=settings.daily_summary_hour, minute=0),
        args=[settings], id="daily_summary",
    )

    logger.success(
        f"Scheduler running — cycle every {settings.run_interval_minutes} min. "
        "Press Ctrl+C to stop."
    )
    try:
        sched.start()
    except (KeyboardInterrupt, SystemExit):
        logger.info("Scheduler stopped")


@cli.command()
def doctor() -> None:
    """Check configuration & dependencies."""
    settings = get_settings()
    setup_logging("INFO")

    checks = [
        ("Resume PDF",       Path(settings.resume_path).exists()),
        ("Gmail address",    bool(settings.gmail_address)),
        ("Gmail password",   len(settings.gmail_app_password) >= 8),
        ("Database file",    True),
        ("Markets data",
            (Path(__file__).parent / "markets" / "primary_uae.json").exists()),
    ]
    for name, ok in checks:
        sym = "✓" if ok else "✗"
        print(f"  {sym} {name}")
    if all(ok for _, ok in checks):
        print("\nAll checks passed.")
    else:
        print("\nFix the ✗ items, then run again.")


@cli.command()
def stats() -> None:
    """Show usage statistics."""
    settings = get_settings()
    db.init_db()
    s = db.stats_summary()
    print()
    print(f"  Jobs found     : {s['total_jobs']}")
    print(f"  Applied        : {s['total_applied']}")
    print(f"  Emails sent    : {s['total_emails']}")
    print(f"  Emails today   : {s['emails_today']}/{settings.daily_email_cap}")
    print()


def send_daily_summary(settings: Settings) -> None:
    """Email the user a summary of yesterday's activity."""
    s = db.stats_summary()
    from core.email_sender import send_email
    body = f"""Jobybot daily summary — {dt.date.today().isoformat()}

Today so far:
  ✓ {s['emails_today']} personalized emails sent
  
Cumulative:
  ✓ {s['total_emails']} total emails
  ✓ {s['total_jobs']} jobs in pipeline
  ✓ {s['total_applied']} applications marked applied

Open inbox: {INBOX_HTML.absolute()}

— Jobybot
"""
    send_email(
        settings.gmail_address,
        settings.gmail_app_password,
        settings.user_email,
        f"Jobybot daily summary — {dt.date.today().isoformat()}",
        body,
        Path(settings.resume_path),
        "Jobybot",
    )


if __name__ == "__main__":
    cli()
