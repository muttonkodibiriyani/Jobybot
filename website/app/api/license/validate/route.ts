/**
 * POST /api/license/validate
 *
 * Body: { email: string, key: string }
 *
 * Validates the license key (HMAC-derived from email + LICENSE_SECRET) and,
 * on success, sets the jb_session cookie so /portal works.
 *
 * Response shapes:
 *   200  { ok: true, email }
 *   400  { ok: false, error: "missing_fields" | "bad_format" }
 *   401  { ok: false, error: "invalid_key" }
 */
import { NextResponse } from "next/server";
import {
  validateLicenseKey,
  looksLikeLicenseKey,
  signSession,
  SESSION_COOKIE,
  SESSION_MAX_AGE_SEC,
} from "@/lib/license";

export const runtime = "nodejs"; // we need node:crypto

export async function POST(req: Request) {
  let body: { email?: string; key?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "bad_format" },
      { status: 400 }
    );
  }

  const email = (body.email || "").trim().toLowerCase();
  const key = (body.key || "").trim().toUpperCase();

  if (!email || !key) {
    return NextResponse.json(
      { ok: false, error: "missing_fields" },
      { status: 400 }
    );
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { ok: false, error: "bad_format", field: "email" },
      { status: 400 }
    );
  }
  if (!looksLikeLicenseKey(key)) {
    return NextResponse.json(
      { ok: false, error: "bad_format", field: "key" },
      { status: 400 }
    );
  }
  if (!validateLicenseKey(email, key)) {
    return NextResponse.json(
      { ok: false, error: "invalid_key" },
      { status: 401 }
    );
  }

  const token = signSession(email);
  const res = NextResponse.json({ ok: true, email });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SEC,
  });
  return res;
}

/**
 * DELETE /api/license/validate  → log out (clears session cookie)
 */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}
