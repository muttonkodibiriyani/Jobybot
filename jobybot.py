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

from concurrent.futures import ThreadPoolExecutor, as_completed

from config import get_settings, Settings
from core import db
from core.resume_parser import build_profile, load_profile
from core.job_matcher import score_job
from core.email_finder import find_email  # legacy fallback
from core.email_finder_v2 import find_email_v2
from core.email_sender import send_application
from core.email_validator import validate_email
from core.bounce_tracker import scan_bounces, recent_bounces, total_bounce_count
from core.dashboard import render_dashboard, DASHBOARD_HTML
from core.utils import jitter_sleep

# Job sources
from sources.linkedin_search  import LinkedInSearch
from sources.indeed           import Indeed
from sources.naukri_gulf      import NaukriGulf
from sources.bayt             import Bayt
from sources.remoteok         import RemoteOK
from sources.gulftalent       import GulfTalent
from sources.company_careers  import CompanyCareers


# ── Logging setup ─────────────────────────────────────────────────
def setup_logging(level: str) -> None:
    # Force UTF-8 on Windows consoles to avoid cp1252 errors with emoji
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")  # type: ignore[union-attr]
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")  # type: ignore[union-attr]
    except Exception:
        pass
    logger.remove()
    logger.add(sys.stdout, level=level,
               format="<green>{time:HH:mm:ss}</green> | <level>{level: <8}</level> | {message}")
    Path("data").mkdir(exist_ok=True)
    logger.add("data/jobybot.log",
               level=level,
               rotation="10 MB",
               retention=5,
               encoding="utf-8",
               format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {message}")


# ── Sources by location ───────────────────────────────────────────
def country_locations(country: str) -> List[str]:
    """Return search location strings for a country."""
    cmap = {
        "UAE":         ["Dubai, United Arab Emirates", "Abu Dhabi, United Arab Emirates"],
        "Saudi":       ["Riyadh, Saudi Arabia", "Jeddah, Saudi Arabia"],
        "Qatar":       ["Doha, Qatar"],
        "Oman":        ["Muscat, Oman"],
        "Bahrain":     ["Manama, Bahrain"],
        "Singapore":   ["Singapore"],
        "Germany":     ["Berlin, Germany", "Munich, Germany", "Frankfurt, Germany"],
        "Netherlands": ["Amsterdam, Netherlands"],
        "Ireland":     ["Dublin, Ireland"],
        "Sweden":      ["Stockholm, Sweden", "Gothenburg, Sweden"],
        "Canada":      ["Toronto, Canada", "Vancouver, Canada"],
        "Australia":   ["Sydney, Australia", "Melbourne, Australia"],
        "UK":          ["London, United Kingdom", "Manchester, United Kingdom"],
        "India":       ["Bangalore, India", "Hyderabad, India", "Mumbai, India", "Pune, India"],
    }
    return cmap.get(country, [country])


def active_sources(settings: Settings) -> List:
    """Return all enabled job sources in priority order.

    Each .env toggle (ENABLE_*) flips a single source on/off so non-technical
    users can disable a site if it's misbehaving without editing code.
    """
    src = []
    if settings.enable_linkedin_search:
        src.append(LinkedInSearch())
    if settings.enable_indeed:
        src.append(Indeed())
    if settings.enable_naukrigulf:
        src.append(NaukriGulf())
    if settings.enable_bayt:
        src.append(Bayt())
    if settings.enable_gulftalent:
        src.append(GulfTalent())
    if settings.enable_remoteok:
        src.append(RemoteOK())
    if settings.enable_company_careers:
        src.append(CompanyCareers())
    return src


def load_market(country: str) -> Dict[str, Any]:
    """Return market metadata + contacts for a country. Tries both
    ``primary_<country>.json`` and ``secondary_<country>.json``.
    """
    base = Path(__file__).parent / "markets"
    key = country.lower()
    for fname in (f"primary_{key}.json", f"secondary_{key}.json"):
        fpath = base / fname
        if fpath.exists():
            return json.loads(fpath.read_text(encoding="utf-8"))
    return {"contacts": []}


def is_gdpr_market(country: str) -> bool:
    """EU + Sweden + UK PECR -> no cold email blast; apply via official site."""
    m = load_market(country)
    return bool(m.get("gdpr_strict") or m.get("apply_via_website_only"))


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
    """Parallel search: all sources × titles × markets. Returns new jobs added."""
    profile = load_profile()
    sources = active_sources(settings)
    new_total = 0

    target_locations: List[str] = []
    for country in settings.all_markets:
        target_locations += country_locations(country)

    tasks: List[tuple] = []
    for country in settings.all_markets:
        for loc in country_locations(country):
            for title in settings.titles_list:
                for src in sources:
                    tasks.append((src, title, loc, country))

    db.log_event("search_start", f"{len(tasks)} tasks across {len(settings.all_markets)} markets")
    logger.info(f"Search plan: {len(tasks)} (source × title × location) calls — running in parallel")

    def _one(src, title, loc):
        try:
            return src.search(title, loc)
        except Exception as e:
            logger.warning(f"  {src.name} {title} {loc}: {e}")
            return []

    # Concurrency: 8 workers is plenty for HTTP and respects target sites
    with ThreadPoolExecutor(max_workers=8) as ex:
        future_map = {ex.submit(_one, t[0], t[1], t[2]): t for t in tasks}
        for fut in as_completed(future_map):
            src, title, loc, country = future_map[fut]
            jobs = fut.result() or []
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

    db.log_event("search_done", f"+{new_total} new jobs")
    logger.success(f"Search complete: {new_total} new jobs added")
    return new_total


def do_email_blast(settings: Settings) -> int:
    """Send personalized emails to recruiters & employers in active markets.

    Skips GDPR-strict markets entirely (Germany, NL, Ireland, Sweden, UK PECR).
    Pre-validates emails to cut bounces. Tracks each event for the dashboard.

    Progress is logged every ~10 contacts AND the dashboard is re-rendered
    after each market so the customer can watch live activity instead of
    staring at a silent terminal.
    """
    profile = load_profile()
    sent = 0
    grand_already = 0  # how many addresses we already cold-emailed earlier

    if db.emails_sent_today() >= settings.daily_email_cap:
        logger.warning(f"Daily cap ({settings.daily_email_cap}) already reached")
        return 0

    db.log_event("blast_start", "")
    for country in settings.all_markets:
        market = load_market(country)
        if is_gdpr_market(country):
            # GDPR-hybrid: if the market file has a `legitimate_interest_contacts`
            # array (used by UK), email ONLY those addresses. They are limited
            # to mailboxes that were published on company job posts as the
            # "apply to" address — emailing them is defensible under UK GDPR
            # Art. 6(1)(f) legitimate interests.
            li_contacts = market.get("legitimate_interest_contacts") or []
            if li_contacts:
                logger.info(
                    f"[{country}] GDPR-hybrid: emailing {len(li_contacts)} "
                    f"legitimate-interest contacts (publicly published apply mailboxes)"
                )
                contacts = li_contacts
            else:
                logger.info(f"[{country}] GDPR strict — apply via official websites only (skipping email blast)")
                db.log_event("gdpr_skip", country)
                continue
        else:
            contacts = market.get("contacts", [])

        # Pre-flight: split into "fresh" and "already emailed".
        # If we already cold-emailed someone within the FOLLOWUP_DAYS window,
        # the daily blast must not pester them again — that responsibility
        # lives in do_followups() which only fires on the configured cadence.
        fresh, already = [], []
        for ct in contacts:
            if db.already_emailed(ct["email"], 0):
                already.append(ct)
            else:
                fresh.append(ct)
        grand_already += len(already)

        logger.info(
            f"\n[{country}] {len(contacts)} contacts  →  {len(fresh)} fresh to send, "
            f"{len(already)} already emailed (will be revisited as 7-day follow-ups)"
        )
        db.log_event(
            "market_plan",
            f"{country}: fresh={len(fresh)} already={len(already)}",
        )

        # Re-render the dashboard now so the customer's open tab updates
        # immediately when this market starts.
        render_dashboard(settings.daily_email_cap)

        if not fresh:
            logger.info(f"[{country}] nothing fresh to send — moving on")
            continue

        for i, c in enumerate(fresh, start=1):
            if db.emails_sent_today() >= settings.daily_email_cap:
                logger.warning("Daily cap reached, stopping")
                db.log_event("blast_capped", str(sent))
                render_dashboard(settings.daily_email_cap)
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

            # Compact progress beat: every 5 sends OR last item of market.
            if i % 5 == 0 or i == len(fresh):
                logger.info(
                    f"  [{country}] progress {i}/{len(fresh)} — "
                    f"sent so far this cycle: {sent}, "
                    f"today total: {db.emails_sent_today()}/{settings.daily_email_cap}"
                )
                # Refresh dashboard mid-market so live tab keeps moving.
                render_dashboard(settings.daily_email_cap)

            jitter_sleep(settings.min_delay_sec, settings.max_delay_sec)

        logger.success(f"[{country}] market complete — {sent} sent so far this cycle")

    db.log_event(
        "blast_done",
        f"{sent} sent / {grand_already} already-emailed across all markets",
    )
    logger.success(
        f"Email blast complete: {sent} new emails sent "
        f"({grand_already} addresses skipped because they were already emailed earlier)"
    )
    render_dashboard(settings.daily_email_cap)
    return sent


def do_jobs_blast(settings: Settings, top_n: int = 20) -> int:
    """Discover-and-send blast against the highest-matched jobs in the DB.

    For every "found" job above MATCH_THRESHOLD that we haven't already
    emailed via this job_id, run the 5-tier email_finder_v2 waterfall to
    locate a real recruiter address (career-page mailto, LinkedIn poster,
    pattern + SMTP probe). If one passes the SMTP gate, send a tailored
    email referencing the actual job title and description.

    Limited to `top_n` jobs per cycle to keep cycle time bounded.
    """
    if (settings.email_finder_tier or "off").lower() == "off":
        return 0

    profile = load_profile()
    sent = 0

    # Pull top jobs sorted by match_score desc that haven't already been
    # emailed (no row in emails_sent with this job_id).
    import sqlite3
    con = sqlite3.connect(db.DB_PATH)
    con.row_factory = sqlite3.Row
    jobs = con.execute(
        "SELECT * FROM jobs WHERE status='found' "
        "AND match_score >= ? "
        "AND id NOT IN (SELECT job_id FROM emails_sent WHERE job_id IS NOT NULL) "
        "ORDER BY match_score DESC LIMIT ?",
        (settings.match_threshold, top_n),
    ).fetchall()
    con.close()

    if not jobs:
        logger.info("Jobs blast: no fresh high-match jobs to outreach")
        return 0

    db.log_event("jobs_blast_start", f"top_n={top_n} candidates={len(jobs)}")
    logger.info(f"Jobs blast: trying to discover recruiters for {len(jobs)} top-scored jobs")

    cookie = settings.linkedin_cookie or ""

    for j in jobs:
        if db.emails_sent_today() >= settings.daily_email_cap:
            logger.warning("Daily cap reached, jobs blast stopping")
            break

        company = j["company"]
        job_url = j["url"]
        market = _country_from_location(j["location"] or "")

        try:
            disc = find_email_v2(
                company,
                job_url=job_url,
                market=market,
                linkedin_cookie=cookie,
                enable_smtp_probe=settings.smtp_probe_enabled,
            )
        except Exception as e:
            logger.warning(f"find_email_v2 failed for {company}: {e}")
            disc = None

        if not disc or not disc.email:
            db.log_event("jobs_blast_no_email", f"{company} ({j['source']})")
            continue

        ok = send_application(
            settings,
            recipient=disc.email,
            company=company,
            category="Employer",
            profile=profile,
            job_id=j["id"],
            recruiter_first_name=disc.first_name or "",
            job_title=j["title"] or "",
            job_description=j["description"] or "",
        )
        if ok:
            sent += 1
        jitter_sleep(settings.min_delay_sec, settings.max_delay_sec)

    db.log_event("jobs_blast_done", f"{sent} sent")
    logger.success(f"Jobs blast: {sent} discover-and-send emails")
    return sent


def _country_from_location(location: str) -> str:
    """Reverse-lookup: 'Dubai, United Arab Emirates' -> 'UAE'."""
    if not location:
        return "UAE"
    loc = location.lower()
    mapping = {
        "uae": "UAE", "united arab emirates": "UAE", "dubai": "UAE",
        "abu dhabi": "UAE", "sharjah": "UAE",
        "saudi": "Saudi", "riyadh": "Saudi", "jeddah": "Saudi",
        "qatar": "Qatar", "doha": "Qatar",
        "oman": "Oman", "muscat": "Oman",
        "bahrain": "Bahrain", "manama": "Bahrain",
        "singapore": "Singapore",
        "australia": "Australia", "sydney": "Australia", "melbourne": "Australia",
        "canada": "Canada", "toronto": "Canada", "vancouver": "Canada",
        "india": "India", "bangalore": "India", "hyderabad": "India",
        "mumbai": "India", "pune": "India", "delhi": "India",
        "united kingdom": "UK", "uk": "UK", "london": "UK", "manchester": "UK",
        "germany": "Germany", "berlin": "Germany",
        "netherlands": "Netherlands", "amsterdam": "Netherlands",
        "ireland": "Ireland", "dublin": "Ireland",
        "sweden": "Sweden", "stockholm": "Sweden",
    }
    for needle, country in mapping.items():
        if needle in loc:
            return country
    return "UAE"


def do_bounce_scan(settings: Settings) -> int:
    """Read Gmail mailbox for delivery failure notifications and mark bad emails."""
    try:
        n = scan_bounces(settings.gmail_address, settings.gmail_app_password)
        if n:
            db.log_event("bounces_marked", f"{n} bad addresses")
        return n
    except Exception as e:
        logger.warning(f"Bounce scan error: {e}")
        return 0


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
    render_dashboard(settings.daily_email_cap)
    logger.success(f"{n} new jobs. Inbox: {INBOX_HTML.absolute()}")
    logger.info(f"Dashboard: {DASHBOARD_HTML.absolute()}")


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

    bounces = do_bounce_scan(settings)
    if bounces:
        logger.warning(f"Quarantined {bounces} bounced address(es)")

    new = do_search(settings)
    sent = do_email_blast(settings)
    jb_sent = do_jobs_blast(settings, top_n=20)
    sent += jb_sent
    fups = do_followups(settings)

    jobs = db.get_jobs(status="found", limit=200)
    update_inbox_html(jobs)
    render_dashboard(settings.daily_email_cap)

    s = db.stats_summary()
    logger.success(
        f"Done: +{new} jobs, {sent} emails, {fups} followups, {bounces} bounces. "
        f"Today total emails: {s['emails_today']}/{settings.daily_email_cap}"
    )
    logger.info(f"Dashboard: {DASHBOARD_HTML.absolute()}")


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
            do_bounce_scan(settings)
            do_search(settings)
            do_email_blast(settings)
            do_jobs_blast(settings, top_n=20)
            do_followups(settings)
            jobs = db.get_jobs(status="found", limit=200)
            update_inbox_html(jobs)
            render_dashboard(settings.daily_email_cap)
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

    env_path = Path(".env")
    checks = [
        ("Resume PDF",       Path(settings.resume_path).exists()),
        ("Gmail address",    bool(settings.gmail_address)),
        ("Gmail password",   len(settings.gmail_app_password) >= 8),
        (".env file local",  env_path.exists()),
        ("Markets data",
            (Path(__file__).parent / "markets" / "primary_uae.json").exists()),
        ("Daily email cap",  settings.daily_email_cap >= 1),
    ]
    for name, ok in checks:
        sym = "✓" if ok else "✗"
        print(f"  {sym} {name}")

    print(f"\n  ℹ Daily cap: {settings.daily_email_cap} emails/day (DAILY_EMAIL_CAP in .env)")
    print("  ℹ Security: run SECURITY_CHECK.bat or docs/SECURITY.md")
    print("  ℹ No remote access: Jobybot does not open network ports.")

    if all(ok for _, ok in checks):
        print("\nAll checks passed.")
    else:
        print("\nFix the ✗ items, then run again.")


@cli.command()
@click.option("--backfill", is_flag=True, default=False,
              help="Re-scan up to 90 days of inbox history (ignores cursor).")
@click.option("--days", type=int, default=14,
              help="Days back to scan (default 14; backfill widens to 90).")
def bounces(backfill: bool, days: int) -> None:
    """Scan Gmail for delivery-failure notifications and quarantine bad addresses."""
    settings = get_settings()
    setup_logging(settings.log_level)
    db.init_db()

    before = total_bounce_count()
    n = scan_bounces(
        settings.gmail_address,
        settings.gmail_app_password,
        days_back=days,
        backfill=backfill,
    )
    after = total_bounce_count()

    print()
    print(f"  Newly quarantined this run : {n}")
    print(f"  Total in invalid_emails    : {after}  (was {before})")
    if n > 0:
        print()
        print("  Most recent bounces:")
        for b in recent_bounces(limit=10):
            print(f"    - {b['email']:<40s}  {b.get('reason', '')[:60]}")
    print()


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
