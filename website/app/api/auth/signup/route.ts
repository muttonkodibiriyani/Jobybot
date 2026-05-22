/**
 * POST /api/auth/signup
 *
 * Creates a customer account in status="pending_payment" so they can be
 * redirected to /buy-india. The actual order record is created when they
 * submit the payment screenshot (already handled by /api/india-order).
 *
 * Body: { name, email, phone, password }
 * Response 200: { ok: true, email }   ← also sets jb_customer cookie
 * Response 4xx:  { ok: false, error: "<machine code>", field?: "..." }
 */
import { NextResponse } from "next/server";
import {
  getCustomerByEmail,
  getCustomerByPhone,
  saveCustomer,
  normEmail,
  normPhone,
} from "@/lib/customers";
import {
  hashPassword,
  passwordStrength,
  isValidEmail,
  isValidPhone,
  signSession,
  CUSTOMER_SESSION_COOKIE,
  CUSTOMER_SESSION_MAX_AGE_SEC,
} from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: { name?: string; email?: string; phone?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_json" }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  const email = normEmail(body.email ?? "");
  const phone = normPhone(body.phone ?? "");
  const password = body.password ?? "";

  if (!name) {
    return NextResponse.json(
      { ok: false, error: "missing", field: "name" },
      { status: 400 }
    );
  }
  if (!isValidEmail(email)) {
    return NextResponse.json(
      { ok: false, error: "invalid_email", field: "email" },
      { status: 400 }
    );
  }
  if (!isValidPhone(phone)) {
    return NextResponse.json(
      { ok: false, error: "invalid_phone", field: "phone" },
      { status: 400 }
    );
  }
  const strength = passwordStrength(password);
  if (!strength.ok) {
    return NextResponse.json(
      { ok: false, error: "weak_password", field: "password", hint: strength.hint },
      { status: 400 }
    );
  }

  // Uniqueness checks (email is primary, phone is secondary)
  const byEmail = await getCustomerByEmail(email);
  if (byEmail) {
    return NextResponse.json(
      { ok: false, error: "email_exists", field: "email" },
      { status: 409 }
    );
  }
  const byPhone = await getCustomerByPhone(phone);
  if (byPhone) {
    return NextResponse.json(
      { ok: false, error: "phone_exists", field: "phone" },
      { status: 409 }
    );
  }

  const passwordHash = hashPassword(password);
  await saveCustomer({
    name,
    email,
    phone,
    passwordHash,
    status: "pending_payment",
    createdAt: new Date().toISOString(),
  });

  // Auto-sign-in (limited cookie) so /buy-india can prefill + bind the order.
  // The portal itself will still check status==="active" before allowing config.
  const token = signSession(email);
  const res = NextResponse.json({ ok: true, email });
  res.cookies.set(CUSTOMER_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: CUSTOMER_SESSION_MAX_AGE_SEC,
  });
  return res;
}
