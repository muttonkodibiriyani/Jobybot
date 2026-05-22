/**
 * POST /api/auth/login
 *
 * Body: { identifier, password }  where identifier is email OR phone.
 *
 * Response shapes:
 *   200 { ok: true, email, status }   ← sets jb_customer cookie
 *   401 { ok: false, error: "invalid_credentials" }
 *   403 { ok: false, error: "pending_payment" | "pending_verification" | "rejected" | "refunded", message }
 *   429 { ok: false, error: "rate_limited" }
 */
import { NextRequest, NextResponse } from "next/server";
import { getCustomerByIdentifier } from "@/lib/customers";
import {
  verifyPassword,
  signSession,
  CUSTOMER_SESSION_COOKIE,
  CUSTOMER_SESSION_MAX_AGE_SEC,
} from "@/lib/auth";
import { rateLimit, clientIp, trackSuspicious } from "@/lib/security";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  const rl = rateLimit(`customer:login:${ip}`, 10, 10 * 60 * 1000);
  if (!rl.ok) {
    await trackSuspicious("customer_login_rate_limit", ip, "10 attempts in 10 min", 1, 10);
    return NextResponse.json(
      {
        ok: false,
        error: "rate_limited",
        message: "Too many attempts. Try again in 10 minutes.",
      },
      { status: 429 }
    );
  }

  let body: { identifier?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_json" }, { status: 400 });
  }

  const identifier = (body.identifier ?? "").trim();
  const password = body.password ?? "";
  if (!identifier || !password) {
    return NextResponse.json(
      { ok: false, error: "missing_fields" },
      { status: 400 }
    );
  }

  const customer = await getCustomerByIdentifier(identifier);
  // Don't leak which one was wrong — same error for unknown user vs wrong password.
  if (!customer || !verifyPassword(password, customer.passwordHash)) {
    await trackSuspicious("customer_login_failed", ip, identifier, 5, 10);
    return NextResponse.json(
      { ok: false, error: "invalid_credentials" },
      { status: 401 }
    );
  }

  // Block sign-in if not active yet — but give a helpful message.
  if (customer.status === "pending_payment") {
    return NextResponse.json(
      {
        ok: false,
        error: "pending_payment",
        message:
          "Your account is created but we haven't received your payment yet. Please complete the UPI payment to continue.",
        next: "/buy-india",
      },
      { status: 403 }
    );
  }
  if (customer.status === "pending_verification") {
    return NextResponse.json(
      {
        ok: false,
        error: "pending_verification",
        message:
          "Your payment is being verified. You'll get an email the moment it's approved — usually within 30 minutes.",
      },
      { status: 403 }
    );
  }
  if (customer.status === "rejected") {
    return NextResponse.json(
      {
        ok: false,
        error: "rejected",
        message:
          "Your payment couldn't be verified. Please email tharakesh.iitp@gmail.com — we'll sort it out within an hour.",
      },
      { status: 403 }
    );
  }
  if (customer.status === "refunded") {
    return NextResponse.json(
      {
        ok: false,
        error: "refunded",
        message:
          "This account was refunded. If you'd like to come back, just sign up again.",
      },
      { status: 403 }
    );
  }

  // status === "active" — sign them in.
  const token = signSession(customer.email);
  const res = NextResponse.json({
    ok: true,
    email: customer.email,
    status: customer.status,
  });
  res.cookies.set(CUSTOMER_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: CUSTOMER_SESSION_MAX_AGE_SEC,
  });
  return res;
}
