import Link from "next/link";
import { Logo } from "@/components/Logo";
import { DashboardLive } from "@/components/DashboardLive";
import { PAYMENT } from "@/lib/config";

export const metadata = {
  title: "Your AI Job Dashboard · JobyBots",
  description:
    "Live preview of the JobyBots dashboard customers see after install. AI-tailored job links from LinkedIn, Indeed, Naukri and more, delivered every day.",
};

export default function DashboardPreviewPage() {
  return (
    <>
      {/* Hero — light theme matching homepage */}
      <section className="relative overflow-hidden mesh-bg">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 right-0 h-[520px] w-[520px] rounded-full opacity-50 blur-3xl"
          style={{
            background:
              "radial-gradient(closest-side, rgba(255,107,0,0.16), transparent)",
          }}
        />
        <div className="relative mx-auto max-w-page section-pad px-4">
          <div className="flex items-center justify-between gap-4">
            <Logo size="md" />
            <span className="pill">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
              Preview · what you get after install
            </span>
          </div>
          <h1 className="display-1 mt-12 max-w-3xl text-ink">
            One screen. Every job.
            <br />
            <span className="shimmer-text">Tailored to your résumé.</span>
          </h1>
          <p className="lead mt-7 max-w-2xl">
            After install, your private dashboard opens in your browser. Live
            logs of every search, AI-ranked jobs, daily apply-now links, and
            recruiter outreach status.
          </p>
        </div>
      </section>

      {/* Live mock dashboard */}
      <section className="mx-auto max-w-page px-4 py-12 lg:py-16">
        <DashboardLive />
      </section>

      {/* Daily job-links explainer */}
      <section className="bg-surface-subtle">
        <div className="mx-auto max-w-page section-pad px-4 lg:grid lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-5">
            <p className="eyebrow">Every morning at 9 AM</p>
            <h2 className="h2 mt-2">Tailored job links · in your inbox</h2>
            <p className="lead mt-4">
              JobyBots emails you the top 25 AI-matched jobs of the last 24
              hours. Open the email, scan the match scores, click <strong>Apply</strong> —
              the apply form is already pre-filled by the browser bookmarklet.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-ink-muted">
              {[
                "Ranked by Gemini AI based on your résumé keywords",
                "Direct apply URLs (no broken redirects)",
                "Easy-Apply badge when LinkedIn supports 1-click",
                "Reason explaining each match in plain English",
                "Bounce-checked recruiter emails included",
              ].map((b) => (
                <li key={b} className="flex gap-2.5">
                  <span className="mt-0.5 text-accent">✓</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-10 rounded-3xl border border-surface-border bg-surface p-6 shadow-sm lg:col-span-7 lg:mt-0">
            {/* mock email card */}
            <div className="rounded-2xl border border-surface-border bg-surface-subtle p-5">
              <div className="flex items-center justify-between border-b border-surface-border pb-3">
                <div>
                  <p className="text-xs uppercase tracking-wider text-ink-muted">From</p>
                  <p className="text-sm font-semibold">JobyBots Daily &lt;daily@jobybots.com&gt;</p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-wider text-ink-muted">Subject</p>
                  <p className="text-sm font-semibold">25 AI-matched jobs · Today</p>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {[
                  ["Senior PM · Careem · Dubai", "92%", "LinkedIn Easy Apply"],
                  ["Data PM · talabat · Riyadh", "88%", "Indeed Quick Apply"],
                  ["AI Lead · Razorpay · Bengaluru", "85%", "Naukri"],
                  ["Sr. PM, Fraud · PayPal · Singapore", "81%", "LinkedIn"],
                  ["Strategy BA · ENOC · Dubai", "78%", "Bayt"],
                ].map(([title, score, src]) => (
                  <div
                    key={title}
                    className="flex items-center justify-between rounded-xl bg-surface p-3 text-sm shadow-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{title}</p>
                      <p className="text-xs text-ink-muted">{src}</p>
                    </div>
                    <span className="ml-3 shrink-0 rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-bold text-accent">
                      {score}
                    </span>
                    <button className="ml-3 shrink-0 rounded-lg bg-ink px-3 py-1.5 text-xs font-semibold text-white">
                      Apply →
                    </button>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs text-ink-muted">
                + 20 more in the dashboard · 67 recruiters emailed today · 0 bounces
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-ink text-white">
        <div className="mx-auto max-w-page section-pad px-4 text-center">
          <h2 className="h2 text-white">Get this on your laptop in 15 minutes.</h2>
          <p className="lead mx-auto mt-4 max-w-xl text-white/70">
            One-time payment. Lifetime license. Your résumé, Gemini API key,
            and Gmail App Password stay on your machine.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link href="/buy-india" className="btn-primary">
              Buy with UPI · ₹{PAYMENT.amountInr.toLocaleString("en-IN")}
            </Link>
            <Link
              href="/demo"
              className="btn-secondary !border-white/20 !bg-transparent !text-white hover:!bg-white/10"
            >
              See the demo
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
