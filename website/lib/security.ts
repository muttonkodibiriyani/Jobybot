/** Site-wide security helpers: rate limiting + suspicious-activity email alerts. */
import { NextRequest } from "next/server";
import { logSecurityEvent, countSecurityEventsSince } from "./orders";
import { sendMail } from "./mailer";

/** Pull a reasonably-stable client IP. */
export function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for") ?? "";
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "0.0.0.0";
}

/** Naive in-memory rate limit (per server instance). For Vercel + heavy traffic
 *  swap with Upstash @upstash/ratelimit. Good enough for early traffic. */
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { ok: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const cur = buckets.get(key);
  if (!cur || cur.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, resetAt: now + windowMs };
  }
  cur.count++;
  if (cur.count > limit) {
    return { ok: false, remaining: 0, resetAt: cur.resetAt };
  }
  return { ok: true, remaining: limit - cur.count, resetAt: cur.resetAt };
}

/** Logs an event AND emails the owner when thresholds are breached. */
export async function trackSuspicious(
  event: string,
  ip: string,
  detail: string,
  alertThreshold = 5,
  windowMinutes = 10,
): Promise<void> {
  await logSecurityEvent(event, ip, detail);
  try {
    const since = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();
    const n = await countSecurityEventsSince(event, ip, since);
    if (n >= alertThreshold) {
      const to = process.env.GMAIL_ADDRESS;
      if (!to) return;
      await sendMail({
        to,
        subject: `[JobyBots SECURITY] ${event} × ${n} from ${ip} (last ${windowMinutes} min)`,
        html: `
          <h2 style="color:#B91C1C">Suspicious activity detected on jobybots.com</h2>
          <table cellpadding="6" style="font-family:system-ui;font-size:14px">
            <tr><td><b>Event</b></td><td>${escapeHtml(event)}</td></tr>
            <tr><td><b>IP</b></td><td>${escapeHtml(ip)}</td></tr>
            <tr><td><b>Hits (last ${windowMinutes} min)</b></td><td>${n}</td></tr>
            <tr><td><b>Latest detail</b></td><td>${escapeHtml(detail)}</td></tr>
            <tr><td><b>At</b></td><td>${new Date().toISOString()}</td></tr>
          </table>
          <p style="margin-top:20px;color:#666">If this wasn't you,
            <b>rotate ADMIN_PASSWORD immediately</b> and inspect /admin → events.
          </p>
        `,
      });
    }
  } catch (e) {
    console.error("trackSuspicious alert failed:", e);
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c]!));
}
