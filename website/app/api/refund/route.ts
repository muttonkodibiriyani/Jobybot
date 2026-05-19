import { NextRequest, NextResponse } from "next/server";
import { newRefundId, saveRefund, getOrder, updateOrderStatus } from "@/lib/orders";
import { sendMail } from "@/lib/mailer";
import { rateLimit, clientIp, trackSuspicious } from "@/lib/security";
import { SUPPORT } from "@/lib/config";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  const rl = rateLimit(`refund:${ip}`, 4, 60 * 60 * 1000); // 4 / hour / IP
  if (!rl.ok) {
    await trackSuspicious("refund_rate_limit", ip, "too many requests");
    return NextResponse.json(
      { ok: false, error: "Too many refund requests. Email support instead." },
      { status: 429 },
    );
  }

  const body = (await req.json()) as Record<string, string>;
  const orderId = (body.orderId ?? "").trim().toUpperCase();
  const email = (body.email ?? "").trim().toLowerCase();
  const phone = (body.phone ?? "").trim();
  const reason = (body.reason ?? "").trim();

  if (!orderId || !email || !reason || reason.length < 10) {
    return NextResponse.json(
      { ok: false, error: "Order ID, email, and a reason (10+ chars) are required." },
      { status: 400 },
    );
  }
  if (!/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: "Invalid email." }, { status: 400 });
  }

  const order = await getOrder(orderId);
  if (!order) {
    await trackSuspicious("refund_unknown_order", ip, `id=${orderId} email=${email}`);
    return NextResponse.json(
      { ok: false, error: "Order ID not found. Please email support if you've lost it." },
      { status: 404 },
    );
  }
  if (order.email.toLowerCase() !== email.toLowerCase()) {
    await trackSuspicious("refund_email_mismatch", ip, `id=${orderId} sent=${email} actual=${order.email}`);
    return NextResponse.json(
      { ok: false, error: "Email doesn't match the order on file." },
      { status: 403 },
    );
  }

  // Enforce 7-day window
  const days = (Date.now() - new Date(order.createdAt).getTime()) / 86400000;
  if (days > SUPPORT.refundDays) {
    return NextResponse.json(
      {
        ok: false,
        error: `Refund window of ${SUPPORT.refundDays} days has passed. Please email ${SUPPORT.email} — we still review fair-use cases.`,
      },
      { status: 400 },
    );
  }

  const refundId = newRefundId();
  await saveRefund({
    id: refundId,
    orderId,
    email,
    phone,
    reason,
    status: "pending",
    createdAt: new Date().toISOString(),
  });
  await updateOrderStatus(orderId, "refund_requested", "Refund requested by user");

  // Email the owner immediately
  try {
    await sendMail({
      to: process.env.GMAIL_ADDRESS!,
      subject: `[JobyBots] Refund request ${refundId} (order ${orderId})`,
      html: `
        <h2>Refund requested</h2>
        <table cellpadding="6">
          <tr><td><b>Refund ID</b></td><td>${refundId}</td></tr>
          <tr><td><b>Order ID</b></td><td>${orderId}</td></tr>
          <tr><td><b>Email</b></td><td>${email}</td></tr>
          <tr><td><b>Phone</b></td><td>${phone}</td></tr>
          <tr><td><b>Reason</b></td><td>${escapeHtml(reason)}</td></tr>
          <tr><td><b>Days since order</b></td><td>${days.toFixed(1)}</td></tr>
        </table>
        <p style="margin-top:16px"><a href="${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/admin" style="background:#FF6B00;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">Open admin → process refund</a></p>
      `,
    });
  } catch (e) {
    console.error("refund admin notify failed:", e);
  }

  // Customer acknowledgement
  try {
    await sendMail({
      to: email,
      subject: `Refund request received — ${refundId}`,
      html: `
        <h2 style="font-family:system-ui">Hi, your refund request is in queue.</h2>
        <p>We&apos;ve received your refund request for order <strong>${orderId}</strong>.</p>
        <p>Reference: <strong>${refundId}</strong></p>
        <ul>
          <li>We acknowledge within <strong>${SUPPORT.verificationWindow}</strong> (this email).</li>
          <li>We process the refund within <strong>5 business days</strong>.</li>
          <li>Funds return to the same UPI / card that paid.</li>
        </ul>
        <p>Questions? Reply to this email or call <a href="tel:${SUPPORT.phone.replace(/\s/g, "")}">${SUPPORT.phone}</a>.</p>
        <p style="color:#888;font-size:12px;margin-top:32px">— JobyBots team</p>
      `,
    });
  } catch (e) {
    console.error("refund customer ack failed:", e);
  }

  return NextResponse.json({ ok: true, refundId });
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
