import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { updateOrderStatus, getOrder } from "@/lib/orders";
import { sendDeliveryEmail } from "@/lib/mailer";

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
  const body = (await req.json()) as { id?: string; action?: "approve" | "reject"; notes?: string };
  if (!body.id || !body.action) {
    return NextResponse.json({ ok: false, error: "Missing id/action" }, { status: 400 });
  }
  const updated = await updateOrderStatus(
    body.id,
    body.action === "approve" ? "approved" : "rejected",
    body.notes ?? "",
  );
  if (!updated) {
    return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
  }
  if (body.action === "approve") {
    try {
      await sendDeliveryEmail({ id: updated.id, name: updated.name, email: updated.email });
    } catch (e) {
      console.error("delivery mail failed", e);
    }
  }
  return NextResponse.json({ ok: true, order: updated });
}

export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ ok: false }, { status: 400 });
  const o = await getOrder(id);
  return NextResponse.json({ ok: true, order: o });
}
