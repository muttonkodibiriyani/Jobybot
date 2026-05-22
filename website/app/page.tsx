import Link from "next/link";
import { ComparisonTable } from "@/components/ComparisonTable";
import { AISearchDemo } from "@/components/AISearchDemo";
import { HeroGear } from "@/components/HeroGear";
import { FeatureCard } from "@/components/FeatureCard";
import { HeroVideo } from "@/components/HeroVideo";
import { Reveal } from "@/components/Reveal";
import { SUPPORT, PAYMENT } from "@/lib/config";

const DEMO_VIDEO_ID = "fwKCITDa2MM";

const FAQ_ITEMS: Array<{ q: string; a: string }> = [
  {
    q: "Is JobyBots safe to use on LinkedIn?",
    a: "Yes. JobyBots does not log into your LinkedIn account or click any apply buttons. It only reads public job listings, scores them with Gemini, and emails recruiters from your Gmail. No automation against LinkedIn's UI that would violate their ToS.",
  },
  {
    q: "Do you upload my résumé to a server?",
    a: "No. JobyBots is a local-first Python app. Your résumé, Gmail App Password, and Gemini API key live in a folder on your own machine. The website only handles purchase and license verification.",
  },
  {
    q: "How many job applications can it send per day?",
    a: "Up to 200 personalised applications per day. The daily cap is configurable in .env (DAILY_EMAIL_CAP). Each email is sent from your Gmail with a randomised 20-60 second delay so you stay below Gmail's bulk-mail threshold.",
  },
  {
    q: "Which markets does JobyBots support?",
    a: "Primary: UAE. Secondary: Saudi Arabia, Qatar, Oman, Bahrain, India, Singapore, Canada, Australia, UK, Germany, Netherlands, Ireland. UK and EU markets run in GDPR-safe mode (apply via official sites or legitimate-interest contacts only).",
  },
  {
    q: "Is there a refund policy?",
    a: "Yes — 7 days, no questions asked. Email tharakesh.iitp@gmail.com or fill the refund form on /refund and we'll process it within 24 hours.",
  },
  {
    q: "Does it work on Mac?",
    a: "Yes — Windows 10/11 and macOS 12+. The installer is identical: extract the .zip, double-click JOBYBOT.bat (Windows) or JOBYBOT.sh (Mac), and answer 5 setup questions.",
  },
  {
    q: "Will I need to learn Python or coding?",
    a: "No. The one-click installer handles Python setup automatically. You'll edit one .env file (5 fields) and run one command. Total install time: about 15 minutes.",
  },
  {
    q: "How is JobyBots different from LazyApply or Sonara?",
    a: "Three differences: (1) Pay once (₹2,999) vs subscription, (2) Runs on your laptop so your data stays private, (3) Targets the GCC + India market with curated recruiter contacts that US-focused tools don't have.",
  },
];

const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_ITEMS.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

const stats = [
  { value: "200", suffix: "",  label: "AI applications / day" },
  { value: "30",  suffix: "s", label: "From scan to email" },
  { value: "8",   suffix: "+", label: "Job sites covered" },
  { value: "100", suffix: "%", label: "Runs on your laptop" },
];

const trustLogos = ["LinkedIn", "Indeed", "Naukri", "Bayt", "RemoteOK", "Glassdoor"];

const aiCapabilities = [
  {
    emoji: "🔍",
    title: "Scans 8 job sites in parallel",
    desc: "LinkedIn, Indeed, Naukri, Bayt, RemoteOK, Glassdoor, AngelList and company career pages — every 30 minutes.",
  },
  {
    emoji: "🧠",
    title: "Reads your résumé with Gemini",
    desc: "Extracts skills, titles, industries and years of experience. Saves a private profile that every search runs against.",
  },
  {
    emoji: "🎯",
    title: "Scores every job 0–100",
    desc: "Gemini compares each job description to your résumé and returns a match score with a one-line plain-English reason.",
  },
  {
    emoji: "✍️",
    title: "Writes a custom cover letter",
    desc: "For every match above 70%, the AI drafts a 4–6 sentence email that quotes the JD and references your résumé.",
  },
  {
    emoji: "📧",
    title: "Validates & emails recruiters",
    desc: "Checks every recruiter email is real, then sends — up to 200 personalized emails per day, rate-limited so Gmail stays happy.",
  },
  {
    emoji: "🌍",
    title: "Knows EU privacy rules",
    desc: "Germany, Sweden, Ireland and other GDPR markets get apply-via-website only. No cold emails, ever.",
  },
  {
    emoji: "📥",
    title: "Tracks bounces automatically",
    desc: "Reads your Mailer-Daemon replies, quarantines bad addresses, and never spams a dead inbox twice.",
  },
  {
    emoji: "🔔",
    title: "Daily 9 AM digest email",
    desc: "Top 25 AI-matched jobs of the last 24 hours land in your inbox with one-click apply buttons.",
  },
  {
    emoji: "🔒",
    title: "100% on your laptop",
    desc: "Your résumé, Gmail password, and Gemini key never leave your project folder. Nothing uploaded to us. Ever.",
  },
];

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      {/* ════════════════════ HERO ════════════════════ */}
      <section className="relative overflow-hidden mesh-bg">
        {/* Soft gradient accents */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 right-0 h-[640px] w-[640px] rounded-full opacity-60 blur-3xl"
          style={{
            background:
              "radial-gradient(closest-side, rgba(255,107,0,0.18), transparent)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-40 left-0 h-[500px] w-[500px] rounded-full opacity-50 blur-3xl"
          style={{
            background:
              "radial-gradient(closest-side, rgba(255,140,58,0.10), transparent)",
          }}
        />

        <div className="relative mx-auto grid max-w-page items-center gap-10 px-4 pb-16 pt-12 sm:px-6 sm:pt-16 lg:grid-cols-12 lg:gap-8 lg:px-8 lg:pb-20 lg:pt-20">
          {/* Left: copy — 7 columns so the headline has room to breathe */}
          <div className="lg:col-span-7 lg:pr-4">
            <Reveal>
              <span className="pill">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
                NEW · Powered by Google Gemini AI
              </span>
            </Reveal>

            <Reveal delay={1}>
              <h1 className="display-1 mt-5 text-ink">
                The AI that <span className="shimmer-text">never stops</span>
                <br className="hidden sm:block" />{" "}
                job hunting for you.
              </h1>
            </Reveal>

            <Reveal delay={2}>
              <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-ink-muted sm:text-lg">
                JobyBots reads your résumé, scans LinkedIn and 7 other sites
                every 30 minutes, scores every match with Gemini, and emails
                recruiters on your behalf — works on Windows + macOS.
                One-time ₹{PAYMENT.amountInr.toLocaleString("en-IN")}. Lifetime. 7-day refund.
              </p>
            </Reveal>

            <Reveal delay={3}>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link href="/buy-india" className="btn-accent">
                  Get JobyBots · ₹{PAYMENT.amountInr.toLocaleString("en-IN")}
                  <span aria-hidden>→</span>
                </Link>
                <Link href="#watch-demo" className="btn-outline">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Watch the 2-min demo
                </Link>
              </div>
            </Reveal>

            <Reveal delay={4}>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2.5 text-sm">
                {[
                  { e: "✓", t: "Windows + macOS" },
                  { e: "✓", t: "7-day money-back" },
                  { e: "✓", t: "Founder on WhatsApp" },
                ].map((t) => (
                  <span key={t.t} className="inline-flex items-center gap-1.5 text-ink-muted">
                    <span className="text-accent">{t.e}</span> {t.t}
                  </span>
                ))}
              </div>
            </Reveal>
          </div>

          {/* Right: animated gear — 5 columns so it stays comfortably in frame */}
          <Reveal as="div" delay={2} className="lg:col-span-5">
            <HeroGear />
          </Reveal>
        </div>
      </section>

      {/* ════════════════════ HOW IT WORKS (3 clicks) ════════════════════ */}
      <section className="mx-auto max-w-page px-4 pt-8 pb-2 sm:px-6 lg:px-8">
        <Reveal>
          <div className="rounded-3xl border border-surface-divider bg-white p-6 sm:p-8 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <p className="eyebrow">Three clicks from purchase to first email</p>
              <Link
                href="/security"
                className="text-xs font-semibold text-accent hover:underline"
              >
                Why is this safe? →
              </Link>
            </div>
            <ol className="grid gap-4 md:grid-cols-3">
              <li className="rounded-2xl border border-surface-divider bg-cream/50 p-5">
                <div className="flex items-baseline gap-3">
                  <span className="font-display text-3xl font-extrabold text-accent tabular-nums">01</span>
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-ink-muted">Pay</span>
                </div>
                <h3 className="mt-3 font-display text-lg font-bold text-ink">
                  Buy once · ₹{PAYMENT.amountInr.toLocaleString("en-IN")}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                  Instant Stripe / UPI checkout. Email with the installer link
                  ZIP for Windows + macOS lands in your inbox in 60 seconds.
                </p>
                <Link
                  href="/buy-india"
                  className="mt-3 inline-flex text-xs font-semibold text-accent hover:underline"
                >
                  Go to checkout →
                </Link>
              </li>
              <li className="rounded-2xl border-2 border-accent bg-white p-5 shadow-card">
                <div className="flex items-baseline gap-3">
                  <span className="font-display text-3xl font-extrabold text-accent tabular-nums">02</span>
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-accent">Configure in your browser</span>
                </div>
                <h3 className="mt-3 font-display text-lg font-bold text-ink">
                  Open the /setup wizard
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                  Five fields with help links: name, Gmail App Password, Gemini
                  key, roles, markets. The wizard builds a clean{" "}
                  <code className="rounded bg-surface-subtle px-1.5 py-0.5 text-[11px]">.env</code>{" "}
                  file <strong>entirely in your browser</strong> — credentials never
                  reach our servers.
                </p>
                <Link
                  href="/setup"
                  className="mt-3 inline-flex text-xs font-semibold text-accent hover:underline"
                >
                  Try the wizard now →
                </Link>
              </li>
              <li className="rounded-2xl border border-surface-divider bg-cream/50 p-5">
                <div className="flex items-baseline gap-3">
                  <span className="font-display text-3xl font-extrabold text-accent tabular-nums">03</span>
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-ink-muted">Run</span>
                </div>
                <h3 className="mt-3 font-display text-lg font-bold text-ink">
                  Drop <code className="rounded bg-surface-subtle px-1.5 py-0.5 text-[11px]">.env</code> + double-click setup
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                  Windows: <code className="text-[11px]">SETUP_FOR_FRIENDS.bat</code>.
                  Mac: <code className="text-[11px]">mac/Setup.command</code>.
                  Schedule it 24/7. Watch replies in your Gmail and the local
                  dashboard.
                </p>
                <Link
                  href="/install"
                  className="mt-3 inline-flex text-xs font-semibold text-accent hover:underline"
                >
                  See the 10-step walkthrough →
                </Link>
              </li>
            </ol>

            <div className="mt-6 flex flex-wrap items-center gap-2 text-[12px] text-ink-muted">
              <span className="inline-flex items-center gap-1.5">
                <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <strong className="text-ink">No big config files to edit by hand.</strong>
              </span>
              <span>The wizard generates a 30-line <code className="text-[11px]">.env</code> the bot reads automatically.</span>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ════════════════════ VIDEO DEMO ════════════════════ */}
      <section
        id="watch-demo"
        className="mx-auto max-w-page px-4 pb-8 sm:px-6 lg:px-8 lg:pb-12"
      >
        <div className="mx-auto max-w-4xl">
          <Reveal>
            <p className="eyebrow text-center">2-minute walkthrough</p>
          </Reveal>
          <Reveal delay={1}>
            <h2 className="display-2 mt-3 text-center text-ink">
              See JobyBots <span className="shimmer-text">apply to jobs</span> for you.
            </h2>
          </Reveal>
          <Reveal delay={2}>
            <p className="lead mx-auto mt-5 max-w-2xl text-center">
              Real screen-recording of the bot scanning LinkedIn, scoring each
              match with Gemini, validating recruiter emails, and sending
              personalized applications — running entirely on a laptop.
            </p>
          </Reveal>

          <Reveal delay={3} className="mt-10">
            <HeroVideo
              id={DEMO_VIDEO_ID}
              title="JobyBots — Your AI Job Hunter. 24/7. Live demo."
            />
          </Reveal>
        </div>
      </section>

      {/* ════════════════════ TRUST BAR ════════════════════ */}
      <section className="border-y border-surface-divider bg-surface-subtle">
        <div className="mx-auto max-w-page px-4 py-12 sm:px-6 lg:px-8">
          <p className="eyebrow text-center">
            Searches across · powered by 8 sources
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-10 gap-y-5 sm:gap-x-14">
            {trustLogos.map((t, i) => (
              <Reveal key={t} delay={(Math.min(i, 5) + 1) as 1 | 2 | 3 | 4 | 5 | 6}>
                <span className="font-display text-lg font-semibold text-ink-muted/70 transition-colors hover:text-ink">
                  {t}
                </span>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════ STATS ════════════════════ */}
      <section className="mx-auto max-w-page section-pad px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-y-12 sm:grid-cols-4">
          {stats.map((s, i) => (
            <Reveal key={s.label} delay={(i + 1) as 1 | 2 | 3 | 4}>
              <div className="text-center">
                <p className="font-display text-5xl font-extrabold tracking-tight text-ink sm:text-6xl">
                  {s.value}
                  <span className="text-accent">{s.suffix}</span>
                </p>
                <p className="mt-2 text-sm font-medium text-ink-muted">{s.label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ════════════════════ LIVE AI DEMO ════════════════════ */}
      <section className="border-y border-surface-divider bg-surface-subtle">
        <div className="mx-auto max-w-page section-pad px-4 sm:px-6 lg:grid lg:grid-cols-12 lg:items-center lg:gap-12 lg:px-8">
          <div className="lg:col-span-5">
            <Reveal>
              <p className="eyebrow">Live · right now</p>
            </Reveal>
            <Reveal delay={1}>
              <h2 className="display-2 mt-3 text-ink">
                You don't have to <span className="shimmer-text">click anywhere</span>.
              </h2>
            </Reveal>
            <Reveal delay={2}>
              <p className="lead mt-5 max-w-lg">
                This is a real simulation of what JobyBots does on your laptop
                every 30 minutes — searching, scoring, tailoring, and sending —
                while you do literally anything else.
              </p>
            </Reveal>
            <Reveal delay={3}>
              <div className="mt-8 flex gap-3">
                <Link href="/demo" className="btn-primary">
                  See the full demo →
                </Link>
                <Link href="/dashboard" className="btn-ghost">
                  Dashboard preview
                </Link>
              </div>
            </Reveal>
          </div>

          <Reveal delay={2} className="mt-12 lg:col-span-7 lg:mt-0">
            <AISearchDemo />
          </Reveal>
        </div>
      </section>

      {/* ════════════════════ HOW IT WORKS ════════════════════ */}
      <section className="mx-auto max-w-page section-pad px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <Reveal>
            <p className="eyebrow">How it works</p>
          </Reveal>
          <Reveal delay={1}>
            <h2 className="display-2 mt-3 text-ink">
              Four steps. <span className="text-accent">Zero complexity.</span>
            </h2>
          </Reveal>
          <Reveal delay={2}>
            <p className="lead mt-5">
              Designed like the best consumer apps — one clear action per
              step, no jargon, no surprises.
            </p>
          </Reveal>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { n: "01", t: "Pay ₹2,999 with UPI",  d: "Scan our QR. PhonePe, GPay or Paytm. Owner approves in 30 min." },
            { n: "02", t: "Install in 3 minutes", d: "Double-click JOBYBOT.bat. Answer 5 questions. Done." },
            { n: "03", t: "Drop in your résumé", d: "Gemini reads it once. Every future search ranks against it." },
            { n: "04", t: "Wake up to interviews", d: "Daily 9 AM digest. Click Apply. Recruiters reply." },
          ].map((s, i) => (
            <Reveal key={s.n} delay={(i + 1) as 1 | 2 | 3 | 4}>
              <article className="card h-full">
                <span className="font-mono text-xs font-semibold tracking-[0.18em] text-accent">
                  STEP {s.n}
                </span>
                <h3 className="mt-4 font-display text-xl font-semibold text-ink">
                  {s.t}
                </h3>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-muted">
                  {s.d}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ════════════════════ WHAT THE AI DOES ════════════════════ */}
      <section className="border-y border-surface-divider bg-surface-subtle">
        <div className="mx-auto max-w-page section-pad px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <Reveal>
              <p className="eyebrow">What the AI does for you</p>
            </Reveal>
            <Reveal delay={1}>
              <h2 className="display-2 mt-3 text-ink">
                Every <span className="text-accent">30 minutes</span>, while you sleep.
              </h2>
            </Reveal>
            <Reveal delay={2}>
              <p className="lead mt-5">
                JobyBots isn't a job board. It's an AI agent that runs the
                entire grind for you — here's the actual checklist it executes
                every cycle.
              </p>
            </Reveal>
          </div>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {aiCapabilities.map((f, i) => (
              <Reveal
                key={f.title}
                delay={((i % 6) + 1) as 1 | 2 | 3 | 4 | 5 | 6}
              >
                <FeatureCard emoji={f.emoji} title={f.title} desc={f.desc} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════ COMPARISON ════════════════════ */}
      <section className="mx-auto max-w-page section-pad px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <Reveal>
            <p className="eyebrow">Vs. the rest</p>
          </Reveal>
          <Reveal delay={1}>
            <h2 className="display-2 mt-3 text-ink">
              The <span className="shimmer-text">honest</span> comparison.
            </h2>
          </Reveal>
          <Reveal delay={2}>
            <p className="lead mt-5">
              We benchmarked JobyBots against the four AI job-application tools
              everyone keeps emailing about. Public pricing pages, May 2026.
            </p>
          </Reveal>
        </div>
        <Reveal delay={3} className="mt-12">
          <ComparisonTable />
        </Reveal>
      </section>

      {/* ════════════════════ DARK PREMIUM CARD ════════════════════ */}
      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="relative mx-auto max-w-page overflow-hidden rounded-4xl bg-ink p-10 shadow-lift sm:p-14 lg:p-20">
          {/* Decorative gear in the corner */}
          <svg
            viewBox="-110 -110 220 220"
            className="pointer-events-none absolute -right-32 -top-32 h-[420px] w-[420px] animate-gear-spin-slow opacity-[0.06]"
            aria-hidden
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <rect
                key={i}
                x={-10}
                y={-100}
                width={20}
                height={28}
                rx={5}
                fill="#FF6B00"
                transform={`rotate(${(i * 360) / 12})`}
              />
            ))}
            <circle cx={0} cy={0} r={76} fill="#FF6B00" />
            <circle cx={0} cy={0} r={34} fill="#1D1D1F" />
          </svg>

          <div className="relative max-w-xl">
            <Reveal>
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">
                Spatial intelligence · Built on Gemini
              </p>
            </Reveal>
            <Reveal delay={1}>
              <h2 className="display-2 mt-4 text-white">
                Your résumé. The whole job market.{" "}
                <span className="text-accent">Perfectly matched.</span>
              </h2>
            </Reveal>
            <Reveal delay={2}>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-white/70">
                Gemini Flash extracts your skills, titles and industries into
                a private embedding — then scores every new job posting
                against it in milliseconds. The result: only the matches that
                truly fit make it to your inbox.
              </p>
            </Reveal>
            <Reveal delay={3}>
              <div className="mt-10 flex flex-wrap gap-3">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-[15px] font-semibold text-ink transition-all hover:bg-surface-subtle hover:-translate-y-0.5"
                >
                  Explore the dashboard →
                </Link>
                <Link
                  href="/demo"
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-transparent px-7 py-3.5 text-[15px] font-semibold text-white transition-all hover:bg-white/10"
                >
                  Watch the demo
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ════════════════════ SUPPORT ════════════════════ */}
      <section className="mx-auto max-w-page section-pad px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 rounded-4xl border border-surface-divider bg-surface-raised p-10 shadow-xs md:grid-cols-2 lg:p-14">
          <div>
            <Reveal>
              <p className="eyebrow">Real humans · Real support</p>
            </Reveal>
            <Reveal delay={1}>
              <h2 className="h2 mt-3 text-ink">Stuck? Call us.</h2>
            </Reveal>
            <Reveal delay={2}>
              <p className="lead mt-5">
                No chatbots. No tickets that go nowhere. Email or WhatsApp the
                founder directly during {SUPPORT.hours}.
              </p>
            </Reveal>
          </div>
          <div className="space-y-3">
            {[
              { label: "Email", value: SUPPORT.email, href: `mailto:${SUPPORT.email}`, icon: "✉️" },
              { label: "Call · WhatsApp", value: SUPPORT.phone, href: `tel:${SUPPORT.phone.replace(/\s/g, "")}`, icon: "📞" },
              { label: "Self-serve", value: "FAQ & refund policy", href: "/faq", icon: "📘" },
            ].map((c, i) => (
              <Reveal key={c.label} delay={(i + 1) as 1 | 2 | 3}>
                <Link
                  href={c.href}
                  className="group flex items-center justify-between rounded-2xl border border-surface-divider bg-white p-5 shadow-xs transition-all hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-card"
                >
                  <div>
                    <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-muted">
                      {c.label}
                    </p>
                    <p className="mt-1 font-display text-lg font-semibold text-ink">
                      {c.value}
                    </p>
                  </div>
                  <span className="text-2xl transition-transform group-hover:translate-x-1">
                    {c.icon}
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════ FAQ ════════════════════ */}
      <section className="border-y border-surface-divider bg-surface-subtle">
        <div className="mx-auto max-w-page section-pad px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <Reveal>
              <p className="eyebrow">Frequently asked</p>
            </Reveal>
            <Reveal delay={1}>
              <h2 className="display-2 mt-3 text-ink">
                Honest answers, <span className="shimmer-text">no fine print</span>.
              </h2>
            </Reveal>
          </div>

          <div className="mx-auto mt-12 max-w-3xl space-y-3">
            {FAQ_ITEMS.map((f, i) => (
              <Reveal key={f.q} delay={((i % 6) + 1) as 1 | 2 | 3 | 4 | 5 | 6}>
                <details className="group rounded-2xl border border-surface-divider bg-white p-5 shadow-xs transition-all open:shadow-card">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                    <span className="font-display text-lg font-semibold text-ink">
                      {f.q}
                    </span>
                    <span
                      aria-hidden
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-surface-divider text-ink-muted transition-transform group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <p className="mt-4 text-[15px] leading-relaxed text-ink-muted">
                    {f.a}
                  </p>
                </details>
              </Reveal>
            ))}
          </div>

          <Reveal delay={4} className="mt-10 text-center">
            <Link href="/faq" className="btn-ghost">
              See the full FAQ →
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ════════════════════ FINAL CTA ════════════════════ */}
      <section className="mx-auto max-w-page px-4 pb-24 text-center sm:px-6 lg:px-8 lg:pb-32">
        <Reveal>
          <h2 className="display-2 text-ink">
            Ready to <span className="shimmer-text">automate the grind?</span>
          </h2>
        </Reveal>
        <Reveal delay={1}>
          <p className="lead mx-auto mt-5 max-w-xl">
            Pay once. Lifetime license. Be up and running in 15 minutes.
            7-day money-back if it isn't for you.
          </p>
        </Reveal>
        <Reveal delay={2}>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link href="/buy-india" className="btn-accent">
              Buy with UPI · ₹{PAYMENT.amountInr.toLocaleString("en-IN")}
              <span aria-hidden>→</span>
            </Link>
            <Link href="/pricing" className="btn-outline">
              Pay by card ($49)
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
