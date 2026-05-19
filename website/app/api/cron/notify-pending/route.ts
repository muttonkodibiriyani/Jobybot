import { NextRequest, NextResponse } from "next/server";
import { listOrders } from "@/lib/orders";
import { sendMail } from "@/lib/mailer";

export const runtime = "nodejs";

/**
 * Every 30 min: if there are pending orders, email the admin a summary.
 * Vercel Cron triggers this via vercel.json. CRON_SECRET protects it.
 */
export async function GET(req: NextRequest) {
  const expected = process.env.CRON_SECRET;
  const got = req.headers.get("authorization");
  if (expected && got !== `Bearer ${expected}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const pending = await listOrders("pending");
  if (pending.length === 0) {
    return NextResponse.json({ ok: true, pending: 0 });
  }
  const rows = pending
    .slice(0, 25)
    .map(
      (o) =>
        `<tr><td>${o.id}</td><td>${o.name}</td><td>${o.email}</td><td>₹${o.amountInr}</td><td>${o.txnRef}</td><td>${o.createdAt.slice(0, 19).replace("T", " ")}</td></tr>`,
    )
    .join("");
  const adminUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/admin`;
  await sendMail({
    to: process.env.GMAIL_ADDRESS!,
    subject: `[Jobybot] ${pending.length} order(s) awaiting verification`,
    html: `
      <h2>${pending.length} Jobybot order(s) need your verification</h2>
      <p><a href="${adminUrl}">Open admin →</a></p>
      <table cellpadding="6" border="1" cellspacing="0">
        <tr><th>Order</th><th>Name</th><th>Email</th><th>Amount</th><th>Txn ref</th><th>Submitted</th></tr>
        ${rows}
      </table>
    `,
  });
  return NextResponse.json({ ok: true, pending: pending.length });
}
