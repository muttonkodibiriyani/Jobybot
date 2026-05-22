import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifySession } from "@/lib/license";
import { PortalDashboard } from "@/components/PortalDashboard";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://jobybots.com";

export const metadata: Metadata = {
  title: "Your JobyBots portal · Configure + download in one click",
  description:
    "Build your personal .env, download a ready-to-run installer ZIP, and preview your live dashboard. The portal runs entirely in your browser — your credentials never reach our servers.",
  alternates: { canonical: `${SITE_URL}/portal` },
  robots: { index: false, follow: false }, // portal is private
};

export default async function PortalPage() {
  // Auth check (server-side). If no/invalid session → /login.
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  const email = verifySession(token);
  if (!email) {
    redirect("/login?from=portal");
  }
  return <PortalDashboard email={email} />;
}
