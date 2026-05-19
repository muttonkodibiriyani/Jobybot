import { NextRequest, NextResponse } from "next/server";
import { saveOrder, newOrderId } from "@/lib/orders";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    name?: string;
    email?: string;
    phone?: string;
    consent?: string;
  };
  const name = (body.name ?? "").trim();
  const email = (body.email ?? "").trim().toLowerCase();
  const phone = (body.phone ?? "").trim();

  if (!name || !email || !phone) {
    return NextResponse.json({ ok: false, error: "Missing fields" }, { status: 400 });
  }
  if (!/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: "Invalid email" }, { status: 400 });
  }
  // Create a draft order; user completes payment + screenshot on /buy-india.
  // (Keeps a single orders table — signup and payment merge into one record.)
  const id = newOrderId();
  await saveOrder({
    id,
    name,
    email,
    phone,
    amountInr: Number(process.env.NEXT_PUBLIC_INR_PRICE ?? 2999),
    txnRef: "",
    txnTime: "",
    status: "pending",
    createdAt: new Date().toISOString(),
    notes: "signup-only (no payment yet)",
  });
  return NextResponse.json({ ok: true, id });
}
