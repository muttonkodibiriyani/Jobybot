/**
 * GET /api/license/demo?email=foo@bar.com
 *
 * Returns a valid license key for the given email. ONLY enabled when
 * ALLOW_DEMO_LICENSE_KEYS=1 in env. Used for screenshots, demos, and
 * customer-support resets.
 *
 * Real customers receive their key by email after Razorpay/Stripe webhook
 * fires the same generateLicenseKey() function server-side.
 */
import { NextResponse } from "next/server";
import { generateLicenseKey } from "@/lib/license";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const allow = process.env.ALLOW_DEMO_LICENSE_KEYS === "1";
  if (!allow) {
    return NextResponse.json(
      {
        ok: false,
        error: "disabled",
        hint: "Demo key generation is off. Real keys are emailed after purchase.",
      },
      { status: 403 }
    );
  }
  const url = new URL(req.url);
  const email = (url.searchParams.get("email") || "").trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { ok: false, error: "bad_email" },
      { status: 400 }
    );
  }
  return NextResponse.json({ ok: true, email, key: generateLicenseKey(email) });
}
