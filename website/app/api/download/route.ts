import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { getStripe, isDemoMode } from "@/lib/stripe";

async function paymentOk(sessionId: string | null): Promise<boolean> {
  if (!sessionId) return false;
  if (sessionId.startsWith("demo_")) return isDemoMode();
  const stripe = getStripe();
  if (!stripe) return false;
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return session.payment_status === "paid";
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session_id");
  if (!(await paymentOk(sessionId))) {
    return NextResponse.json({ error: "Invalid or unpaid session" }, { status: 403 });
  }

  const zipPath = path.join(
    process.cwd(),
    "..",
    "releases",
    "Jobybot-Pro-Setup.zip",
  );

  try {
    const buf = await readFile(zipPath);
    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="Jobybot-Pro-Setup.zip"',
      },
    });
  } catch {
    return NextResponse.json(
      {
        error:
          "Installer not built yet. Run scripts/package-release.ps1 on the server.",
      },
      { status: 404 },
    );
  }
}
