import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { saveOrder, newOrderId, type Order } from "@/lib/orders";
import { sendAdminNotify } from "@/lib/mailer";
import { rateLimit, clientIp, trackSuspicious } from "@/lib/security";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_BYTES = 4 * 1024 * 1024; // 4 MB

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  const rl = rateLimit(`order:${ip}`, 6, 60 * 60 * 1000);
  if (!rl.ok) {
    await trackSuspicious("order_rate_limit", ip, "too many submissions");
    return NextResponse.json(
      { ok: false, error: "Too many submissions. Try again later or email support." },
      { status: 429 },
    );
  }
  try {
    const fd = await req.formData();
    const name = String(fd.get("name") ?? "").trim();
    const email = String(fd.get("email") ?? "").trim().toLowerCase();
    const phone = String(fd.get("phone") ?? "").trim();
    const txnRef = String(fd.get("txnRef") ?? "").trim();
    const txnTime = String(fd.get("txnTime") ?? "").trim();
    const amountInr = Number(fd.get("amountInr") ?? 0);
    const screenshot = fd.get("screenshot") as File | null;

    if (!name || !email || !phone || !txnRef || !txnTime || !amountInr) {
      return NextResponse.json({ ok: false, error: "Missing required fields." }, { status: 400 });
    }
    if (!/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
      return NextResponse.json({ ok: false, error: "Invalid email address." }, { status: 400 });
    }
    if (!screenshot || screenshot.size === 0) {
      return NextResponse.json({ ok: false, error: "Screenshot is required." }, { status: 400 });
    }
    if (screenshot.size > MAX_BYTES) {
      return NextResponse.json({ ok: false, error: "Screenshot too large (max 4 MB)." }, { status: 400 });
    }

    const buf = Buffer.from(await screenshot.arrayBuffer());
    const id = newOrderId();

    // Save screenshot locally (best-effort — Vercel filesystem is read-only,
    // we still email it as attachment so admin always has it).
    let screenshotPath: string | undefined;
    try {
      const dir = path.join(process.cwd(), "data", "screenshots");
      fs.mkdirSync(dir, { recursive: true });
      const ext = screenshot.type === "image/png" ? "png" : screenshot.type === "image/webp" ? "webp" : "jpg";
      const p = path.join(dir, `${id}.${ext}`);
      fs.writeFileSync(p, buf);
      screenshotPath = p;
    } catch {
      // ignore on read-only FS
    }

    const order: Order = {
      id,
      name,
      email,
      phone,
      amountInr,
      txnRef,
      txnTime,
      screenshotPath,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    await saveOrder(order);

    // Notify the admin with the screenshot attached so it works on Vercel too
    try {
      await sendAdminNotify(order, {
        filename: `${id}.${screenshot.type === "image/png" ? "png" : screenshot.type === "image/webp" ? "webp" : "jpg"}`,
        content: buf,
        contentType: screenshot.type,
      });
    } catch (e) {
      console.error("admin notify failed:", e);
    }

    return NextResponse.json({ ok: true, orderId: id });
  } catch (e) {
    console.error("/api/india-order failed:", e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Server error" },
      { status: 500 },
    );
  }
}
