import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { rateLimit, clientIp, trackSuspicious } from "@/lib/security";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  const rl = rateLimit(`admin:login:${ip}`, 5, 10 * 60 * 1000);
  if (!rl.ok) {
    await trackSuspicious("admin_login_rate_limit", ip, "5 attempts in 10 min", 1, 10);
    return NextResponse.redirect(
      new URL("/admin/login?error=ratelimit", req.url),
      { status: 303 },
    );
  }

  const fd = await req.formData();
  const pw = String(fd.get("password") ?? "");
  if (!process.env.ADMIN_PASSWORD || pw !== process.env.ADMIN_PASSWORD) {
    await trackSuspicious("admin_login_failed", ip, "wrong password", 3, 10);
    return NextResponse.redirect(new URL("/admin/login?error=1", req.url), { status: 303 });
  }
  const c = await cookies();
  c.set("jb_admin", pw, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return NextResponse.redirect(new URL("/admin", req.url), { status: 303 });
}
