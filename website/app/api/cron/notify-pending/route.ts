import { NextRequest, NextResponse } from "next/server";
import { listOrders, listRefunds } from "@/lib/orders";
import { sendMail } from "@/lib/mailer";

export const runtime = "nodejs";

/**
 * Every 30 min: email the admin a summary of pending orders AND refunds.
 * Vercel Cron triggers this via vercel.json. CRON_SECRET protects it.
 */
export async function GET(req: NextRequest) {
  const expected = process.env.CRON_SECRET;
  const got = req.headers.get("authorization");
  if (expected && got !== `Bearer ${expected}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const [pending, refundsPending] = await Promise.all([
    listOrders("pending"),
    listRefunds("pending"),
  ]);
  if (pending.length === 0 && refundsPending.length === 0) {
    return NextResponse.json({ ok: true, pending: 0, refunds: 0 });
  }
  const orderRows = pending
    .slice(0, 25)
    .map(
      (o) =>
        `<tr><td>${o.id}</td><td>${o.name}</td><td>${o.email}</td><td>₹${o.amountInr}</td><td>${o.txnRef}</td><td>${o.createdAt.slice(0, 19).replace("T", " ")}</td></tr>`,
    )
    .join("");
  const refundRows = refundsPending
    .slice(0, 25)
    .map(
      (r) =>
        `<tr><td>${r.id}</td><td>${r.orderId}</td><td>${r.email}</td><td>${r.phone}</td><td>${r.createdAt.slice(0, 19).replace("T", " ")}</td></tr>`,
    )
    .join("");
  const adminUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/admin`;
  await sendMail({
    to: process.env.GMAIL_ADDRESS!,
    subject: `[JobyBots] ${pending.length} order(s) + ${refundsPending.length} refund(s) pending`,
    html: `
      <h2>JobyBots — pending queue</h2>
      <p><a href="${adminUrl}" style="background:#FF6B00;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Open admin →</a></p>
      ${pending.length > 0 ? `
        <h3>Orders to verify (${pending.length})</h3>
        <table cellpadding="6" border="1" cellspacing="0">
          <tr><th>Order</th><th>Name</th><th>Email</th><th>Amount</th><th>Txn ref</th><th>Submitted</th></tr>
          ${orderRows}
        </table>
      ` : ""}
      ${refundsPending.length > 0 ? `
        <h3 style="margin-top:28px;color:#B91C1C">Refunds to process (${refundsPending.length})</h3>
        <table cellpadding="6" border="1" cellspacing="0">
          <tr><th>Refund</th><th>Order</th><th>Email</th><th>Phone</th><th>Submitted</th></tr>
          ${refundRows}
        </table>
      ` : ""}
    `,
  });
  return NextResponse.json({
    ok: true,
    pending: pending.length,
    refunds: refundsPending.length,
  });
}
