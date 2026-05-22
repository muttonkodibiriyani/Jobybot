import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/LoginForm";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://jobybots.com";

export const metadata: Metadata = {
  title: "Sign in · JobyBots customer portal",
  description:
    "Enter the email + license key from your JobyBots purchase. Configure your bot's settings in your browser and download a personalised installer in one click. Your credentials never leave your device — verify in DevTools.",
  alternates: { canonical: `${SITE_URL}/login` },
  robots: { index: true, follow: true },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ email?: string; from?: string }>;
}) {
  const params = (await searchParams) ?? {};
  return (
    <main className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-cream via-white to-white">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 pt-20 pb-24 lg:grid-cols-2 lg:gap-16 lg:pt-28">
        {/* Left: pitch */}
        <section>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-strong">
            Customer portal · Sign in
          </p>
          <h1 className="mt-4 text-3xl sm:text-5xl font-bold text-ink tracking-tight">
            Welcome back. Let's get your bot configured.
          </h1>
          <p className="mt-6 text-lg text-slate-700 leading-relaxed">
            One sign-in unlocks the configuration wizard, a personalised
            installer download, and your live dashboard preview. Use the
            email + license key from your purchase confirmation.
          </p>

          <ul className="mt-8 space-y-3 text-[15px] text-slate-800">
            <li className="flex items-start gap-2.5">
              <span aria-hidden className="mt-1 text-emerald-500">●</span>
              <span>
                <strong>Browser-only.</strong> Your Gmail App Password, Gemini
                key and résumé never reach our servers. Open{" "}
                <kbd className="kbd">F12</kbd> → Network and verify.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span aria-hidden className="mt-1 text-emerald-500">●</span>
              <span>
                <strong>One download.</strong> The portal bundles your{" "}
                <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">.env</code>
                {" "}+ install scripts into a personalised ZIP.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span aria-hidden className="mt-1 text-emerald-500">●</span>
              <span>
                <strong>No subscription, no expiry.</strong> Your key is yours
                forever. Lost it? Email <a className="text-accent-strong underline" href="mailto:tharakesh.iitp@gmail.com">tharakesh.iitp@gmail.com</a>.
              </span>
            </li>
          </ul>

          <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-mono uppercase tracking-[0.18em] text-slate-500">
              Don't have a key yet?
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              JobyBots is a one-time purchase. Pay ₹2,999 once, get an instant
              license key + portal access. No recurring charges.
            </p>
            <Link
              href="/buy-india"
              className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-strong"
            >
              Get JobyBots — ₹2,999 lifetime →
            </Link>
          </div>
        </section>

        {/* Right: login form */}
        <section className="flex items-start">
          <div className="w-full rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-2xl shadow-slate-900/5">
            <LoginForm initialEmail={params.email ?? ""} />
          </div>
        </section>
      </div>
    </main>
  );
}
