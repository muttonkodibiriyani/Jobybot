import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CUSTOMER_SESSION_COOKIE, verifySession } from "@/lib/auth";
import { getCustomerByEmail } from "@/lib/customers";
import { PortalDashboard } from "@/components/PortalDashboard";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://jobybots.com";

export const metadata: Metadata = {
  title: "Your JobyBots portal · Configure + download in one click",
  description:
    "Build your personal .env, download a ready-to-run installer ZIP, and preview your live dashboard. The portal runs entirely in your browser — your credentials never reach our servers.",
  alternates: { canonical: `${SITE_URL}/portal` },
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function PortalPage() {
  const jar = await cookies();
  const token = jar.get(CUSTOMER_SESSION_COOKIE)?.value;
  const email = verifySession(token);
  if (!email) redirect("/login?from=portal");

  const customer = await getCustomerByEmail(email);
  if (!customer) redirect("/login?from=portal");

  // Guard: only fully active accounts get the portal.
  if (customer.status === "pending_payment") redirect("/buy-india");
  if (customer.status === "pending_verification") {
    return <PendingScreen name={customer.name} />;
  }
  if (customer.status === "rejected" || customer.status === "refunded") {
    return <BlockedScreen status={customer.status} />;
  }

  return (
    <PortalDashboard
      email={customer.email}
      name={customer.name}
      phone={customer.phone}
    />
  );
}

function PendingScreen({ name }: { name: string }) {
  return (
    <main className="min-h-[calc(100vh-4rem)] bg-cream">
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-3xl">
          ⏳
        </span>
        <h1 className="mt-6 text-3xl font-bold text-ink">Hi {name}, payment is being verified.</h1>
        <p className="mt-4 text-lg text-slate-700 leading-relaxed">
          We've received your UPI submission and the founder is verifying it
          now. You'll get an email the moment your account is activated —
          usually within 30 minutes.
        </p>
        <p className="mt-6 text-sm text-slate-600">
          Need it right now? WhatsApp <a className="font-semibold text-accent underline" href="https://wa.me/971505619548">+971 50 561 9548</a> with your screenshot.
        </p>
        <form action="/api/auth/logout" method="post" className="mt-10">
          <button type="submit" className="rounded-full border border-slate-300 px-5 py-2 text-sm text-slate-700 hover:bg-slate-50">
            Sign out
          </button>
        </form>
      </div>
    </main>
  );
}

function BlockedScreen({ status }: { status: "rejected" | "refunded" }) {
  const msg =
    status === "rejected"
      ? "We couldn't verify your last UPI payment. Please check the email we sent — or reply to it with a fresh screenshot."
      : "This account was refunded. If you'd like to come back, just sign up again — no hard feelings.";
  return (
    <main className="min-h-[calc(100vh-4rem)] bg-cream">
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h1 className="text-3xl font-bold text-ink">Access not available</h1>
        <p className="mt-4 text-lg text-slate-700 leading-relaxed">{msg}</p>
        <a
          href="mailto:tharakesh.iitp@gmail.com"
          className="mt-8 inline-flex rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white"
        >
          Email the founder
        </a>
      </div>
    </main>
  );
}
