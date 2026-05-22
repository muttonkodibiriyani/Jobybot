/**
 * POST /api/license/bind
 * Body: { email, fingerprint }
 *
 * The bot calls this on every cycle (cached for ~24h locally) to:
 *   1. Verify the email belongs to an ACTIVE paying customer.
 *   2. Verify the machine fingerprint matches the registered one for that
 *      email (or register it the first time).
 *
 * Returns 200 + {ok:true} when the bot may run, 409 when blocked. 401 when
 * the email isn't a customer at all.
 *
 * Rate limit: 30 / hour / IP — bot polls at most once per cycle.
 */
import { NextResponse } from "next/server";
import { getCustomerByEmail } from "@/lib/customers";
import { evaluateBind } from "@/lib/machine-bind";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Minimal in-process rate limiter (best-effort; not Anti-DDoS).
const _hits = new Map<string, { count: number; until: number }>();
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 30;
function rateLimit(ip: string): boolean {
  const now = Date.now();
  const cur = _hits.get(ip);
  if (!cur || cur.until < now) {
    _hits.set(ip, { count: 1, until: now + WINDOW_MS });
    return true;
  }
  cur.count += 1;
  return cur.count <= MAX_PER_WINDOW;
}

export async function POST(req: Request) {
  let payload: { email?: unknown; fingerprint?: unknown };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_json" }, { status: 400 });
  }
  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  const fp = typeof payload.fingerprint === "string" ? payload.fingerprint.trim().toLowerCase() : "";
  if (!email || !fp) {
    return NextResponse.json({ ok: false, error: "missing_fields" }, { status: 400 });
  }
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  if (!rateLimit(ip)) {
    return NextResponse.json(
      { ok: false, error: "rate_limited", message: "Too many license checks. Try again later." },
      { status: 429 }
    );
  }

  const customer = await getCustomerByEmail(email);
  if (!customer) {
    return NextResponse.json(
      {
        ok: false,
        status: "no_customer",
        message:
          "No JobyBots account found for this email. Sign up at https://jobybots.com/signup.",
      },
      { status: 401 }
    );
  }
  const active = customer.status === "active";

  const result = await evaluateBind(email, fp, active);
  if (result.decision === "ok") {
    return NextResponse.json({ ok: true, status: result.status });
  }
  // Different fingerprint OR inactive customer.
  const status = active ? 409 : 402;
  return NextResponse.json(
    { ok: false, status: customer.status, message: result.reason },
    { status }
  );
}

export async function GET() {
  return NextResponse.json(
    {
      service: "jobybots-license-bind",
      methods: ["POST"],
      docs: "https://jobybots.com/security#license-binding",
    },
    { status: 200 }
  );
}
