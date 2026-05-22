/**
 * POST /api/license/move
 *
 * Customer is moving to a new machine. We clear their machine fingerprint
 * so the next bot cycle (on the new laptop) re-binds. Auth required — the
 * customer must be signed in. Move count is bumped so we can spot abuse.
 */
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  CUSTOMER_SESSION_COOKIE,
  verifySession,
} from "@/lib/auth";
import { getCustomerByEmail } from "@/lib/customers";
import { clearBinding, getBinding, saveBinding } from "@/lib/machine-bind";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  const jar = await cookies();
  const raw = jar.get(CUSTOMER_SESSION_COOKIE)?.value;
  const email = verifySession(raw);
  if (!email) {
    return NextResponse.json({ ok: false, error: "not_signed_in" }, { status: 401 });
  }
  const c = await getCustomerByEmail(email);
  if (!c) {
    return NextResponse.json({ ok: false, error: "no_customer" }, { status: 404 });
  }
  if (c.status !== "active") {
    return NextResponse.json(
      { ok: false, error: "not_active", status: c.status },
      { status: 402 }
    );
  }
  const existing = await getBinding(c.email);
  await clearBinding(c.email);
  // Re-seed with an incremented move counter so we keep history when the new
  // machine binds again — saves a round-trip to read-before-write later.
  if (existing) {
    await saveBinding({
      email: c.email,
      fingerprint: "",
      boundAt: new Date().toISOString(),
      moves: existing.moves + 1,
    });
  }
  return NextResponse.json({ ok: true, moves: (existing?.moves ?? 0) + 1 });
}
