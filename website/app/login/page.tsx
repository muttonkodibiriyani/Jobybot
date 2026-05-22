import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/LoginForm";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://jobybots.com";

export const metadata: Metadata = {
  title: "Sign in · JobyBots customer portal",
  description:
    "Sign in with the email or phone you registered with, plus your password. Configure your bot in your browser and download a personalised installer in one click.",
  alternates: { canonical: `${SITE_URL}/login` },
  robots: { index: true, follow: true },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ id?: string; from?: string }>;
}) {
  const params = (await searchParams) ?? {};
  return (
    <main className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-cream via-white to-white">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 pt-20 pb-24 lg:grid-cols-2 lg:gap-16 lg:pt-28">
        {/* Pitch */}
        <section>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-strong">
            Customer portal · Sign in
          </p>
          <h1 className="mt-4 text-3xl sm:text-5xl font-bold text-ink tracking-tight">
            Welcome back.
          </h1>
          <p className="mt-6 text-lg text-slate-700 leading-relaxed">
            Sign in with the email or phone you registered with. Once you're
            in, you'll generate your <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm">.env</code> in
            the browser and download a personalised installer ZIP.
          </p>

          <ul className="mt-8 space-y-3 text-[15px] text-slate-800">
            <li className="flex items-start gap-2.5">
              <span aria-hidden className="mt-1 text-emerald-500">●</span>
              <span>
                <strong>Email or phone</strong> — whichever you signed up with.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span aria-hidden className="mt-1 text-emerald-500">●</span>
              <span>
                <strong>Your credentials are local.</strong> The .env you generate
                in the portal never reaches our servers. Verify in DevTools.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span aria-hidden className="mt-1 text-emerald-500">●</span>
              <span>
                <strong>No subscription.</strong> Pay once, sign in forever.
              </span>
            </li>
          </ul>

          <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-mono uppercase tracking-[0.18em] text-slate-500">
              First time here?
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              JobyBots is a one-time ₹2,999 purchase. Create an account, pay via
              UPI, and you'll be signing in here within 30 minutes.
            </p>
            <Link
              href="/signup"
              className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-strong"
            >
              Create an account →
            </Link>
          </div>
        </section>

        {/* Form */}
        <section className="flex items-start">
          <div className="w-full rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-2xl shadow-slate-900/5">
            <LoginForm initialIdentifier={params.id ?? ""} />
          </div>
        </section>
      </div>
    </main>
  );
}
