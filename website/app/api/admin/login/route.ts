import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const fd = await req.formData();
  const pw = String(fd.get("password") ?? "");
  if (!process.env.ADMIN_PASSWORD || pw !== process.env.ADMIN_PASSWORD) {
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
