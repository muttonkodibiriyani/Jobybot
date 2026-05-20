import Link from "next/link";
import { ComparisonTable } from "@/components/ComparisonTable";
import { Logo } from "@/components/Logo";
import { AISearchDemo } from "@/components/AISearchDemo";
import { SUPPORT, PAYMENT } from "@/lib/config";

const stats = [
  { value: "200", label: "Validated emails / day" },
  { value: "8+", label: "Markets supported" },
  { value: "30 min", label: "Search cadence" },
  { value: "100%", label: "Runs on your PC" },
];

const steps = [
  {
    n: "1",
    title: "Install on your laptop",
    body: "Windows 10+. One installer. Your Gmail App Password stays local — nothing on our servers.",
  },
  {
    n: "2",
    title: "JobyBots searches every 30–60 min",
    body: "LinkedIn, Indeed, Bayt, Naukri Gulf, RemoteOK — 8 sources in parallel, ranked by your resume.",
  },
  {
    n: "3",
    title: "Emails recruiters automatically",
    body: "MX-validated + bounce-tracked. GDPR-safe markets get inbox-only treatment.",
  },
  {
    n: "4",
    title: "You apply in one click",
    body: "Browser bookmarklet pre-fills LinkedIn Easy Apply, Indeed, Workday, Greenhouse — you click Submit.",
  },
];

const markets = ["India", "UAE", "Singapore", "Germany", "Netherlands", "Ireland", "Sweden", "Canada", "UK", "Australia"];

const trust = [
  { label: "Gemini AI-powered matching" },
  { label: "200 applications / day" },
  { label: "Tailored to your résumé" },
  { label: "Runs on your laptop" },
  { label: "7-day money-back" },
  { label: "Founder support · WhatsApp" },
];

export default function HomePage() {
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-ink text-white">
        {/* subtle gradient blobs */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 -right-20 h-96 w-96 rounded-full blur-3xl"
          style={{ background: "radial-gradient(closest-side, rgba(255,107,0,0.25), transparent)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-40 -left-20 h-96 w-96 rounded-full blur-3xl"
          style={{ background: "radial-gradient(closest-side, rgba(255,107,0,0.12), transparent)" }}
        />

        <div className="relative mx-auto max-w-page section-pad px-4 lg:flex lg:items-center lg:gap-16">
          <div className="flex-1">
            <Logo variant="light" hero className="mb-8" />

            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white/80 backdrop-blur">
              <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
              Powered by Google Gemini AI
            </p>

            <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl lg:text-[3rem] lg:leading-[1.05]">
              An AI that searches LinkedIn for you,
              <br className="hidden sm:block" />
              <span className="text-accent">tailors every application,</span>
              <br className="hidden sm:block" />
              and emails recruiters all day.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/75">
              Gemini-powered job matching. 200 tailored applications a day.
              Built for ambitious job seekers in{" "}
              <strong className="text-white">India, UAE, Singapore, and 5 more markets</strong>.
              One-time ₹{PAYMENT.amountInr.toLocaleString("en-IN")}. Lifetime. Runs on your PC.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href="/buy-india" className="btn-primary text-center">
                Buy with UPI · ₹{PAYMENT.amountInr.toLocaleString("en-IN")}
              </Link>
              <Link
                href="/demo"
                className="btn-secondary !border-white/20 !bg-transparent !text-white hover:!bg-white/10"
              >
                See AI in action ↓
              </Link>
            </div>
            <p className="mt-6 flex flex-wrap items-center gap-2 text-sm text-white/60">
              {trust.map((t) => (
                <span
                  key={t.label}
                  className="rounded-full border border-white/15 px-3 py-1"
                >
                  ✓ {t.label}
                </span>
              ))}
            </p>
          </div>

          {/* Live AI search demo, right side */}
          <div className="mt-12 flex-1 lg:mt-0">
            <AISearchDemo />
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="border-b border-surface-border bg-surface-subtle">
        <div className="mx-auto grid max-w-page grid-cols-2 gap-6 section-pad px-4 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-bold text-ink sm:text-4xl">{s.value}</p>
              <p className="mt-1 text-sm text-ink-muted">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="mx-auto max-w-page section-pad px-4">
        <p className="eyebrow">How it works</p>
        <h2 className="h2 mt-2">Four steps. Zero complexity.</h2>
        <p className="lead mt-4 max-w-2xl">
          Designed like the best consumer apps: one clear action per step, no jargon.
        </p>
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {steps.map((s) => (
            <article key={s.n} className="card">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft text-sm font-bold text-accent">
                {s.n}
              </span>
              <h3 className="mt-4 text-xl font-semibold">{s.title}</h3>
              <p className="mt-2 text-ink-muted leading-relaxed">{s.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* COMPARISON */}
      <section className="bg-surface-subtle">
        <div className="mx-auto max-w-page section-pad px-4">
          <p className="eyebrow">Vs. the rest</p>
          <h2 className="h2 mt-2">Why JobyBots wins</h2>
          <p className="lead mt-4 max-w-2xl">
            We compared ourselves against the most popular AI job-application
            services. Here&apos;s the honest breakdown.
          </p>
          <div className="mt-10">
            <ComparisonTable />
          </div>
          <p className="mt-6 text-xs text-ink-muted">
            Comparison based on public pricing pages and product reviews, May
            2026. Trademarks belong to their respective owners.
          </p>
        </div>
      </section>

      {/* MARKETS */}
      <section id="markets" className="mx-auto max-w-page section-pad px-4 text-center">
        <p className="eyebrow">Markets</p>
        <h2 className="h2 mt-2">Built for India & UAE — ready for the world</h2>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          {markets.map((m) => (
            <span
              key={m}
              className="rounded-full border border-surface-border bg-surface px-5 py-2.5 text-sm font-medium shadow-sm"
            >
              {m}
            </span>
          ))}
        </div>
      </section>

      {/* WHAT THE AI DOES */}
      <section className="bg-ink text-white">
        <div className="mx-auto max-w-page section-pad px-4">
          <p className="eyebrow text-white/60">What the AI does for you</p>
          <h2 className="h2 mt-2 text-white">
            Every <span className="text-accent">30 minutes</span>, while you sleep.
          </h2>
          <p className="lead mt-4 max-w-2xl text-white/70">
            JobyBots isn't a job board — it's an AI agent that does the
            entire grind for you. Here's the actual checklist it runs on
            your laptop, every cycle, all day long.
          </p>

          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                emoji: "🔍",
                t: "Scans 8 job sites in parallel",
                d: "LinkedIn, Indeed, Naukri, Bayt, RemoteOK, Glassdoor, AngelList and company career pages — all hit at the same time, every 30 minutes.",
              },
              {
                emoji: "🧠",
                t: "Reads your résumé with Gemini AI",
                d: "Extracts your skills, titles, industries and years of experience. Saves a private profile that every search runs against.",
              },
              {
                emoji: "🎯",
                t: "Scores every job 0–100",
                d: "Gemini compares each job description to your résumé and gives a match score with a one-line plain-English reason.",
              },
              {
                emoji: "✍️",
                t: "Writes a custom cover letter",
                d: "For every match above 70%, the AI drafts a 4–6 sentence email that quotes the job description and references your résumé.",
              },
              {
                emoji: "📧",
                t: "Validates & emails recruiters",
                d: "Checks every recruiter email is real (DNS lookup), then sends — up to 200 personalized emails per day, rate-limited so Gmail stays happy.",
              },
              {
                emoji: "🌍",
                t: "Knows EU privacy rules",
                d: "Germany, Sweden, Ireland and other GDPR-strict markets get apply-via-website only — no cold emails, ever. Stays out of trouble.",
              },
              {
                emoji: "📥",
                t: "Tracks bounces automatically",
                d: "Reads your Mailer-Daemon replies, quarantines bad addresses, and never spams a dead inbox twice.",
              },
              {
                emoji: "🔔",
                t: "Daily 9 AM digest email",
                d: "Top 25 AI-matched jobs of the last 24 hours land in your inbox with one-click apply buttons. Skim. Click. Done.",
              },
              {
                emoji: "🔒",
                t: "100% on your laptop",
                d: "Your résumé, Gmail password, and Gemini key never leave your project folder. Nothing is uploaded to us. Ever.",
              },
            ].map((f) => (
              <div
                key={f.t}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:border-accent/40 hover:bg-white/[0.07]"
              >
                <div className="text-3xl">{f.emoji}</div>
                <p className="mt-4 text-lg font-bold">{f.t}</p>
                <p className="mt-2 text-sm leading-relaxed text-white/70">{f.d}</p>
              </div>
            ))}
          </div>

          {/* Buyer reassurance — no jargon */}
          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            {[
              { e: "✅", t: "7-day money-back", d: "Try the AI for a week. Not happy? Submit one form, refund in 5 business days." },
              { e: "🤝", t: "Owner-verified payments", d: "Every UPI order is manually approved within 30 minutes. No auto-charges, no fraud risk." },
              { e: "📞", t: "Founder on WhatsApp", d: "Stuck during install? Direct line to the founder. Real human, real answers, no chatbots." },
            ].map((r) => (
              <div key={r.t} className="rounded-2xl bg-white/5 p-5">
                <p className="text-2xl">{r.e}</p>
                <p className="mt-2 font-semibold">{r.t}</p>
                <p className="mt-1 text-sm text-white/70">{r.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SUPPORT */}
      <section className="mx-auto max-w-page section-pad px-4">
        <div className="grid items-center gap-10 rounded-3xl bg-accent-soft p-10 md:grid-cols-2">
          <div>
            <p className="eyebrow">Real humans · Real support</p>
            <h2 className="h2 mt-2">Stuck? Call us.</h2>
            <p className="lead mt-4">
              No chatbots. No tickets that go nowhere. Email or WhatsApp the
              founder directly during {SUPPORT.hours}.
            </p>
          </div>
          <div className="space-y-3">
            <a
              href={`mailto:${SUPPORT.email}`}
              className="flex items-center justify-between rounded-2xl bg-white p-5 shadow-sm hover:shadow-lift"
            >
              <div>
                <p className="text-xs uppercase tracking-wider text-ink-muted">Email</p>
                <p className="text-lg font-semibold">{SUPPORT.email}</p>
              </div>
              <span className="text-2xl">✉️</span>
            </a>
            <a
              href={`tel:${SUPPORT.phone.replace(/\s/g, "")}`}
              className="flex items-center justify-between rounded-2xl bg-white p-5 shadow-sm hover:shadow-lift"
            >
              <div>
                <p className="text-xs uppercase tracking-wider text-ink-muted">Call · WhatsApp</p>
                <p className="text-lg font-semibold">{SUPPORT.phone}</p>
              </div>
              <span className="text-2xl">📞</span>
            </a>
            <Link
              href="/faq"
              className="flex items-center justify-between rounded-2xl bg-white p-5 shadow-sm hover:shadow-lift"
            >
              <div>
                <p className="text-xs uppercase tracking-wider text-ink-muted">Self-serve</p>
                <p className="text-lg font-semibold">FAQ &amp; refund policy</p>
              </div>
              <span className="text-2xl">📘</span>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-ink text-white">
        <div className="mx-auto max-w-page section-pad px-4 text-center">
          <h2 className="h2 text-white">Stop tab-juggling. Start interviewing.</h2>
          <p className="lead mx-auto mt-4 max-w-xl text-white/70">
            Pay once. Download the installer. Be up and running in 15 minutes.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link href="/buy-india" className="btn-primary">
              Buy with UPI · ₹{PAYMENT.amountInr.toLocaleString("en-IN")}
            </Link>
            <Link
              href="/pricing"
              className="btn-secondary !border-white/20 !bg-transparent !text-white hover:!bg-white/10"
            >
              Pay by card ($49)
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
