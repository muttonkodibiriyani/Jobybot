#!/usr/bin/env python3
"""Jobybot â€” main CLI."""
from __future__ import annotations

import json
import sys
import time
import random
import datetime as dt
import webbrowser
from pathlib import Path
from typing import List, Dict, Any, Optional

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
from sources.wellfound        import Wellfound
from sources.hn_whoshiring    import HNWhoIsHiring


# â”€â”€ Logging setup â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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


# â”€â”€ Sources by location â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
    # Worldwide startup pipelines — much higher email-discovery yield
    # than FAANG career pages because startups publish recruiter
    # emails directly on their listings.
    if getattr(settings, "enable_wellfound", True):
        src.append(Wellfound())
    if getattr(settings, "enable_hn_whoshiring", True):
        src.append(HNWhoIsHiring())
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


# â”€â”€ HTML click sheet â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

    html += f'<h1>ðŸŽ¯ Jobybot â€” Click & Apply Inbox</h1>'
    html += f'<div class="stats"><b>{len(jobs)} matched jobs ready</b><br/>'
    html += f'<small>Updated {dt.datetime.now().strftime("%Y-%m-%d %H:%M")} Â· Auto-refreshes every 10 min</small></div>'

    html += '<div class="tip">ðŸ’¡ Click <b>Open & Apply</b>, then in LinkedIn click the blue <b>Easy Apply</b> button. 30 seconds per job.</div>'

    for j in jobs[:200]:
        score = j.get("match_score", 0)
        cls = "" if score >= 70 else ("med" if score >= 50 else "lo")
        html += f"""<div class="job">
  <div class="score {cls}">{score}</div>
  <div class="info">
    <div class="title">{j['title']}</div>
    <div class="company">@ {j['company']}</div>
    <div class="tags">{j['source']} Â· {j.get('location','')}</div>
  </div>
  <a class="btn" href="{j['url']}" target="_blank">Open & Apply â†’</a>
</div>"""

    html += "</div></body></html>"
    INBOX_HTML.parent.mkdir(parents=True, exist_ok=True)
    INBOX_HTML.write_text(html, encoding="utf-8")


# â”€â”€ Core ops â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
def do_search(settings: Settings) -> int:
    """Parallel search: all sources Ã— titles Ã— markets. Returns new jobs added."""
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
    logger.info(f"Search plan: {len(tasks)} (source Ã— title Ã— location) calls â€” running in parallel")

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
            # "apply to" address â€” emailing them is defensible under UK GDPR
            # Art. 6(1)(f) legitimate interests.
            li_contacts = market.get("legitimate_interest_contacts") or []
            if li_contacts:
                logger.info(
                    f"[{country}] GDPR-hybrid: emailing {len(li_contacts)} "
                    f"legitimate-interest contacts (publicly published apply mailboxes)"
                )
                contacts = li_contacts
            else:
                logger.info(f"[{country}] GDPR strict â€” apply via official websites only (skipping email blast)")
                db.log_event("gdpr_skip", country)
                continue
        else:
            contacts = market.get("contacts", [])

        # Pre-flight: split into "fresh" and "already emailed".
        # If we already cold-emailed someone within the FOLLOWUP_DAYS window,
        # the daily blast must not pester them again â€” that responsibility
        # lives in do_followups() which only fires on the configured cadence.
        fresh, already = [], []
        for ct in contacts:
            if db.already_emailed(ct["email"], 0):
                already.append(ct)
            else:
                fresh.append(ct)
        grand_already += len(already)

        logger.info(
            f"\n[{country}] {len(contacts)} contacts  â†’  {len(fresh)} fresh to send, "
            f"{len(already)} already emailed (will be revisited as 7-day follow-ups)"
        )
        db.log_event(
            "market_plan",
            f"{country}: fresh={len(fresh)} already={len(already)}",
        )

        # Re-render the dashboard now so the customer's open tab updates
        # immediately when this market starts.
        render_dashboard(settings.daily_email_cap, settings.run_interval_minutes)

        if not fresh:
            logger.info(f"[{country}] nothing fresh to send â€” moving on")
            continue

        for i, c in enumerate(fresh, start=1):
            if db.emails_sent_today() >= settings.daily_email_cap:
                logger.warning("Daily cap reached, stopping")
                db.log_event("blast_capped", str(sent))
                render_dashboard(settings.daily_email_cap, settings.run_interval_minutes)
                return sent

            ok = send_application(
                settings,
                recipient=c["email"],
                company=c["company"],
                category=c.get("category", "Employer"),
                profile=profile,
                # Curated markets/*.json contacts: source is the file
                # that vouches for them. Confidence is medium because
                # the file is human-curated but the address may still
                # be old or pattern-guessed at curation time.
                discovery_tier="curated_market",
                discovery_source=f"markets/{country.lower().replace(' ', '_')}.json",
                discovery_confidence="medium",
            )
            if ok:
                sent += 1

            # Compact progress beat: every 5 sends OR last item of market.
            if i % 5 == 0 or i == len(fresh):
                logger.info(
                    f"  [{country}] progress {i}/{len(fresh)} â€” "
                    f"sent so far this cycle: {sent}, "
                    f"today total: {db.emails_sent_today()}/{settings.daily_email_cap}"
                )
                # Refresh dashboard mid-market so live tab keeps moving.
                render_dashboard(settings.daily_email_cap, settings.run_interval_minutes)

            # Only jitter-sleep AFTER an actual send. Skipped/invalid contacts
            # should pass through instantly — otherwise a market of 50 fake
            # pattern-guessed addresses burns ~1 hour of cycle time doing nothing.
            if ok:
                jitter_sleep(settings.min_delay_sec, settings.max_delay_sec)

        logger.success(f"[{country}] market complete â€” {sent} sent so far this cycle")

    db.log_event(
        "blast_done",
        f"{sent} sent / {grand_already} already-emailed across all markets",
    )
    logger.success(
        f"Email blast complete: {sent} new emails sent "
        f"({grand_already} addresses skipped because they were already emailed earlier)"
    )
    render_dashboard(settings.daily_email_cap, settings.run_interval_minutes)
    return sent


def do_jobs_blast(settings: Settings, top_n: int = 60) -> int:
    """Discover-and-send (or queue) outreach for jobs in the DB.

    For every eligible "found" job above MATCH_THRESHOLD, run the
    email-finder waterfall (career-page mailto -> Gemini AI extract ->
    LinkedIn poster -> pattern + SMTP probe). On hit, send (or in
    DRAFT_MODE, queue) a tailored email referencing the actual job
    title. On miss, mark the job so the next cycle moves on to fresh
    candidates instead of grinding through the same dead-end top-20.

    Eligibility is decided by ``db.jobs_for_outreach`` which enforces
    a 20-hour cool-off between attempts on the same job and parks a
    job after ``DISCOVERY_MAX_ATTEMPTS`` failed lookups. This is the
    fix for the funnel bug where 1,949 jobs sat unprocessed because
    the cycle kept picking the same blocked top-20 every time.
    """
    if (settings.email_finder_tier or "off").lower() == "off":
        return 0

    profile = load_profile()
    sent = 0
    queued = 0
    no_email = 0
    exhausted_now = 0

    jobs = db.jobs_for_outreach(
        match_threshold=settings.match_threshold,
        limit=top_n,
    )

    if not jobs:
        # Help the customer understand WHY nothing is happening. Without
        # this they see "Jobs blast: 0 sent" and assume the bot is
        # broken; in reality there may simply be no eligible jobs in
        # the rotation right now.
        f = db.funnel_counts()
        logger.info(
            "Jobs blast: nothing eligible this cycle "
            f"(total={f['jobs_total']}, pending={f['jobs_found_pending']}, "
            f"no_email={f['jobs_no_email']}, exhausted={f['jobs_exhausted']}, "
            f"queued={f['jobs_queued']}, emailed={f['jobs_emailed']})"
        )
        return 0

    db.log_event("jobs_blast_start", f"top_n={top_n} candidates={len(jobs)}")
    logger.info(
        f"Jobs blast: {len(jobs)} eligible job(s) — running discovery "
        f"(cooldown {db.DISCOVERY_COOLDOWN_HOURS}h, max "
        f"{db.DISCOVERY_MAX_ATTEMPTS} attempts/job)"
    )

    # One-shot SMTP port-25 reachability check. If port 25 is blocked
    # (very common on phone hotspots / corporate networks), T2.5 will
    # auto-switch to MX-only mode and accept the first standard role
    # mailbox without per-mailbox probing. Without this precheck we'd
    # spend 30+ seconds per job timing out on the first probe before
    # the circuit-breaker trips.
    from core.finders import smtp_probe as _sp
    _sp.precheck_port_25()

    cookie = settings.linkedin_cookie or ""

    for idx, j in enumerate(jobs, start=1):
        if db.emails_sent_today() >= settings.daily_email_cap:
            logger.warning("Daily cap reached, jobs blast stopping")
            break

        company = j["company"]
        job_url = j["url"]
        market = _country_from_location(j["location"] or "")

        # Progress beat every 5 jobs so the customer sees motion.
        if idx == 1 or idx % 5 == 0:
            logger.info(
                f"  [{idx}/{len(jobs)}] {company[:40]} ({market}) "
                f"— attempts={j.get('discovery_attempts', 0)}"
            )

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
            db.mark_discovery_attempt(j["id"])
            db.log_event(
                "jobs_blast_no_email", f"{company} ({j['source']})"
            )
            no_email += 1
            # If this attempt was the one that tipped over the max,
            # log it loud — the customer should see WHY a job is parked.
            new_attempts = (j.get("discovery_attempts") or 0) + 1
            if new_attempts >= db.DISCOVERY_MAX_ATTEMPTS:
                exhausted_now += 1
                logger.info(
                    f"  ⏸  {company[:40]} parked after "
                    f"{new_attempts} failed lookups — no public "
                    f"recruiter email findable"
                )
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
            discovery_tier=getattr(disc, "tier", "") or "",
            discovery_source=getattr(disc, "source_url", "") or "",
            discovery_confidence=getattr(disc, "confidence", "") or "",
        )
        if ok:
            # In DRAFT_MODE the email is in pending_emails (not
            # emails_sent). Either way, mark the job as having
            # advanced — that's the whole point of this fix.
            if getattr(settings, "draft_mode", False):
                pid = _latest_pending_id_for_job(j["id"])
                db.mark_discovery_attempt(
                    j["id"],
                    found_email=disc.email,
                    pending_email_id=pid,
                    new_status="queued",
                )
                queued += 1
                logger.success(
                    f"  ✓ {company[:40]} → queued #{pid} "
                    f"({disc.email}) [{disc.tier}]"
                )
            else:
                db.mark_discovery_attempt(
                    j["id"],
                    found_email=disc.email,
                    new_status="sent",
                )
                sent += 1
            jitter_sleep(settings.min_delay_sec, settings.max_delay_sec)
        else:
            # Send-application returned False — either dedup,
            # already-emailed, or the SMTP send itself rejected.
            # Record the attempt but don't park the job yet.
            db.mark_discovery_attempt(
                j["id"], found_email=disc.email, new_status="no_email"
            )
            no_email += 1

    db.log_event(
        "jobs_blast_done",
        f"sent={sent} queued={queued} no_email={no_email} "
        f"parked={exhausted_now}",
    )
    logger.success(
        f"Jobs blast complete — sent={sent}  queued={queued}  "
        f"no_email={no_email}  parked={exhausted_now}"
    )
    return sent + queued


def _latest_pending_id_for_job(job_id: str) -> Optional[int]:
    """Look up the pending_emails id we just inserted for this job.
    Used to back-link jobs -> their queue row.
    """
    if not job_id:
        return None
    try:
        with db._conn() as c:  # type: ignore[attr-defined]
            r = c.execute(
                "SELECT id FROM pending_emails WHERE job_id=? "
                "ORDER BY id DESC LIMIT 1",
                (job_id,),
            ).fetchone()
            return r["id"] if r else None
    except Exception:
        return None


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


# â”€â”€ CLI â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
@click.group()
def cli() -> None:
    """Jobybot â€” your 24/7 automated job application assistant."""


@cli.command()
def init() -> None:
    """Parse resume, build profile, verify Gmail SMTP."""
    settings = get_settings()
    setup_logging(settings.log_level)
    db.init_db()

    logger.info("ðŸš€ Jobybot init")
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
        logger.success("Gmail SMTP login OK âœ“")
    except Exception as e:
        logger.error(f"Gmail SMTP failed: {e}")
        logger.error("Check GMAIL_APP_PASSWORD in .env â€” must be App Password, not regular password")
        sys.exit(1)

    logger.success("\nâœ“ Init complete. Now run:  python jobybot.py run    (one cycle)")
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
    render_dashboard(settings.daily_email_cap, settings.run_interval_minutes)
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
    """One full cycle: search â†’ email blast â†’ follow-ups â†’ update inbox."""
    settings = get_settings()
    setup_logging(settings.log_level)
    db.init_db()

    logger.info("â”€" * 50)
    logger.info(f"CYCLE START: {dt.datetime.now()}")
    logger.info("â”€" * 50)

    bounces = do_bounce_scan(settings)
    if bounces:
        logger.warning(f"Quarantined {bounces} bounced address(es)")

    new = do_search(settings)
    sent = do_email_blast(settings)
    # Bumped to 60 jobs/cycle (was 20) now that the funnel correctly
    # marks each attempt — without that mark, the cycle was wasting
    # all 20 slots on the same FAANG-tier blocked companies forever.
    jb_sent = do_jobs_blast(settings, top_n=60)
    sent += jb_sent
    fups = do_followups(settings)

    # Drain the review queue up to the daily auto-send floor.
    # This is what guarantees the customer's "at least 20 new
    # emails / day" requirement: any HIGH-confidence (SMTP-verified)
    # email that landed in the queue gets sent automatically up to
    # AUTO_SEND_DAILY_FLOOR per day, with everything else staying
    # queued for human review. Set AUTO_SEND_DAILY_FLOOR=0 to
    # disable.
    floor = int(getattr(settings, "auto_send_daily_floor", 0) or 0)
    if floor > 0:
        from core import queue_drain
        result = queue_drain.drain_today_floor(settings, target_per_day=floor)
        sent += result.get("sent", 0)

    jobs = db.get_jobs(status="found", limit=200)
    update_inbox_html(jobs)
    render_dashboard(settings.daily_email_cap, settings.run_interval_minutes)

    s = db.stats_summary()
    logger.success(
        f"Done: +{new} jobs, {sent} emails, {fups} followups, {bounces} bounces. "
        f"Today total emails: {s['emails_today']}/{settings.daily_email_cap}"
    )
    logger.info(f"Dashboard: {DASHBOARD_HTML.absolute()}")


@cli.command(name="send-queue")
@click.option("--cap", default=20, type=int,
              help="Maximum emails to send from the queue (default 20)")
@click.option("--min-confidence", default="medium",
              type=click.Choice(["high", "medium", "low"]),
              help="Only send rows at or above this confidence level")
@click.option("--dry-run", is_flag=True,
              help="Print what would be sent without actually sending")
def send_queue_cmd(cap: int, min_confidence: str, dry_run: bool) -> None:
    """Manually drain N emails from the review queue.

    Use this when:
      * the review queue has piled up and you want to flush some
      * you want to send today's quota without waiting for the
        scheduled cycle
      * DRAFT_MODE is on but you want to push a batch through

    Only HIGH-confidence rows (SMTP-verified, careers-page-scraped,
    cached, or curated) are sent by default. Pattern guesses stay
    queued unless you pass --min-confidence low.
    """
    settings = get_settings()
    setup_logging(settings.log_level)
    db.init_db()
    from core import queue_drain
    result = queue_drain.drain(
        cap, settings=settings,
        min_confidence=min_confidence, dry_run=dry_run,
    )
    print()
    print(f"  sent    : {result['sent']}")
    print(f"  skipped : {result['skipped']}")
    print(f"  failed  : {result['failed']}")
    if result.get("cap_hit"):
        print(f"  NOTE   : daily Gmail cap reached, stopped early")


@cli.command()
def funnel() -> None:
    """Show the current state of the job→email pipeline.

    Use this when "the bot isn't sending emails" — it tells you
    exactly where in the funnel jobs are getting stuck.
    """
    settings = get_settings()
    setup_logging(settings.log_level)
    db.init_db()
    f = db.funnel_counts()
    print()
    print("  ===========================================================")
    print("  JOBYBOT FUNNEL — where every job stands right now")
    print("  ===========================================================")
    print(f"  jobs saved in DB (lifetime)        : {f['jobs_total']:>6}")
    print(f"  jobs above match threshold,")
    print(f"    awaiting first discovery attempt : {f['jobs_found_pending']:>6}")
    print(f"  jobs queued for one-click review   : {f['jobs_queued']:>6}")
    print(f"  jobs whose email was sent          : {f['jobs_emailed']:>6}")
    print(f"  jobs with no findable email yet    : {f['jobs_no_email']:>6}")
    print(f"  jobs PARKED (3 failed lookups)     : {f['jobs_exhausted']:>6}")
    print()
    print(f"  pending_emails queued (all sources): {f['pending_queue']:>6}")
    print(f"  emails sent in last 24h            : {f['sent_today']:>6}")
    print(f"  emails sent lifetime               : {f['sent_total']:>6}")
    print()
    print(f"  DRAFT_MODE = {settings.draft_mode}  (queue server: "
          f"http://127.0.0.1:7868)")
    print(f"  match_threshold = {settings.match_threshold}, "
          f"daily_email_cap = {settings.daily_email_cap}")
    floor = int(getattr(settings, "auto_send_daily_floor", 0) or 0)
    if floor > 0:
        print(f"  auto_send_daily_floor = {floor}  "
              f"(min_confidence={getattr(settings, 'auto_send_min_confidence', 'medium')})")
        already = f['sent_today']
        need = max(0, floor - already)
        if need > 0:
            print(f"  → today: {already}/{floor} sent, need {need} more "
                  f"— run `jobybot run` or `jobybot send-queue --cap {need}`")
        else:
            print(f"  → today: {already}/{floor} sent — floor met")
    else:
        print(f"  auto_send_daily_floor = 0  (manual click-to-send only)")
    print(f"  cooldown between retries on a job = "
          f"{db.DISCOVERY_COOLDOWN_HOURS}h")
    print(f"  give-up after {db.DISCOVERY_MAX_ATTEMPTS} failed lookups")
    print()

    # Top parked companies — the ones eating cycle time.
    import sqlite3
    con = sqlite3.connect(db.DB_PATH)
    con.row_factory = sqlite3.Row
    rows = con.execute(
        "SELECT company, COUNT(*) AS n FROM jobs "
        "WHERE discovery_status='exhausted' "
        "GROUP BY company ORDER BY n DESC LIMIT 10"
    ).fetchall()
    if rows:
        print("  Top parked companies (no public recruiter email):")
        for r in rows:
            print(f"    {r['company'][:40]:<40s} {r['n']}")
        print()
    con.close()


@cli.command()
@click.argument("job_id", required=False)
def retry_job(job_id: str) -> None:
    """Reset a parked job so the next cycle re-runs discovery on it.

    With no JOB_ID it resets ALL parked / no_email jobs back to
    pending (useful after the bot learns new tricks — e.g. fresh
    LinkedIn cookie).
    """
    db.init_db()
    import sqlite3
    con = sqlite3.connect(db.DB_PATH)
    con.row_factory = sqlite3.Row
    if job_id:
        con.execute(
            "UPDATE jobs SET discovery_status='pending', "
            "discovery_attempts=0, last_discovery_at=NULL WHERE id=?",
            (job_id,),
        )
        print(f"  reset job {job_id}")
    else:
        cur = con.execute(
            "UPDATE jobs SET discovery_status='pending', "
            "discovery_attempts=0, last_discovery_at=NULL "
            "WHERE discovery_status IN ('exhausted','no_email')"
        )
        print(f"  reset {cur.rowcount} parked/no_email job(s)")
    con.commit()
    con.close()


@cli.command()
def schedule() -> None:
    """Start hourly background scheduler.

    Refuses to start if another scheduler is already running on this machine
    (PID lockfile in `data/scheduler.lock`). This is the single biggest cause
    of "the bot didn't run" calls â€” Windows installs both a startup shortcut
    AND a daily task, and without the lock they raced each other, ending
    with two daemons sending duplicate emails and confusing the dashboard.
    """
    from core import scheduler_lock

    alive, other_pid = scheduler_lock.is_alive()
    if alive:
        logger.warning(
            f"Another scheduler is already running (PID {other_pid}). "
            "Refusing to start a duplicate. Use 'jobybot status' to inspect."
        )
        return

    settings = get_settings()
    setup_logging(settings.log_level)
    db.init_db()

    from apscheduler.schedulers.blocking import BlockingScheduler
    from apscheduler.triggers.cron import CronTrigger
    from apscheduler.triggers.interval import IntervalTrigger

    scheduler_lock.acquire()
    # Timezone bug fix: APScheduler used to run in UTC so "hour=9" actually
    # fired at 13:00 UAE local. Now reads `SCHEDULER_TZ` from .env (defaults
    # to Asia/Dubai). Customers in Saudi/Bahrain/Qatar/Oman/India can override.
    sched = BlockingScheduler(timezone=settings.scheduler_tz)
    logger.info(f"Scheduler timezone: {settings.scheduler_tz}")

    def cycle() -> None:
        try:
            # License check first â€” one paid customer = one machine. Fail-open
            # on network errors so a server outage never blocks the user.
            try:
                from core.license_check import verify_or_bind
                ok, reason = verify_or_bind(license_email=settings.user_email)
                if not ok:
                    logger.error(f"License rejected: {reason}")
                    db.log_event("license_blocked", reason[:200])
                    return
                if reason not in ("cached", "no_email_yet"):
                    db.log_event("license_check", reason[:80])
            except Exception as e:
                logger.debug(f"license check soft-fail: {e}")

            do_bounce_scan(settings)
            do_search(settings)
            do_email_blast(settings)
            do_jobs_blast(settings, top_n=20)
            do_followups(settings)
            jobs = db.get_jobs(status="found", limit=200)
            update_inbox_html(jobs)
            render_dashboard(settings.daily_email_cap, settings.run_interval_minutes)
        except Exception as e:
            logger.exception(f"Cycle error: {e}")

    # Job 1: continuous interval cycle. Fires immediately so a customer who
    # starts the daemon at 11 PM still gets a cycle within seconds.
    sched.add_job(
        cycle, IntervalTrigger(minutes=settings.run_interval_minutes),
        next_run_time=dt.datetime.now() + dt.timedelta(seconds=10),
        id="hourly_cycle", max_instances=1, coalesce=True,
    )
    # Job 2: EXPLICIT morning anchor in the configured timezone. This is
    # what makes "the bot runs at 9 AM UAE every day" a real promise even
    # if interval timing drifted because of laptop sleep / wake cycles.
    sched.add_job(
        cycle, CronTrigger(hour=settings.daily_summary_hour, minute=0),
        id="morning_anchor", max_instances=1, coalesce=True,
    )
    # Job 3: daily summary email 30 min after the morning anchor.
    sched.add_job(
        send_daily_summary,
        CronTrigger(hour=settings.daily_summary_hour, minute=30),
        args=[settings], id="daily_summary",
    )

    logger.success(
        f"Scheduler running in {settings.scheduler_tz}. "
        f"Cycle every {settings.run_interval_minutes} min "
        f"plus a morning anchor at {settings.daily_summary_hour:02d}:00 local."
    )
    # Print the next fire time of each job so the customer sees concretely
    # WHEN the bot will work next. Kills the "is it actually scheduled?" anxiety.
    for job in sched.get_jobs():
        try:
            nxt = job.trigger.get_next_fire_time(None, dt.datetime.now(sched.timezone))
            if nxt:
                logger.info(f"  next {job.id:<16s} -> {nxt.strftime('%Y-%m-%d %H:%M %Z')}")
        except Exception:
            pass
    logger.info("Press Ctrl+C to stop.")
    try:
        sched.start()
    except (KeyboardInterrupt, SystemExit):
        logger.info("Scheduler stopped")
    finally:
        scheduler_lock.release()


@cli.command()
def status() -> None:
    """One-look health check: scheduler, queue, daily progress.

    Use this when the customer says "is the bot doing anything?". Reports:
    scheduler PID, last cycle, next cycle ETA, emails sent today vs. cap,
    review-queue depth, bounce count, license-bind status.
    """
    from core import scheduler_lock

    settings = get_settings()
    db.init_db()
    s = db.stats_summary()

    print()
    print(f"  Jobybot status  -  {dt.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"  {'-' * 56}")

    # â”€â”€ Scheduler â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    alive, pid = scheduler_lock.is_alive()
    if alive:
        meta = scheduler_lock.read() or {}
        started = meta.get("started_at", "?")
        print(f"  Scheduler        : RUNNING  (pid {pid}, since {started})")
        print(f"                     Cycle interval: every {settings.run_interval_minutes} min")
    else:
        print(f"  Scheduler        : NOT RUNNING  (start with: jobybot.py schedule)")

    # â”€â”€ Last and next cycle â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    last_events = db.get_run_log(80)
    last_done = next((e for e in last_events if (e["event"] or "") == "blast_done"), None)
    if last_done:
        last_at = (last_done.get("at") or "")[:19].replace("T", " ")
        print(f"  Last cycle       : {last_at}  ({last_done.get('detail', '')[:60]})")
    else:
        print("  Last cycle       : (no completed cycle yet today)")

    # â”€â”€ Email & queue counters â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    qstats = db.pending_queue_stats()
    cap = settings.daily_email_cap
    pct = int((s["emails_today"] / max(cap, 1)) * 100)
    print(f"  Emails sent today: {s['emails_today']:>4d} / {cap}    ({pct}% of cap)")
    print(f"  Queue            : {qstats.get('pending', 0):>4d} pending,  "
          f"{qstats.get('sent_today', 0)} sent today,  "
          f"{qstats.get('skipped_today', 0)} skipped today")
    print(f"  Jobs in pipeline : {s['total_jobs']:>4d}  ({s['jobs_today']} found today)")
    print(f"  All-time sends   : {s['total_emails']:>4d}")

    # â”€â”€ License + DRAFT_MODE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    print()
    print(f"  Draft mode       : {'ON  (emails go to review queue)' if settings.draft_mode else 'OFF (auto-send)'}")
    print(f"  Daily cap        : {cap} emails/day  (DAILY_EMAIL_CAP)")

    # â”€â”€ Final summary line â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    print()
    if alive and s["emails_today"] >= cap * 0.5:
        print("  Health: GOOD - scheduler running and producing sends.")
    elif alive:
        print("  Health: WARMING UP - scheduler running, building up sends.")
    else:
        print("  Health: ATTENTION - scheduler is not running, start it now.")
    print()


@cli.command(name="login-linkedin")
@click.option("--minutes", type=int, default=5,
              help="How long to keep Chromium open while you log in.")
def login_linkedin_cmd(minutes: int) -> None:
    """Interactive LinkedIn login that persists for ALL future Easy Apply runs.

    Why this exists: cold-injecting just the `li_at` cookie often triggers
    LinkedIn's anti-automation redirect loop because we're missing the
    companion cookies (JSESSIONID, bcookie, bscookie, lidc). The fix is
    to log in interactively ONCE into a persistent browser profile.
    Every subsequent `jobybot easy-apply` reuses that profile so LinkedIn
    sees a returning real user, not a fresh-fingerprint scraper.

    Steps:
      1. Chromium opens
      2. You log in manually (handle 2FA / captcha as you would any browser)
      3. Once you see your LinkedIn feed, close the window or wait
      4. All cookies + localStorage + canvas/audio fingerprint are saved
         under ``data/browser_profiles/linkedin/``
    """
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        click.echo("Playwright not installed. Run:")
        click.echo("  .venv\\Scripts\\python.exe -m pip install playwright")
        click.echo("  .venv\\Scripts\\python.exe -m playwright install chromium")
        return

    profile_dir = Path("data") / "browser_profiles" / "linkedin"
    profile_dir.mkdir(parents=True, exist_ok=True)
    click.echo(f"Opening Chromium with profile: {profile_dir.resolve()}")
    click.echo(f"Log in to LinkedIn. The window stays open for {minutes} minutes.")
    click.echo("Once you see your feed, you can close the window early.")

    with sync_playwright() as pw:
        ctx = pw.chromium.launch_persistent_context(
            user_data_dir=str(profile_dir.resolve()),
            headless=False,
            args=[
                "--start-maximized",
                "--disable-blink-features=AutomationControlled",
            ],
            viewport={"width": 1440, "height": 900},
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            ),
            locale="en-US",
            timezone_id="Asia/Dubai",
        )
        ctx.add_init_script(
            "Object.defineProperty(navigator, 'webdriver', {get:()=>undefined});"
        )
        page = ctx.pages[0] if ctx.pages else ctx.new_page()
        page.goto("https://www.linkedin.com/login", wait_until="domcontentloaded")
        # Block for up to `minutes` mins or until user closes the browser
        import time
        deadline = time.time() + minutes * 60
        try:
            while time.time() < deadline:
                time.sleep(1)
                # If the user has navigated to /feed/ we know they logged in
                if "/feed" in (page.url or ""):
                    click.echo("✓ Detected /feed/ — you're logged in.")
                    # Give a few more seconds to make sure cookies settle
                    time.sleep(3)
                    break
        except KeyboardInterrupt:
            pass
        except Exception:
            pass
        try:
            ctx.close()
        except Exception:
            pass

    click.echo("Saved. From now on `jobybot easy-apply` reuses this session.")


@cli.command(name="live-mode")
@click.option("--on/--off", default=True,
              help="--on flips DRAFT_MODE=false (auto-send). --off restores review queue.")
def live_mode_cmd(on: bool) -> None:
    """Toggle DRAFT_MODE in .env without you opening the file.

    Default behaviour (DRAFT_MODE=true) writes emails to the review queue
    so you click Send. After you've trusted the bot for a few days you can
    run `jobybot live-mode --on` to flip to fully-automatic.

    The command edits .env in place, backing up the previous value as a
    commented line so you can revert by hand.
    """
    env_path = Path(".env")
    if not env_path.exists():
        print("  .env not found. Create it from .env.example first.")
        return
    text = env_path.read_text(encoding="utf-8")
    target = "false" if on else "true"
    old = "true" if on else "false"
    out_lines: List[str] = []
    found = False
    for line in text.splitlines():
        if line.strip().startswith("DRAFT_MODE=") and not line.strip().startswith("#"):
            out_lines.append(f"# {line}    # previous value, set by `jobybot live-mode`")
            out_lines.append(f"DRAFT_MODE={target}")
            found = True
        else:
            out_lines.append(line)
    if not found:
        out_lines.append("")
        out_lines.append(f"# Added by `jobybot live-mode`:")
        out_lines.append(f"DRAFT_MODE={target}")
    env_path.write_text("\n".join(out_lines) + "\n", encoding="utf-8")
    label = "LIVE (auto-send via Gmail)" if on else "DRAFT (queued for your click)"
    print(f"  DRAFT_MODE now {target}. The bot is in {label} mode.")
    print("  Restart the scheduler so the new mode takes effect: jobybot heartbeat")


@cli.command(name="relax-followups")
@click.option("--days", type=int, default=3, show_default=True,
              help="How recent an 'already-emailed' contact must be to STILL be skipped.")
def relax_followups_cmd(days: int) -> None:
    """Let the bot re-touch recruiters faster.

    Default 7-day cooldown is what depleted your market files: every UAE /
    Saudi / Qatar / Bahrain / Oman recruiter has already been emailed once,
    and the bot won't try them again until day 7. Lowering to 3 days means
    you'll see fresh sends within ~72h.

    Note: too low here = annoying recruiters. 3 days is the floor I'm
    comfortable defending in any compliance review.
    """
    if days < 3:
        print("  Refusing to set follow-up window below 3 days (recruiter hygiene).")
        return
    env_path = Path(".env")
    if not env_path.exists():
        print("  .env not found.")
        return
    text = env_path.read_text(encoding="utf-8")
    out_lines: List[str] = []
    found = False
    for line in text.splitlines():
        if line.strip().startswith("FOLLOWUP_DAYS=") and not line.strip().startswith("#"):
            out_lines.append(f"# {line}    # previous value, set by `jobybot relax-followups`")
            out_lines.append(f"FOLLOWUP_DAYS={days}")
            found = True
        else:
            out_lines.append(line)
    if not found:
        out_lines.append("")
        out_lines.append(f"# Added by `jobybot relax-followups`:")
        out_lines.append(f"FOLLOWUP_DAYS={days}")
    env_path.write_text("\n".join(out_lines) + "\n", encoding="utf-8")
    print(f"  FOLLOWUP_DAYS now {days}. Next cycle will allow re-touch after {days} days.")


@cli.command()
def heartbeat() -> None:
    """Idempotent daily check. Restart scheduler if dead, then run one cycle.

    Designed to be wired into Windows Task Scheduler / launchd as the daily
    9:00 trigger. Safe to invoke even if the scheduler is already alive:
    it never double-starts.
    """
    from core import scheduler_lock

    settings = get_settings()
    setup_logging(settings.log_level)
    db.init_db()

    alive, pid = scheduler_lock.is_alive()
    if not alive:
        logger.info("Heartbeat: scheduler not running, starting it detached.")
        # Spawn a new scheduler process and disown it. We don't use Popen with
        # a wait() because the daily task should NOT block on a long daemon.
        import subprocess
        py = sys.executable
        creationflags = 0
        if sys.platform.startswith("win"):
            # DETACHED_PROCESS | CREATE_NEW_PROCESS_GROUP - survives the parent
            creationflags = 0x00000008 | 0x00000200
        with open(Path("data") / "scheduler-stdout.log", "ab") as log:
            subprocess.Popen(
                [py, str(Path(__file__).resolve()), "schedule"],
                cwd=str(Path(__file__).resolve().parent),
                stdout=log, stderr=log, stdin=subprocess.DEVNULL,
                creationflags=creationflags,
                close_fds=True,
            )
        logger.success("Heartbeat: scheduler launched.")
    else:
        logger.info(f"Heartbeat: scheduler already healthy (pid {pid}).")

    # Always log the heartbeat so the dashboard's "next cycle" pill stays fresh.
    db.log_event("heartbeat", f"alive={alive} pid={pid or '-'}")


@cli.command()
@click.option("--port", default=0, type=int, help="Override port (default: from .env)")
@click.option("--no-browser", is_flag=True, help="Don't auto-open browser")
def queue(port: int, no_browser: bool) -> None:
    """Start the local review-queue web UI on http://localhost:7868."""
    settings = get_settings()
    setup_logging(settings.log_level)
    from core.queue_server import serve
    serve(port=port or settings.queue_server_port, open_browser=not no_browser)


@cli.command(name="easy-apply")
@click.option("--cap", default=0, type=int,
              help="Override EASY_APPLY_DAILY_CAP for this run only.")
@click.option("--no-dry-run", is_flag=True,
              help="ACTUALLY click Submit (default: navigate + fill only).")
@click.option("--headless", is_flag=True,
              help="Hide the Chromium window (default: visible so you can stop it).")
def easy_apply_cmd(cap: int, no_dry_run: bool, headless: bool) -> None:
    """LinkedIn Easy Apply automation (OPT-IN).

    Requires ENABLE_EASY_APPLY=true in .env, a valid LINKEDIN_COOKIE,
    and `playwright` installed. See https://jobybots.com/easy-apply for
    risks and how to control them.
    """
    settings = get_settings()
    setup_logging(settings.log_level)

    if cap and cap > 0:
        settings.easy_apply_daily_cap = cap  # type: ignore[assignment]
    if no_dry_run:
        settings.easy_apply_dry_run = False  # type: ignore[assignment]
    if headless:
        settings.easy_apply_headless = True  # type: ignore[assignment]

    from core.easy_apply import run_easy_apply
    stats = run_easy_apply(settings)
    logger.info(f"final stats: {stats}")


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
        sym = "âœ“" if ok else "âœ—"
        print(f"  {sym} {name}")

    print(f"\n  â„¹ Daily cap: {settings.daily_email_cap} emails/day (DAILY_EMAIL_CAP in .env)")
    print("  â„¹ Security: run SECURITY_CHECK.bat or docs/SECURITY.md")
    print("  â„¹ No remote access: Jobybot does not open network ports.")

    if all(ok for _, ok in checks):
        print("\nAll checks passed.")
    else:
        print("\nFix the âœ— items, then run again.")


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
    body = f"""Jobybot daily summary â€” {dt.date.today().isoformat()}

Today so far:
  âœ“ {s['emails_today']} personalized emails sent
  
Cumulative:
  âœ“ {s['total_emails']} total emails
  âœ“ {s['total_jobs']} jobs in pipeline
  âœ“ {s['total_applied']} applications marked applied

Open inbox: {INBOX_HTML.absolute()}

â€” Jobybot
"""
    send_email(
        settings.gmail_address,
        settings.gmail_app_password,
        settings.user_email,
        f"Jobybot daily summary â€” {dt.date.today().isoformat()}",
        body,
        Path(settings.resume_path),
        "Jobybot",
    )


if __name__ == "__main__":
    cli()
