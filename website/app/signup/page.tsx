import type { Metadata } from "next";
import Link from "next/link";
import { SignupForm } from "@/components/SignupForm";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://jobybots.com";

export const metadata: Metadata = {
  title: "Create your JobyBots account · ₹2,999 lifetime",
  description:
    "Sign up with your email, phone and a password. After payment is verified you'll sign in with these same credentials to configure and download your personalised JobyBots installer.",
  alternates: { canonical: `${SITE_URL}/signup` },
};

export default function SignupPage() {
  return (
    <main className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-cream via-white to-white">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 pt-20 pb-24 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:pt-28">
        {/* Pitch */}
        <section>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-strong">
            Step 1 of 2 · Create account
          </p>
          <h1 className="mt-4 text-3xl sm:text-5xl font-bold text-ink tracking-tight">
            Create your JobyBots account.
          </h1>
          <p className="mt-6 text-lg text-slate-700 leading-relaxed">
            Sign up with your email, phone and a password. After UPI payment
            is verified you'll sign in with these same credentials to
            configure and download your installer.
          </p>

          <ol className="mt-10 space-y-4">
            {[
              { n: 1, t: "Create account",         d: "60 sec — email, phone, password.",                 cur: true },
              { n: 2, t: "Pay ₹2,999 via UPI",     d: "Scan the QR with PhonePe / GPay / Paytm, submit screenshot." },
              { n: 3, t: "We verify (≤30 min)",    d: "Founder manually confirms the payment. You'll get an email." },
              { n: 4, t: "Sign in & download",     d: "Configure your .env in the portal and grab your personalised ZIP." },
            ].map((s) => (
              <li
                key={s.n}
                className={`flex items-start gap-4 rounded-2xl border p-4 ${
                  s.cur
                    ? "border-accent bg-accent/10"
                    : "border-slate-200 bg-white"
                }`}
              >
                <span
                  aria-hidden
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-bold ${
                    s.cur ? "bg-accent text-white" : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {s.n}
                </span>
                <div>
                  <p className="text-sm font-bold text-ink">{s.t}</p>
                  <p className="mt-0.5 text-sm text-slate-600">{s.d}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-10 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-xs font-mono uppercase tracking-[0.18em] text-emerald-800">
              Your credentials never leave the country
            </p>
            <p className="mt-2 text-sm leading-relaxed text-emerald-900">
              Password is hashed with scrypt (16 384 · 8 · 1) before storage.
              Even the founder can't read it. <Link href="/security" className="underline">How is this safe?</Link>
            </p>
          </div>

          <p className="mt-8 text-sm text-slate-600">
            Already signed up?{" "}
            <Link href="/login" className="font-semibold text-accent-strong underline">
              Sign in instead →
            </Link>
          </p>
        </section>

        {/* Form */}
        <section className="flex items-start">
          <div className="w-full rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-2xl shadow-slate-900/5">
            <SignupForm />
          </div>
        </section>
      </div>
    </main>
  );
}
