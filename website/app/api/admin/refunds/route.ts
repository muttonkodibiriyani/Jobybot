import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { updateRefundStatus, updateOrderStatus, listRefunds } from "@/lib/orders";
import { sendMail } from "@/lib/mailer";
import { SUPPORT } from "@/lib/config";

export const runtime = "nodejs";

async function requireAdmin() {
  const c = await cookies();
  const session = c.get("jb_admin")?.value;
  return !!session && session === process.env.ADMIN_PASSWORD;
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const { id, action, notes } = (await req.json()) as {
    id?: string;
    action?: "refund" | "reject";
    notes?: string;
  };
  if (!id || !action) {
    return NextResponse.json({ ok: false, error: "Missing id/action" }, { status: 400 });
  }

  const updated = await updateRefundStatus(
    id,
    action === "refund" ? "refunded" : "rejected",
    notes ?? "",
  );
  if (!updated) {
    return NextResponse.json({ ok: false, error: "Refund not found" }, { status: 404 });
  }
  if (action === "refund") {
    await updateOrderStatus(updated.orderId, "refunded", "Refund processed");
    try {
      await sendMail({
        to: updated.email,
        subject: `Refund processed — ${id}`,
        html: `
          <h2 style="font-family:system-ui">Refund complete.</h2>
          <p>Your refund for order <strong>${updated.orderId}</strong> has been processed.</p>
          <p>Funds usually appear in your UPI / card within <strong>1–5 business days</strong>
            depending on your bank.</p>
          <p>If you don't see the credit by then, reply to this email or call
            <a href="tel:${SUPPORT.phone.replace(/\s/g, "")}">${SUPPORT.phone}</a>.</p>
          <p style="color:#888;font-size:12px;margin-top:32px">— JobyBots team</p>
        `,
      });
    } catch (e) {
      console.error("refund completion mail failed", e);
    }
  } else {
    try {
      await sendMail({
        to: updated.email,
        subject: `Update on your refund request ${id}`,
        html: `
          <h2 style="font-family:system-ui">We need a quick chat about your refund.</h2>
          <p>Reply to this email or call <a href="tel:${SUPPORT.phone.replace(/\s/g, "")}">${SUPPORT.phone}</a>
            and we&apos;ll work it out together.</p>
          <p>Notes: ${notes || "(none)"}</p>
        `,
      });
    } catch (e) {
      console.error("refund reject mail failed", e);
    }
  }
  return NextResponse.json({ ok: true, refund: updated });
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ ok: true, refunds: await listRefunds() });
}
