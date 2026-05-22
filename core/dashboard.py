"""Render a single-page HTML dashboard with stats, sources, bounces, and run log.

Design principles (v2):
  • Lead with results — replies, sends today, deliverability — what the
    customer paid for.
  • Hide internal hygiene (SMTP probe failures, GDPR skips, no-email
    discovery attempts) inside a collapsible <details> section.
  • Real bounces (NDR / 5xx delivery failures from inbox) are surfaced
    separately from SMTP-probe rejections (which are just "we never
    sent there anyway").
  • Mobile-first, no external assets, auto-refresh every 15 s.
"""
from __future__ import annotations

import datetime as dt
import html
from pathlib import Path
from typing import Any, Dict, List
from urllib.parse import urlparse

from . import db

DASHBOARD_HTML = Path("data") / "dashboard.html"

# Events the bot logs that aren't actionable for a customer — hide from the
# main "Recent activity" feed. They're still in the raw log for debugging.
NOISE_EVENTS = {
    "gdpr_skip",
    "skip_invalid_email",
    "jobs_blast_no_email",
    "market_plan",
    "discovery_attempt",
}

# Real bounce reasons we DO want to show (Gmail NDR, hard 5xx, etc.).
# SMTP-probe rejections like mx_missing aren't real bounces — those are
# "we never sent there in the first place" and only matter for internal
# hygiene metrics, not customer-facing display.
def _is_real_bounce(row: Dict[str, Any]) -> bool:
    reason = (row.get("reason") or "").lower()
    code   = (row.get("bounce_code") or "").lower()
    if "bounced" in reason:                # IMAP-detected NDR
        return True
    if code and code[:1] in {"4", "5"} and "." in code:  # SMTP RFC code
        return True
    return False


def _h(s: Any) -> str:
    return html.escape(str(s)) if s is not None else ""


def _short(s: str | None, n: int) -> str:
    if not s:
        return ""
    s = str(s)
    return s if len(s) <= n else s[: n - 1] + "…"


def _favicon(url: str | None) -> str:
    """Return a stable favicon URL for a job link's domain.
    Falls back to a transparent 1x1 if the URL is unparseable. Uses
    Google's public favicon service — same one Gmail uses — so customers
    don't see a wall of broken images."""
    if not url:
        return ""
    try:
        host = urlparse(url).netloc or ""
        if not host:
            return ""
        return f"https://www.google.com/s2/favicons?domain={host}&sz=64"
    except Exception:
        return ""


def render_dashboard(daily_cap: int) -> None:
    s = db.stats_summary()
    sources = db.jobs_by_source()
    bounces_all = db.get_invalid_emails(200)
    events_all = db.get_run_log(120)
    jobs = db.get_jobs(status="found", limit=200)
    sends = db.recent_emails(15)
    discovery_recent = db.recent_discovery(40)
    discovery_counts = db.discovery_tier_counts(days=7)

    # ── Manual-review queue (NEW: bot prepares emails, customer clicks send) ─
    # When DRAFT_MODE is on, the bot writes emails to `pending_emails` instead
    # of sending them. The customer reviews & one-clicks "send" from the local
    # REVIEW_QUEUE.bat at http://127.0.0.1:7868 — no surprises, no bounces.
    queue_stats = db.pending_queue_stats()
    queue_recent = db.list_pending_emails(limit=10)

    today_pct = min(100, int((s["emails_today"] / max(daily_cap, 1)) * 100))

    # ── Deliverability % ────────────────────────────────────────────
    # (sent - real_bounces) / sent.   Reads only REAL bounces, not SMTP
    # probe rejections (those never actually went out).
    real_bounces = [b for b in bounces_all if _is_real_bounce(b)]
    real_bounce_count = len(real_bounces)
    total_sent = max(int(s["total_emails"]), 0)
    deliverability = 100
    if total_sent > 0:
        deliverability = max(0, int(((total_sent - real_bounce_count) / total_sent) * 100))

    # ── Live-cycle banner ───────────────────────────────────────────
    now = dt.datetime.utcnow()
    last_event = events_all[0] if events_all else None
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
            live_status = f"Searching all sources right now — {detail}"
        elif ev == "search_done":
            live_status = f"Search finished — {detail}. Starting outreach…"
        elif ev == "market_plan":
            live_status = f"Planning market: {detail}"
        elif ev == "blast_start":
            live_status = "Sending personalised emails to recruiters…"
        elif ev == "email_sent":
            live_status = f"Just sent: {detail}"
        elif ev == "email_failed":
            live_status = f"Last send failed: {detail}"
        elif ev == "bounces_marked":
            live_status = f"Quarantining bounced addresses — {detail}"
        elif ev == "blast_capped":
            live_status = f"Daily cap reached — {detail} emails sent today"
        elif ev == "blast_done":
            live_status = f"Cycle complete — {detail}"
        elif ev == "gdpr_skip":
            live_status = f"Skipping {detail} (GDPR-strict, applying via website only)"
        else:
            live_status = f"{ev}: {detail}"
    elif last_event:
        live_status = (
            f"Last activity {int(age_min)} min ago. "
            f"Next cycle starts automatically on the schedule."
        )

    # ── Filtered activity (drop noise events) ───────────────────────
    activity = [e for e in events_all if (e["event"] or "").lower() not in NOISE_EVENTS][:40]

    # ── Source rows ─────────────────────────────────────────────────
    src_rows = "".join(
        f'<div class="src-row"><span>{_h(r["source"])}</span><strong>{r["n"]:,}</strong></div>'
        for r in sources
    ) or '<div class="muted">No sources yet — run search.</div>'

    # ── Real bounce rows (NDR / 5xx only) ───────────────────────────
    bounce_rows = "".join(
        f'<tr><td class="mono">{_h(_short(r["email"], 40))}</td>'
        f'<td>{_h(_short(r["reason"], 60))}</td>'
        f'<td class="mono">{_h(r["bounce_code"])}</td>'
        f'<td class="mono">{_h((r["bounced_at"] or "")[:19].replace("T", " "))}</td></tr>'
        for r in real_bounces[:25]
    ) or '<tr><td colspan="4" class="muted">No real bounces — your sender reputation is healthy.</td></tr>'

    # ── Recent sends panel (the wins) ───────────────────────────────
    send_cards = ""
    for e in sends:
        recipient = _h(_short(e.get("recipient", ""), 36))
        company   = _h(_short(e.get("company", "") or "", 28))
        subject   = _h(_short(e.get("subject", "") or "", 60))
        followup  = " · follow-up" if int(e.get("followup") or 0) else ""
        when      = _h((e.get("sent_at") or "")[:16].replace("T", " "))
        send_cards += (
            f'<div class="send-card">'
            f'  <div class="send-meta">'
            f'    <span class="badge ok">✓ delivered</span>'
            f'    <span class="send-when">{when}{followup}</span>'
            f'  </div>'
            f'  <div class="send-co">{company}</div>'
            f'  <div class="send-sub">{subject}</div>'
            f'  <div class="send-to mono">to {recipient}</div>'
            f'</div>'
        )
    if not send_cards:
        send_cards = '<div class="muted" style="padding:24px">No outbound sends yet. Run a cycle from JOBYBOT.bat → option 1.</div>'

    # ── Discovery tier summary (diagnostics) ────────────────────────
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
        tier_rows += (
            f'<div class="src-row"><span class="mono">{_h(tier_name)}</span>'
            f'<span><strong>{hits}</strong>/{total} hits ({pct}%)</span></div>'
        )
    if not tier_rows:
        tier_rows = '<div class="muted" style="padding:14px">No discovery attempts yet.</div>'

    discovery_rows = "".join(
        f'<tr><td class="mono">{_h((r["at"] or "")[:19].replace("T", " "))}</td>'
        f'<td>{_h(_short(r["company"], 28))}</td>'
        f'<td><span class="tag">{_h(r["tier"])}</span></td>'
        f'<td class="mono">{_h(_short(r["candidate_email"], 36))}</td>'
        f'<td>{_h(r["decision"])}</td></tr>'
        for r in discovery_recent[:30]
    ) or '<tr><td colspan="5" class="muted">No discovery attempts yet.</td></tr>'

    # ── Activity feed (filtered, customer-facing) ───────────────────
    activity_rows = "".join(
        f'<tr><td class="mono">{_h((r["at"] or "")[:19].replace("T", " "))}</td>'
        f'<td><span class="tag">{_h(r["event"])}</span></td>'
        f'<td>{_h(_short(r["detail"], 80))}</td></tr>'
        for r in activity
    ) or '<tr><td colspan="3" class="muted">Run the bot to populate.</td></tr>'

    # ── Top matched jobs ────────────────────────────────────────────
    job_rows = ""
    for j in jobs[:25]:
        score = int(j.get("match_score", 0))
        bucket = min(99, score // 10 * 10)
        fav = _favicon(j.get("url"))
        fav_img = (
            f'<img src="{_h(fav)}" loading="lazy" alt="" width="18" height="18" '
            f'style="border-radius:4px;vertical-align:middle;margin-right:8px">'
            if fav else ""
        )
        job_rows += (
            f'<tr>'
            f'<td><span class="score s{bucket}">{score}</span></td>'
            f'<td><strong>{_h(_short(j["title"], 60))}</strong></td>'
            f'<td>{fav_img}{_h(_short(j["company"], 28))}</td>'
            f'<td><span class="tag">{_h(j["source"])}</span></td>'
            f'<td><a href="{_h(j["url"])}" target="_blank" rel="noopener">Open →</a></td>'
            f'</tr>'
        )
    if not job_rows:
        job_rows = '<tr><td colspan="5" class="muted">No matched jobs yet — run a cycle.</td></tr>'

    # ── Review queue rows ────────────────────────────────────────────
    queue_cards = ""
    for r in queue_recent:
        recipient = _h(_short(r.get("recipient") or "", 36))
        company   = _h(_short(r.get("company") or "", 28))
        subject   = _h(_short(r.get("subject") or "", 60))
        when      = _h((r.get("created_at") or "")[:16].replace("T", " "))
        queue_cards += (
            f'<div class="send-card" style="background:#FFF8F0;border-color:#FFD7B5">'
            f'  <div class="send-meta">'
            f'    <span class="badge" style="background:#FFE7CC;color:#B45309">⏳ awaiting your click</span>'
            f'    <span class="send-when">{when}</span>'
            f'  </div>'
            f'  <div class="send-co">{company}</div>'
            f'  <div class="send-sub">{subject}</div>'
            f'  <div class="send-to mono">to {recipient}</div>'
            f'</div>'
        )
    if not queue_cards:
        if queue_stats.get("pending", 0) == 0:
            queue_cards = (
                '<div class="muted" style="padding:24px">'
                'Queue is empty. Whenever the bot finds a fresh recruiter '
                'with a verified email, it lands here for your one-click '
                'approval — never auto-sent.'
                '</div>'
            )
        else:
            queue_cards = '<div class="muted" style="padding:24px">No items to preview.</div>'

    # ── Compose HTML ────────────────────────────────────────────────
    body = f"""<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>JobyBots Dashboard</title>
<meta http-equiv="refresh" content="15">
<style>
  *{{box-sizing:border-box}}
  html,body{{margin:0;padding:0}}
  body{{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;background:#F5F5F7;color:#0B0B0B;-webkit-font-smoothing:antialiased;line-height:1.45}}

  /* ── Header ───────────────────────────────────────────────────── */
  header{{background:linear-gradient(135deg,#0B0B0B 0%,#1F1F1F 100%);color:#fff;padding:22px 28px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;border-bottom:1px solid rgba(255,255,255,.08)}}
  header .brand{{display:flex;align-items:center;gap:10px}}
  header .brand .mark{{width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,#FF6B00,#FF8C3A);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:14px;letter-spacing:-.02em}}
  h1{{margin:0;font-size:18px;font-weight:700;letter-spacing:-.01em}}
  .updated{{color:#a8a8a8;font-size:12px;font-family:ui-monospace,Menlo,Consolas,monospace}}

  /* ── Grid + sections ─────────────────────────────────────────── */
  .grid{{display:grid;gap:18px;padding:24px;max-width:1240px;margin:0 auto}}
  @media(max-width:640px){{.grid{{padding:16px}}}}
  .row{{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px}}
  .two{{display:grid;grid-template-columns:1.4fr 1fr;gap:18px}}
  .two-eq{{display:grid;grid-template-columns:1fr 1fr;gap:18px}}
  @media(max-width:960px){{.two,.two-eq{{grid-template-columns:1fr}}}}

  section{{background:#fff;border:1px solid #E8E8E8;border-radius:16px;padding:20px;box-shadow:0 1px 2px rgba(11,11,11,.04)}}
  section h2{{font-size:15px;margin:0 0 14px;font-weight:700;letter-spacing:-.01em;display:flex;align-items:center;gap:8px}}
  section h2 .hint{{margin-left:auto;font-size:11px;font-weight:500;color:#8B8B8B;letter-spacing:0;text-transform:none}}

  /* ── KPIs ────────────────────────────────────────────────────── */
  .kpi{{background:#fff;border:1px solid #E8E8E8;border-radius:14px;padding:18px;box-shadow:0 1px 2px rgba(11,11,11,.04);position:relative;overflow:hidden}}
  .kpi.win{{background:linear-gradient(135deg,#FFF4EB 0%,#FFFFFF 60%);border-color:#FFD7B5}}
  .kpi .label{{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.14em;color:#6B6B6B}}
  .kpi.win .label{{color:#FF6B00}}
  .kpi .value{{font-size:30px;font-weight:800;letter-spacing:-.02em;margin-top:6px;line-height:1.15}}
  .kpi .sub{{color:#8B8B8B;font-size:12px;margin-top:4px}}
  .bar{{height:5px;background:#F0F0F0;border-radius:99px;margin-top:12px;overflow:hidden}}
  .bar > div{{height:100%;background:linear-gradient(90deg,#FF6B00,#FF8C3A);width:{today_pct}%;transition:width .4s}}
  .kpi .delta{{position:absolute;top:14px;right:14px;font-size:11px;font-weight:700;letter-spacing:.04em;padding:3px 8px;border-radius:99px;background:#E8F8EF;color:#067647}}
  .kpi .delta.warn{{background:#FFF7E5;color:#B45309}}
  .kpi .delta.bad{{background:#FEEAEA;color:#B91C1C}}

  /* ── Live banner ─────────────────────────────────────────────── */
  .live{{background:linear-gradient(135deg,#FFF4EB 0%,#FFFFFF 100%);border:1px solid #FFB07A;border-radius:14px;padding:18px 22px;display:flex;align-items:center;gap:14px}}
  .live.idle{{background:#F7F7F7;border-color:#E8E8E8}}
  .live .dot{{width:11px;height:11px;border-radius:50%;background:#10B981;box-shadow:0 0 0 4px rgba(16,185,129,.18);animation:pulse 1.4s infinite;flex-shrink:0}}
  .live.idle .dot{{background:#9CA3AF;box-shadow:0 0 0 4px rgba(156,163,175,.15);animation:none}}
  @keyframes pulse{{0%,100%{{transform:scale(1);opacity:1}}50%{{transform:scale(1.25);opacity:.65}}}}
  .live .label{{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.14em;color:#FF6B00}}
  .live.idle .label{{color:#6B6B6B}}
  .live .msg{{font-size:15px;font-weight:600;margin-top:3px;color:#0B0B0B;line-height:1.4}}

  /* ── Tables ──────────────────────────────────────────────────── */
  table{{width:100%;border-collapse:collapse;font-size:13px}}
  th,td{{text-align:left;padding:10px 8px;border-bottom:1px solid #F0F0F0;vertical-align:middle}}
  tr:last-child td{{border-bottom:none}}
  th{{color:#6B6B6B;font-weight:600;font-size:10px;text-transform:uppercase;letter-spacing:.12em;padding-bottom:8px}}
  .mono{{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12px;color:#555}}
  .muted{{color:#888;text-align:center;padding:24px;font-size:13px}}
  .src-row{{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #F0F0F0;font-size:13px}}
  .src-row:last-child{{border-bottom:none}}
  .tag{{display:inline-block;padding:2px 8px;background:#FFF4EB;color:#FF6B00;border-radius:99px;font-size:10px;font-weight:700;text-transform:lowercase;letter-spacing:.04em}}

  /* ── Match score badges ──────────────────────────────────────── */
  .score{{display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:50%;background:#067647;color:#fff;font-weight:700;font-size:12px;letter-spacing:-.01em}}
  .score.s40,.score.s30,.score.s20,.score.s10,.score.s0{{background:#9CA3AF}}
  .score.s50,.score.s60{{background:#F59E0B;color:#0B0B0B}}
  .score.s70{{background:#10B981}}
  .score.s80,.score.s90,.score.s99{{background:#067647}}

  a{{color:#FF6B00;text-decoration:none;font-weight:600}}
  a:hover{{text-decoration:underline}}

  /* ── Recent sends grid ───────────────────────────────────────── */
  .sends{{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px}}
  .send-card{{background:#F8FCF9;border:1px solid #D5EFE2;border-radius:12px;padding:14px}}
  .send-meta{{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px}}
  .send-when{{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:11px;color:#6B6B6B}}
  .badge{{display:inline-flex;align-items:center;gap:4px;font-size:10px;font-weight:700;padding:3px 8px;border-radius:99px;letter-spacing:.04em}}
  .badge.ok{{background:#E8F8EF;color:#067647}}
  .send-co{{font-weight:700;font-size:14px;color:#0B0B0B;margin-bottom:2px}}
  .send-sub{{font-size:13px;color:#444;line-height:1.4;margin-bottom:6px}}
  .send-to{{font-size:11px;color:#888}}

  /* ── Diagnostics collapsible ─────────────────────────────────── */
  details.diag{{background:#fff;border:1px solid #E8E8E8;border-radius:16px;padding:0;box-shadow:0 1px 2px rgba(11,11,11,.04)}}
  details.diag > summary{{cursor:pointer;list-style:none;padding:18px 22px;font-size:14px;font-weight:700;display:flex;justify-content:space-between;align-items:center}}
  details.diag > summary::-webkit-details-marker{{display:none}}
  details.diag > summary::after{{content:"▾";color:#888;font-size:14px;transition:transform .2s}}
  details.diag[open] > summary::after{{transform:rotate(180deg)}}
  details.diag > .diag-body{{padding:0 22px 22px;display:flex;flex-direction:column;gap:18px}}
  details.diag .sub-section{{padding-top:6px;border-top:1px solid #F0F0F0}}
  details.diag .sub-section h3{{font-size:13px;margin:14px 0 10px;font-weight:700;color:#444}}

  /* ── Quick action buttons ─────────────────────────────────────── */
  .actions{{display:flex;flex-wrap:wrap;gap:10px;margin-top:6px}}
  .btn{{display:inline-flex;align-items:center;gap:6px;padding:9px 16px;border-radius:99px;font-size:13px;font-weight:600;text-decoration:none;border:1px solid #E2E2E2;background:#fff;color:#0B0B0B;transition:all .15s}}
  .btn:hover{{border-color:#0B0B0B;text-decoration:none}}
  .btn.primary{{background:#0B0B0B;color:#fff;border-color:#0B0B0B}}
  .btn.primary:hover{{background:#1F1F1F}}
  .btn.accent{{background:#FF6B00;color:#fff;border-color:#FF6B00}}
  .btn.accent:hover{{background:#E55F00}}

  footer{{text-align:center;padding:32px 16px;color:#8B8B8B;font-size:12px}}
  footer a{{color:#FF6B00}}
</style></head>
<body>
<header>
  <div class="brand">
    <span class="mark">J</span>
    <h1>JobyBots Dashboard</h1>
  </div>
  <span class="updated">Updated {_h(dt.datetime.now().strftime('%Y-%m-%d %H:%M:%S'))} · auto-refresh every 15s</span>
</header>

<div class="grid">

  <!-- Live status banner -->
  <div class="live {('idle' if live_kind == 'idle' else '')}">
    <div class="dot"></div>
    <div>
      <div class="label">{('LIVE — bot is working right now' if live_kind == 'active' else 'BOT STATUS')}</div>
      <div class="msg">{_h(live_status)}</div>
    </div>
  </div>

  <!-- KPI row: results-first ordering -->
  <div class="row">
    <div class="kpi win">
      <div class="label">Awaiting your click</div>
      <div class="value">{queue_stats.get("pending", 0):,}</div>
      <div class="sub">drafts ready to review &amp; send · open <span class="mono">REVIEW_QUEUE.bat</span></div>
    </div>
    <div class="kpi">
      <div class="label">Emails sent today</div>
      <div class="value">{s["emails_today"]:,}<span style="font-size:14px;color:#888;font-weight:500"> / {daily_cap}</span></div>
      <div class="sub">{today_pct}% of daily cap used</div>
      <div class="bar"><div></div></div>
    </div>
    <div class="kpi">
      <div class="label">Deliverability</div>
      <div class="value">{deliverability}%</div>
      <div class="sub">{total_sent:,} sent · {real_bounce_count} bounced</div>
    </div>
    <div class="kpi">
      <div class="label">Jobs found today</div>
      <div class="value">{s["jobs_today"]:,}</div>
      <div class="sub">{s["total_jobs"]:,} all-time</div>
    </div>
    <div class="kpi">
      <div class="label">Total outreach</div>
      <div class="value">{s["total_emails"]:,}</div>
      <div class="sub">Personalised emails sent</div>
    </div>
  </div>

  <!-- Quick actions hint -->
  <section style="padding:14px 22px">
    <div style="display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap">
      <div style="font-size:13px;color:#444">
        <strong>Next steps:</strong>
        Open replies in your <a href="https://mail.google.com" target="_blank">Gmail inbox</a> · Run a fresh cycle from <span class="mono">JOBYBOT.bat</span> · Edit settings via the
        <a href="https://jobybots.com/setup" target="_blank">setup wizard</a>.
      </div>
      <div class="actions">
        <a class="btn" href="https://mail.google.com" target="_blank">📬 Inbox</a>
        <a class="btn primary" href="https://jobybots.com/setup" target="_blank">Edit config</a>
      </div>
    </div>
  </section>

  <!-- Pending review queue (the new manual-send workflow) -->
  <section style="background:linear-gradient(180deg,#FFFCF7 0%,#FFFFFF 100%);border-color:#FFE7CC">
    <h2>
      Pending review queue
      <span class="hint">{queue_stats.get("pending", 0):,} pending · {queue_stats.get("sent_today", 0):,} sent today · {queue_stats.get("skipped_today", 0):,} skipped today</span>
    </h2>
    <div style="display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap;margin:-4px 0 14px">
      <div style="font-size:13px;color:#444;max-width:640px;line-height:1.55">
        The bot <strong>never auto-sends</strong> when <span class="mono">DRAFT_MODE=true</span> (default).
        It writes each ready-to-go email here, attaches your résumé, then waits
        for you to review &amp; click <em>Send</em>. Open the local review UI
        below — it runs entirely on your machine.
      </div>
      <div class="actions">
        <a class="btn accent" href="http://127.0.0.1:7868" target="_blank">Open review UI →</a>
      </div>
    </div>
    <div class="sends">{queue_cards}</div>
  </section>

  <!-- Top matched jobs -->
  <section>
    <h2>Top matched jobs <span class="hint">{len(jobs):,} in your pipeline · top 25 shown</span></h2>
    <table>
      <thead><tr><th>Match</th><th>Title</th><th>Company</th><th>Source</th><th></th></tr></thead>
      <tbody>{job_rows}</tbody>
    </table>
  </section>

  <!-- Recent successful sends -->
  <section>
    <h2>Recent successful sends <span class="hint">last {len(sends)} delivered</span></h2>
    <div class="sends">{send_cards}</div>
  </section>

  <!-- Two-column: sources + activity feed -->
  <div class="two-eq">
    <section>
      <h2>Jobs by source</h2>
      {src_rows}
    </section>
    <section>
      <h2>Recent activity <span class="hint">noise events hidden</span></h2>
      <div style="max-height:360px;overflow-y:auto;margin:-4px -8px">
        <table>
          <thead><tr><th>Time</th><th>Event</th><th>Detail</th></tr></thead>
          <tbody>{activity_rows}</tbody>
        </table>
      </div>
    </section>
  </div>

  <!-- Real bounces only -->
  <section>
    <h2>Real bounces <span class="hint">SMTP-probe rejections excluded · these are the addresses we will never retry</span></h2>
    <table>
      <thead><tr><th>Email</th><th>Reason</th><th>SMTP code</th><th>When</th></tr></thead>
      <tbody>{bounce_rows}</tbody>
    </table>
  </section>

  <!-- Diagnostics (collapsible) -->
  <details class="diag">
    <summary>Diagnostics · email discovery + SMTP-probe internals</summary>
    <div class="diag-body">
      <div class="sub-section">
        <h3>Discovery tier quality (last 7 days)</h3>
        {tier_rows}
      </div>
      <div class="sub-section">
        <h3>Recent discovery attempts</h3>
        <div style="max-height:360px;overflow-y:auto;margin:-4px -8px">
          <table>
            <thead><tr><th>When</th><th>Company</th><th>Tier</th><th>Candidate</th><th>Decision</th></tr></thead>
            <tbody>{discovery_rows}</tbody>
          </table>
        </div>
      </div>
      <div class="sub-section" style="font-size:12px;color:#888;line-height:1.55">
        <strong>What is this?</strong> The email-finder tries 4 tiers in order: cached → company careers page → LinkedIn lookup → known patterns. Failures here are normal — they tell the bot to skip a recruiter we couldn't reach, not that something is broken. They're shown for transparency only and never cause real bounces.
      </div>
    </div>
  </details>

  <footer>
    JobyBots v2.6 · this dashboard is a local HTML file on your computer · no servers see it · refreshes every 15 s.<br>
    <a href="https://jobybots.com/security" target="_blank">How is this safe?</a> · <a href="https://jobybots.com/setup" target="_blank">Edit config</a> · <a href="https://jobybots.com/install" target="_blank">Install help</a>
  </footer>

</div>
</body></html>
"""
    DASHBOARD_HTML.parent.mkdir(parents=True, exist_ok=True)
    DASHBOARD_HTML.write_text(body, encoding="utf-8")
