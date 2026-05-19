import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const c = await cookies();
  c.delete("jb_admin");
  return NextResponse.redirect(new URL("/admin/login", req.url), { status: 303 });
}
