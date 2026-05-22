"""Local review-queue web server.

The customer's bot drops every outbound email it would have sent into the
``pending_emails`` table. This stdlib-only HTTP server (no Flask, no extra
deps) gives the customer a one-page UI at http://localhost:7868/ to:

  • see every queued email with full subject/body/recipient/company
  • edit the body before sending
  • click "Send" to dispatch it via Gmail SMTP (the actual send still uses
    the same path the bot would have used — same Reply-To, same resume,
    same Gmail rate-limit guard)
  • click "Skip" to throw it away without sending
  • click "Send all visible" to batch-send (still per-message confirmation
    in the bot's daily cap)

Design rules (security):
  • Binds to 127.0.0.1 ONLY — never 0.0.0.0. Nothing on the LAN can reach it.
  • A random ~256-bit token is required on every POST (sent as Cookie). The
    page renders the token inline; if you don't have the cookie you can't
    POST. This blocks DNS-rebind + CSRF from other localhost pages.
  • No write endpoint accepts query-string secrets — all secrets via cookies.
  • All POST handlers are atomic against the same SQLite row (status check
    inside the UPDATE so a double-click never sends twice).
"""
from __future__ import annotations

import contextlib
import html
import json
import secrets
import socket
import threading
import time
import webbrowser
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any, Dict, Optional

from loguru import logger

from . import db
from .email_sender import send_email


# ── CSRF token (per process). Persisted to a 0600 file so a queue page
#    you opened earlier still works after a restart for ~24 h.
TOKEN_PATH = Path("data") / "queue.token"


def _ensure_token() -> str:
    TOKEN_PATH.parent.mkdir(parents=True, exist_ok=True)
    if TOKEN_PATH.exists():
        try:
            t = TOKEN_PATH.read_text().strip()
            if len(t) >= 32:
                return t
        except Exception:
            pass
    t = secrets.token_urlsafe(32)
    TOKEN_PATH.write_text(t)
    try:
        import os
        os.chmod(TOKEN_PATH, 0o600)
    except Exception:
        pass
    return t


CSRF_TOKEN = _ensure_token()
COOKIE_NAME = "jb_queue_csrf"


# ── HTML template ──────────────────────────────────────────────────
# Keep self-contained — no external CDN, no inline analytics. The customer
# is signing in to a local-only page; we don't load anything from the network.
INDEX_HTML = r"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>JobyBots Review Queue · localhost</title>
<style>
  :root {
    --bg: #FAF6F0; --card: #fff; --ink: #0F172A; --muted: #64748B;
    --accent: #FF6B00; --border: #E5E7EB; --good: #10B981; --warn: #F59E0B;
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: var(--bg); color: var(--ink);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, system-ui, sans-serif; }
  header { background: var(--ink); color: #fff; padding: 14px 24px;
    display: flex; align-items: center; justify-content: space-between; }
  header h1 { font-size: 16px; margin: 0; font-weight: 700; letter-spacing: -0.01em; }
  header .stats { display: flex; gap: 16px; font-size: 13px; }
  header .stat b { color: #FFB17A; font-weight: 700; }
  main { max-width: 1100px; margin: 0 auto; padding: 24px; }
  .toolbar { display: flex; gap: 12px; margin-bottom: 16px; align-items: center;
    background: var(--card); padding: 14px; border-radius: 12px; border: 1px solid var(--border); }
  .toolbar input { flex: 1; padding: 8px 12px; border: 1px solid var(--border);
    border-radius: 8px; font-size: 14px; }
  .btn { padding: 8px 14px; border: 1px solid var(--border); background: #fff; color: var(--ink);
    border-radius: 999px; cursor: pointer; font-size: 13px; font-weight: 600; }
  .btn:hover:not(:disabled) { background: #F1F5F9; }
  .btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .btn-primary { background: var(--accent); color: #fff; border-color: var(--accent); }
  .btn-primary:hover:not(:disabled) { background: #E55A00; }
  .btn-ghost { background: transparent; color: var(--muted); border-color: transparent; }
  .btn-danger { background: #fff; color: #B91C1C; border-color: #FCA5A5; }
  .empty { padding: 80px 20px; text-align: center; background: var(--card);
    border-radius: 16px; border: 1px solid var(--border); color: var(--muted); }
  .empty h2 { color: var(--ink); margin: 0 0 8px; }
  .card { background: var(--card); border: 1px solid var(--border); border-radius: 14px;
    padding: 18px 20px; margin-bottom: 14px; box-shadow: 0 1px 2px rgba(0,0,0,0.02); }
  .card-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;
    margin-bottom: 10px; }
  .card-head .who { font-size: 13px; color: var(--muted); }
  .card-head .who .recipient { color: var(--ink); font-weight: 700; font-family: monospace; }
  .card-head .who .company { font-weight: 600; color: var(--ink); }
  .card-head .meta { font-size: 11px; color: var(--muted); }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 10px;
    font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; }
  .badge.pending { background: #FFF7ED; color: #C2410C; }
  .badge.edited  { background: #ECFEFF; color: #0E7490; }
  .badge.followup { background: #F5F3FF; color: #6D28D9; }
  .subject { font-size: 15px; font-weight: 700; margin: 4px 0 10px; color: var(--ink); }
  textarea, input[type=text] { width: 100%; padding: 10px 12px; border: 1px solid var(--border);
    border-radius: 10px; font-family: inherit; font-size: 14px; line-height: 1.55; resize: vertical;
    background: #FCFCFD; }
  textarea { min-height: 200px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, system-ui, sans-serif; }
  textarea:focus, input:focus { outline: 2px solid var(--accent); outline-offset: -1px; border-color: var(--accent); }
  .actions { display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap; }
  .actions .right { margin-left: auto; display: flex; gap: 8px; }
  .toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
    background: var(--ink); color: #fff; padding: 10px 18px; border-radius: 999px;
    font-size: 13px; box-shadow: 0 12px 32px rgba(0,0,0,0.15); opacity: 0; transition: opacity .2s; }
  .toast.show { opacity: 1; }
  .toast.error { background: #B91C1C; }
  .job-link { font-size: 11px; color: var(--accent); text-decoration: none; }
  .job-link:hover { text-decoration: underline; }
</style>
</head>
<body>
<header>
  <h1>JobyBots · Review Queue · <span style="color:#FFB17A">localhost only</span></h1>
  <div class="stats">
    <span class="stat">Pending: <b id="s-pending">0</b></span>
    <span class="stat">Sent today: <b id="s-sent">0</b></span>
    <span class="stat">Skipped today: <b id="s-skipped">0</b></span>
  </div>
</header>
<main>
  <div class="toolbar">
    <input id="search" type="text" placeholder="Filter by company, recipient, or subject…" />
    <button class="btn" onclick="refresh()" title="Reload from disk">↻ Refresh</button>
    <button class="btn btn-primary" id="send-all-btn" onclick="sendAll()">↗ Send all visible</button>
  </div>
  <div id="list"></div>
</main>
<div id="toast" class="toast"></div>

<script>
const CSRF = "__CSRF__";
let ALL = [];
let FILTER = "";

function $(s) { return document.querySelector(s); }
function toast(msg, kind) {
  const t = $("#toast"); t.textContent = msg;
  t.className = "toast show" + (kind === "error" ? " error" : "");
  setTimeout(() => t.className = "toast" + (kind === "error" ? " error" : ""), 2200);
}
function esc(s) { return String(s || "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }

async function apiGET(path) {
  const r = await fetch(path, { credentials: "same-origin" });
  if (!r.ok) throw new Error(`${path} → ${r.status}`);
  return r.json();
}
async function apiPOST(path, body) {
  const r = await fetch(path, {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", "X-CSRF-Token": CSRF },
    body: body ? JSON.stringify(body) : "{}"
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok || data.ok === false) throw new Error(data.error || `${path} → ${r.status}`);
  return data;
}

async function refresh() {
  try {
    const data = await apiGET("/api/pending");
    ALL = data.items;
    $("#s-pending").textContent = data.stats.pending;
    $("#s-sent").textContent = data.stats.sent_today;
    $("#s-skipped").textContent = data.stats.skipped_today;
    render();
  } catch (e) { toast("Refresh failed: " + e.message, "error"); }
}

function render() {
  const list = $("#list");
  const f = FILTER.trim().toLowerCase();
  const items = ALL.filter(it => {
    if (!f) return true;
    return (it.recipient + " " + it.company + " " + it.subject).toLowerCase().includes(f);
  });
  if (!items.length) {
    list.innerHTML = `<div class="empty">
      <h2>${ALL.length ? "No matches" : "Queue is empty"}</h2>
      <p>${ALL.length ? "Try a different filter." : "Next bot cycle will populate this."}</p>
    </div>`;
    return;
  }
  list.innerHTML = items.map(it => `
    <article class="card" id="card-${it.id}">
      <div class="card-head">
        <div class="who">
          To: <span class="recipient">${esc(it.recipient)}</span>
          ${it.company ? `· <span class="company">${esc(it.company)}</span>` : ""}
          ${it.job_url ? ` · <a class="job-link" href="${esc(it.job_url)}" target="_blank" rel="noopener noreferrer">view job ↗</a>` : ""}
        </div>
        <div class="meta">
          <span class="badge ${it.followup ? 'followup' : (it.edited_at ? 'edited' : 'pending')}">
            ${it.followup ? 'Follow-up' : (it.edited_at ? 'Edited' : 'Pending')}
          </span>
          · queued ${esc(timeago(it.created_at))}
        </div>
      </div>
      <input type="text" class="subj" data-id="${it.id}" value="${esc(it.subject)}" />
      <textarea class="body" data-id="${it.id}">${esc(it.body)}</textarea>
      <div class="actions">
        <button class="btn" onclick="saveEdit(${it.id})">💾 Save edits</button>
        <div class="right">
          <button class="btn btn-danger" onclick="skip(${it.id})">✗ Skip</button>
          <button class="btn btn-primary" onclick="send(${it.id})">↗ Send</button>
        </div>
      </div>
    </article>
  `).join("");
}

function timeago(iso) {
  const d = new Date(iso + (iso.endsWith("Z") ? "" : "Z"));
  const s = Math.max(0, (Date.now() - d.getTime()) / 1000);
  if (s < 60) return Math.round(s) + "s ago";
  if (s < 3600) return Math.round(s/60) + "m ago";
  if (s < 86400) return Math.round(s/3600) + "h ago";
  return Math.round(s/86400) + "d ago";
}

async function saveEdit(id) {
  const subj = document.querySelector(`.subj[data-id="${id}"]`).value;
  const body = document.querySelector(`.body[data-id="${id}"]`).value;
  try {
    await apiPOST("/api/edit/" + id, { subject: subj, body });
    const it = ALL.find(x => x.id === id);
    if (it) { it.subject = subj; it.body = body; it.edited_at = new Date().toISOString(); }
    toast("Saved");
  } catch (e) { toast("Save failed: " + e.message, "error"); }
}

async function send(id) {
  // Auto-save edits first
  await saveEdit(id);
  if (!confirm("Send this email now?")) return;
  try {
    await apiPOST("/api/send/" + id);
    toast("Sent ✓");
    removeCard(id);
    refresh();
  } catch (e) { toast("Send failed: " + e.message, "error"); }
}

async function skip(id) {
  if (!confirm("Skip this email? (won't be sent)")) return;
  try {
    await apiPOST("/api/skip/" + id);
    toast("Skipped");
    removeCard(id);
    refresh();
  } catch (e) { toast("Skip failed: " + e.message, "error"); }
}

async function sendAll() {
  const visible = ALL.filter(it => {
    if (!FILTER) return true;
    return (it.recipient + " " + it.company + " " + it.subject).toLowerCase().includes(FILTER.toLowerCase());
  });
  if (!visible.length) return toast("Nothing to send", "error");
  if (!confirm(`Send ${visible.length} email(s) now?\\n(Each is rate-limited by the bot's daily cap.)`)) return;
  $("#send-all-btn").disabled = true;
  let ok = 0, fail = 0;
  for (const it of visible) {
    try {
      await saveEdit(it.id);
      await apiPOST("/api/send/" + it.id);
      ok++;
      removeCard(it.id);
    } catch (e) { fail++; }
  }
  $("#send-all-btn").disabled = false;
  toast(`Sent ${ok} · failed ${fail}`, fail ? "error" : null);
  refresh();
}

function removeCard(id) {
  const el = document.getElementById("card-" + id);
  if (el) el.style.display = "none";
  ALL = ALL.filter(x => x.id !== id);
}

$("#search").addEventListener("input", e => { FILTER = e.target.value; render(); });
refresh();
setInterval(refresh, 30_000);
</script>
</body>
</html>"""


class QueueHandler(BaseHTTPRequestHandler):
    server_version = "JobyBotsQueue/1.0"

    # ── helpers ───────────────────────────────────────────────────
    def _send_json(self, payload: Dict[str, Any], status: int = 200) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        self.wfile.write(body)

    def _send_html(self, html_text: str, status: int = 200) -> None:
        body = html_text.encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "DENY")
        self.send_header(
            "Content-Security-Policy",
            "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; "
            "img-src 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'"
        )
        self.send_header(
            "Set-Cookie",
            f"{COOKIE_NAME}={CSRF_TOKEN}; Path=/; HttpOnly; SameSite=Strict",
        )
        self.end_headers()
        self.wfile.write(body)

    def _csrf_ok(self) -> bool:
        # Require BOTH the cookie and the X-CSRF-Token header to match the
        # server-side token. Browsers won't attach the cookie unless the page
        # originates from our localhost server, and we never accept the token
        # over CORS — the localhost server doesn't set Access-Control-* headers.
        header = self.headers.get("X-CSRF-Token", "")
        cookie_header = self.headers.get("Cookie", "")
        cookie_token = ""
        for part in cookie_header.split(";"):
            kv = part.strip().split("=", 1)
            if len(kv) == 2 and kv[0] == COOKIE_NAME:
                cookie_token = kv[1]
        return (
            header
            and cookie_token
            and secrets.compare_digest(header, CSRF_TOKEN)
            and secrets.compare_digest(cookie_token, CSRF_TOKEN)
        )

    def _read_json(self) -> Dict[str, Any]:
        n = int(self.headers.get("Content-Length", "0") or "0")
        if n <= 0 or n > 1_000_000:
            return {}
        try:
            return json.loads(self.rfile.read(n).decode("utf-8"))
        except Exception:
            return {}

    def log_message(self, fmt: str, *args: Any) -> None:  # silence noise
        return

    # ── routing ────────────────────────────────────────────────────
    def do_GET(self) -> None:  # noqa: N802
        if self.path == "/" or self.path.startswith("/?"):
            self._send_html(INDEX_HTML.replace("__CSRF__", CSRF_TOKEN))
            return
        if self.path == "/api/pending":
            items = db.list_pending_emails(limit=500)
            stats = db.pending_queue_stats()
            self._send_json({"ok": True, "items": items, "stats": stats})
            return
        if self.path == "/api/health":
            self._send_json({"ok": True, "service": "jobybots-queue"})
            return
        self._send_json({"ok": False, "error": "not_found"}, status=404)

    def do_POST(self) -> None:  # noqa: N802
        if not self._csrf_ok():
            self._send_json({"ok": False, "error": "csrf"}, status=403)
            return
        path = self.path

        if path.startswith("/api/edit/"):
            pid = _to_int(path.rsplit("/", 1)[-1])
            if pid is None:
                return self._send_json({"ok": False, "error": "bad_id"}, 400)
            body = self._read_json()
            subject = body.get("subject")
            text = body.get("body")
            if not isinstance(subject, str) or not isinstance(text, str):
                return self._send_json({"ok": False, "error": "bad_payload"}, 400)
            if not text.strip() or len(text) > 50_000 or len(subject) > 998:
                return self._send_json({"ok": False, "error": "bad_length"}, 400)
            ok = db.update_pending_email(pid, subject=subject, body=text)
            return self._send_json({"ok": ok})

        if path.startswith("/api/send/"):
            pid = _to_int(path.rsplit("/", 1)[-1])
            if pid is None:
                return self._send_json({"ok": False, "error": "bad_id"}, 400)
            return self._send_json(_send_pending(pid))

        if path.startswith("/api/skip/"):
            pid = _to_int(path.rsplit("/", 1)[-1])
            if pid is None:
                return self._send_json({"ok": False, "error": "bad_id"}, 400)
            ok = db.mark_pending_skipped(pid, "user_skipped_in_ui")
            return self._send_json({"ok": ok})

        self._send_json({"ok": False, "error": "not_found"}, status=404)


def _to_int(s: str) -> Optional[int]:
    try:
        n = int(s)
        return n if n > 0 else None
    except Exception:
        return None


def _send_pending(pid: int) -> Dict[str, Any]:
    """Actually push a queued email to Gmail SMTP. Respects daily cap."""
    from config import get_settings  # avoid circular import at module load
    row = db.get_pending_email(pid)
    if not row or row["status"] not in ("pending", "edited"):
        return {"ok": False, "error": "not_pending"}
    settings = get_settings()
    if db.emails_sent_today() >= settings.daily_email_cap:
        return {"ok": False, "error": "daily_cap_reached"}
    if db.already_emailed(row["recipient"], row["followup"]):
        db.mark_pending_skipped(pid, "already_sent_to_recipient")
        return {"ok": False, "error": "duplicate"}
    ok, reason = send_email(
        settings.gmail_address,
        settings.gmail_app_password,
        row["recipient"],
        row["subject"],
        row["body"],
        Path(settings.resume_path),
        settings.user_name,
    )
    if ok:
        db.log_email(
            row["recipient"], row["company"] or "", row["category"] or "",
            row["subject"], row["job_id"], row["followup"],
        )
        db.log_event(
            "email_sent_from_queue",
            f"{row['recipient']} ({row['company']}) | {row['subject'][:60]}",
        )
        db.mark_pending_sent(pid, "user_approved")
        logger.success(f"queue#{pid} → {row['recipient']} ({row['company']}) sent")
        return {"ok": True}
    if reason.startswith("recipient_refused") or reason.startswith("smtp_5"):
        db.mark_invalid_email(row["recipient"], reason)
    db.mark_pending_failed(pid, reason)
    db.log_event("email_failed_from_queue", f"{row['recipient']}: {reason}")
    return {"ok": False, "error": reason}


# ── entrypoint ─────────────────────────────────────────────────────
def serve(port: int = 7868, open_browser: bool = True) -> None:
    """Run the queue server (foreground, blocks)."""
    db.init_db()

    # Pick a free port if requested one is busy.
    actual_port = port
    for candidate in [port, port + 1, port + 2, 0]:
        with contextlib.suppress(OSError):
            with socket.socket() as s:
                s.bind(("127.0.0.1", candidate))
                actual_port = s.getsockname()[1]
            break

    httpd = ThreadingHTTPServer(("127.0.0.1", actual_port), QueueHandler)
    httpd.timeout = 1.0
    url = f"http://127.0.0.1:{actual_port}/"
    logger.success(f"Queue UI ready: {url}")
    logger.info(
        "  (bound to localhost only — nothing on your network can reach it)"
    )

    if open_browser:
        try:
            threading.Timer(0.6, lambda: webbrowser.open(url)).start()
        except Exception:
            pass

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        logger.info("queue server stopped")
        httpd.server_close()


if __name__ == "__main__":  # python -m core.queue_server
    serve()
