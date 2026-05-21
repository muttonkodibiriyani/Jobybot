"""Render a single-page HTML dashboard with stats, sources, bounces, and run log."""
from __future__ import annotations

import datetime as dt
import html
from pathlib import Path
from typing import Any, Dict

from . import db

DASHBOARD_HTML = Path("data") / "dashboard.html"


def _h(s: Any) -> str:
    return html.escape(str(s)) if s is not None else ""


def render_dashboard(daily_cap: int) -> None:
    s = db.stats_summary()
    sources = db.jobs_by_source()
    bounces = db.get_invalid_emails(50)
    events = db.get_run_log(100)
    jobs = db.get_jobs(status="found", limit=200)
    discovery_recent = db.recent_discovery(50)
    discovery_counts = db.discovery_tier_counts(days=7)

    today_pct = min(100, int((s["emails_today"] / max(daily_cap, 1)) * 100))

    # ── Live-cycle banner ───────────────────────────────────────────
    # Walks the most-recent run-log events to figure out, in plain English,
    # what JobyBot is doing *right now* — search, AI scoring, market blast,
    # bounce scan, or idle. This is what a customer's eyes go to first.
    now = dt.datetime.utcnow()
    last_event = events[0] if events else None
    age_min = 999.0
    if last_event:
        try:
            last_at = dt.datetime.fromisoformat((last_event["at"] or "").replace("Z", ""))
            age_min = (now - last_at).total_seconds() / 60.0
        except Exception:
            age_min = 999.0

    live_status = "Idle — bot is not currently running"
    live_kind = "idle"
    if last_event and age_min < 30:
        ev = (last_event["event"] or "").lower()
        detail = last_event["detail"] or ""
        live_kind = "active"
        if ev == "search_start":
            live_status = f"🔎 Searching all 7 sources right now — {detail}"
        elif ev == "search_done":
            live_status = f"✓ Search finished — {detail}. Starting email outreach…"
        elif ev == "market_plan":
            live_status = f"📋 Planning a market — {detail}"
        elif ev == "blast_start":
            live_status = "📨 Starting personalised email outreach to recruiters…"
        elif ev == "email_sent":
            live_status = f"📨 Just sent: {detail}"
        elif ev == "email_failed":
            live_status = f"⚠️ Last send failed: {detail}"
        elif ev == "bounces_marked":
            live_status = f"♻️ Quarantining bounced addresses — {detail}"
        elif ev == "blast_capped":
            live_status = f"✓ Daily cap reached — {detail} emails sent today"
        elif ev == "blast_done":
            live_status = f"✓ Cycle complete — {detail}"
        elif ev == "gdpr_skip":
            live_status = f"🇪🇺 Skipping {detail} (GDPR-strict, applying via website only)"
        else:
            live_status = f"{ev}: {detail}"
    elif last_event:
        live_status = (
            f"💤 Last activity {int(age_min)} min ago. "
            f"Next cycle starts automatically on the schedule."
        )

    src_rows = "".join(
        f'<div class="src-row"><span>{_h(r["source"])}</span><strong>{r["n"]}</strong></div>'
        for r in sources
    ) or '<div class="muted">No sources yet — run search.</div>'

    bounce_rows = "".join(
        f'<tr><td class="mono">{_h(r["email"])}</td>'
        f'<td>{_h(r["reason"])}</td><td class="mono">{_h(r["bounce_code"])}</td>'
        f'<td class="mono">{_h((r["bounced_at"] or "")[:19])}</td></tr>'
        for r in bounces
    ) or '<tr><td colspan="4" class="muted">No bounces logged.</td></tr>'

    # ── Discovery Quality panel ─────────────────────────────────────
    # Per-tier success/fail counts last 7 days
    tier_summary: Dict[str, Dict[str, int]] = {}
    for r in discovery_counts:
        tier = r.get("tier", "?")
        dec  = r.get("decision", "?")
        tier_summary.setdefault(tier, {})[dec] = int(r.get("n", 0))

    tier_rows = ""
    for tier_name in ("t0_cache", "t1_careers", "t2_linkedin", "t3_pattern", "final"):
        bucket = tier_summary.get(tier_name, {})
        if not bucket:
            continue
        total = sum(bucket.values())
        hits = bucket.get("hit", 0) + bucket.get("found", 0) + bucket.get("probe_ok", 0)
        pct = int((hits / total) * 100) if total else 0
        details = " · ".join(f"{k}={v}" for k, v in bucket.items())
        tier_rows += (
            f'<div class="src-row"><span class="mono">{_h(tier_name)}</span>'
            f'<span><strong>{hits}</strong>/{total} hits ({pct}%)</span></div>'
            f'<div class="muted" style="text-align:left;padding:0 0 8px 8px;font-size:11px">{_h(details)}</div>'
        )
    if not tier_rows:
        tier_rows = '<div class="muted">No discovery attempts yet — run an email blast.</div>'

    discovery_rows = "".join(
        f'<tr><td class="mono">{_h((r["at"] or "")[:19])}</td>'
        f'<td>{_h((r["company"] or "")[:30])}</td>'
        f'<td><span class="tag">{_h(r["tier"])}</span></td>'
        f'<td class="mono">{_h((r["candidate_email"] or "")[:36])}</td>'
        f'<td>{_h(r["decision"])}</td>'
        f'<td class="mono">{_h(r["probe_code"] or "")}</td></tr>'
        for r in discovery_recent
    ) or '<tr><td colspan="6" class="muted">No discovery attempts yet.</td></tr>'

    event_rows = "".join(
        f'<tr><td class="mono">{_h((r["at"] or "")[:19])}</td>'
        f'<td><span class="tag">{_h(r["event"])}</span></td>'
        f'<td>{_h(r["detail"])}</td></tr>'
        for r in events
    ) or '<tr><td colspan="3" class="muted">Run the bot to populate.</td></tr>'

    job_rows = "".join(
        f'<tr><td><span class="score s{min(99, j.get("match_score", 0)//10*10)}">{j.get("match_score", 0)}</span></td>'
        f'<td>{_h(j["title"][:55])}</td><td>{_h(j["company"][:30])}</td>'
        f'<td>{_h(j["source"])}</td>'
        f'<td><a href="{_h(j["url"])}" target="_blank">Open →</a></td></tr>'
        for j in jobs[:50]
    ) or '<tr><td colspan="5" class="muted">No jobs yet.</td></tr>'

    body = f"""<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8">
<title>Jobybot Dashboard</title>
<meta http-equiv="refresh" content="15">
<style>
  *{{box-sizing:border-box}}
  body{{font-family:-apple-system,Segoe UI,Roboto,sans-serif;margin:0;background:#F7F7F7;color:#0B0B0B}}
  header{{background:#0B0B0B;color:#fff;padding:20px 28px;display:flex;justify-content:space-between;align-items:center}}
  h1{{margin:0;font-size:20px;font-weight:700;letter-spacing:-.01em}}
  .updated{{color:#aaa;font-size:13px}}
  .grid{{display:grid;gap:18px;padding:24px;max-width:1200px;margin:auto}}
  .row{{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px}}
  .kpi{{background:#fff;border:1px solid #E8E8E8;border-radius:14px;padding:18px}}
  .kpi .label{{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.12em;color:#6B6B6B}}
  .kpi .value{{font-size:30px;font-weight:700;margin-top:6px}}
  .kpi .sub{{color:#6B6B6B;font-size:13px;margin-top:2px}}
  .bar{{height:6px;background:#eee;border-radius:99px;margin-top:10px;overflow:hidden}}
  .bar > div{{height:100%;background:#FF6B00;width:{today_pct}%;transition:width .4s}}
  section{{background:#fff;border:1px solid #E8E8E8;border-radius:14px;padding:18px}}
  section h2{{font-size:15px;margin:0 0 12px;font-weight:700}}
  .two{{display:grid;grid-template-columns:1fr 1fr;gap:18px}}
  @media(max-width:900px){{.two{{grid-template-columns:1fr}}}}
  table{{width:100%;border-collapse:collapse;font-size:13px}}
  th,td{{text-align:left;padding:9px 8px;border-bottom:1px solid #F0F0F0}}
  th{{color:#6B6B6B;font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.1em}}
  .mono{{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12px;color:#555}}
  .muted{{color:#888;text-align:center;padding:20px}}
  .src-row{{display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid #F0F0F0}}
  .tag{{display:inline-block;padding:2px 8px;background:#FFF4EB;color:#FF6B00;border-radius:99px;font-size:11px;font-weight:600}}
  .score{{display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;background:#067647;color:#fff;font-weight:700;font-size:12px}}
  .score.s40,.score.s30,.score.s20,.score.s10,.score.s0{{background:#9CA3AF}}
  .score.s50,.score.s60{{background:#F59E0B;color:#0B0B0B}}
  a{{color:#FF6B00;text-decoration:none;font-weight:600}}
  .live{{background:linear-gradient(135deg,#FFF4EB 0%,#FFFFFF 100%);border:1px solid #FFB07A;border-radius:14px;padding:18px 22px;display:flex;align-items:center;gap:14px}}
  .live.idle{{background:#F7F7F7;border-color:#E8E8E8}}
  .live .dot{{width:12px;height:12px;border-radius:50%;background:#10B981;box-shadow:0 0 0 4px rgba(16,185,129,.18);animation:pulse 1.4s infinite}}
  .live.idle .dot{{background:#9CA3AF;box-shadow:0 0 0 4px rgba(156,163,175,.15);animation:none}}
  @keyframes pulse{{0%,100%{{transform:scale(1);opacity:1}}50%{{transform:scale(1.25);opacity:.65}}}}
  .live .label{{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.14em;color:#FF6B00}}
  .live.idle .label{{color:#6B6B6B}}
  .live .msg{{font-size:16px;font-weight:600;margin-top:2px;color:#0B0B0B}}
</style></head>
<body>
<header>
  <h1>JOBYBOT · Dashboard</h1>
  <span class="updated">Updated {_h(dt.datetime.now().strftime('%Y-%m-%d %H:%M:%S'))} · auto-refresh every 15 s</span>
</header>
<div class="grid">
  <div class="live {('idle' if live_kind == 'idle' else '')}">
    <div class="dot"></div>
    <div>
      <div class="label">{('LIVE — bot is working right now' if live_kind == 'active' else 'BOT STATUS')}</div>
      <div class="msg">{_h(live_status)}</div>
    </div>
  </div>

  <div class="row">
    <div class="kpi"><div class="label">Emails today</div><div class="value">{s["emails_today"]}/{daily_cap}</div><div class="bar"><div></div></div></div>
    <div class="kpi"><div class="label">Jobs today</div><div class="value">{s["jobs_today"]}</div><div class="sub">{s["total_jobs"]} total in DB</div></div>
    <div class="kpi"><div class="label">Total emails sent</div><div class="value">{s["total_emails"]}</div><div class="sub">All-time outreach</div></div>
    <div class="kpi"><div class="label">Bounces / invalid</div><div class="value">{s["bounces"]}</div><div class="sub">Never retried</div></div>
  </div>

  <div class="two">
    <section>
      <h2>Jobs by source</h2>
      {src_rows}
    </section>
    <section>
      <h2>Recent activity (last 100 events)</h2>
      <table><thead><tr><th>Time</th><th>Event</th><th>Detail</th></tr></thead>
      <tbody>{event_rows}</tbody></table>
    </section>
  </div>

  <section>
    <h2>Top matched jobs (click to apply)</h2>
    <table><thead><tr><th>Score</th><th>Title</th><th>Company</th><th>Source</th><th></th></tr></thead>
    <tbody>{job_rows}</tbody></table>
  </section>

  <div class="two">
    <section>
      <h2>Discovery quality (last 7 days)</h2>
      {tier_rows}
    </section>
    <section>
      <h2>Recent bounces / invalid addresses</h2>
      <table><thead><tr><th>Email</th><th>Reason</th><th>SMTP code</th><th>When</th></tr></thead>
      <tbody>{bounce_rows}</tbody></table>
    </section>
  </div>

  <section>
    <h2>Recent email discovery attempts</h2>
    <table><thead><tr><th>When</th><th>Company</th><th>Tier</th><th>Candidate</th><th>Decision</th><th>Code</th></tr></thead>
    <tbody>{discovery_rows}</tbody></table>
  </section>
</div>
</body></html>
"""
    DASHBOARD_HTML.parent.mkdir(parents=True, exist_ok=True)
    DASHBOARD_HTML.write_text(body, encoding="utf-8")
