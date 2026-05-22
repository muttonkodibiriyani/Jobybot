import { NextResponse } from "next/server";
import { CUSTOMER_SESSION_COOKIE } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(CUSTOMER_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}

// Convenience so an empty <form action="/api/auth/logout" method="post"> works.
export async function GET() {
  return POST();
}
