import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://jobybots.com";

export const metadata: Metadata = {
  title: "Technology · The exact stack that powers JobyBots",
  description:
    "Plain-English explanation of every technology JobyBots uses. Python 3.12 + SQLite + Gemini + Playwright on your machine; Next.js 15 + Vercel KV on the marketing site. Open source, auditable, fully self-hostable.",
  alternates: { canonical: `${SITE_URL}/technology` },
  openGraph: {
    title: "JobyBots — Under the hood",
    description:
      "Every library, every choice, every reason. The full stack of the most transparent job-search bot on the market.",
    url: `${SITE_URL}/technology`,
    type: "article",
  },
};

const techLd = {
  "@context": "https://schema.org",
  "@type": "TechArticle",
  headline: "How JobyBots is built — the complete technology stack",
  description:
    "An honest tour of the technology choices behind JobyBots: a local Python 3.12 bot, a Next.js 15 + Vercel marketing site, and zero hidden dependencies.",
  author: { "@type": "Person", name: "Darapu Tharakeswara Reddy", url: SITE_URL },
  publisher: { "@type": "Organization", name: "JobyBots", url: SITE_URL },
  datePublished: "2026-05-21",
  dateModified: "2026-05-21",
};

interface Layer {
  title: string;
  blurb: string;
  bullets: { label: string; detail: string }[];
}

const LAYERS: Layer[] = [
  {
    title: "1. The bot on your machine",
    blurb:
      "Everything that touches your résumé, your Gmail, and your data lives here. Single folder, no installer, no admin rights, no background services other than the ones you explicitly start.",
    bullets: [
      {
        label: "Python 3.12 + virtualenv",
        detail:
          "The whole bot is ~4,000 lines of Python. Open any file in Notepad / TextEdit and read it. No compiled binaries, no obfuscation.",
      },
      {
        label: "SQLite (jobybot.db)",
        detail:
          "Single file in data/jobybot.db holds every job found, every email sent, every bounce, every license check. Open it in DB Browser for SQLite to inspect. Never replicated to any server.",
      },
      {
        label: "Pydantic Settings",
        detail:
          "Reads .env at startup; validates types; refuses to run if a required field is missing. Catches typos in your config before they cost you a cycle.",
      },
      {
        label: "Loguru",
        detail:
          "Structured logging to data/jobybot.log. Last-run log shows you exactly what happened. Cap at 10MB so it can never fill your disk.",
      },
      {
        label: "APScheduler",
        detail:
          "Pure-Python cron-style scheduler. Runs the cycle every N minutes inside the bot process — no Windows Task Scheduler dependency for the main loop (we also register a daily 9am task as a belt-and-suspenders fallback).",
      },
      {
        label: "Playwright (Easy Apply, optional)",
        detail:
          "When ENABLE_EASY_APPLY=true, the bot drives a real Chromium window via Playwright (headed by default so you watch it). Only used for LinkedIn Easy Apply automation. ~150MB Chromium downloaded once. Off by default. See /easy-apply for the full algorithm.",
      },
      {
        label: "stdlib http.server",
        detail:
          "Review Queue web UI uses only Python's built-in HTTP server. No Flask, no FastAPI, no extra dependency surface. ~250 lines including the HTML.",
      },
      {
        label: "smtplib (stdlib)",
        detail:
          "Email sending uses Python's built-in SMTP client. Hardcoded to Gmail's STARTTLS endpoint. Cannot be reconfigured for a different provider.",
      },
    ],
  },
  {
    title: "2. Job discovery",
    blurb:
      "How the bot finds the 250+ jobs/day you see in your dashboard. All sources are public; all of them respect rate-limits and robots.txt.",
    bullets: [
      {
        label: "Playwright (LinkedIn)",
        detail:
          "Logged-in session using YOUR li_at cookie. Reads public job search pages only — never auto-applies, never sends messages, never opens connection requests.",
      },
      {
        label: "requests + BeautifulSoup",
        detail:
          "Plain HTTPS GET requests with a real browser User-Agent for Indeed, Bayt, NaukriGulf, GulfTalent, and ~40 company career pages. Throttled to ~1 page / 2 seconds per source.",
      },
      {
        label: "RemoteOK JSON feed",
        detail:
          "Uses the official public feed at remoteok.com/api.json. No HTML scraping, no auth.",
      },
      {
        label: "Per-country market plans",
        detail:
          "config/markets/*.json holds curated career pages + recruiter email patterns for UAE, Saudi, Qatar, Oman, Bahrain, UK, India. Easy to add a country by dropping a JSON file.",
      },
    ],
  },
  {
    title: "3. AI scoring + cover letters",
    blurb:
      "Optional. The bot works without AI; enabling it raises reply quality. We never call an AI without an explicit key in your .env.",
    bullets: [
      {
        label: "Google Gemini Flash",
        detail:
          "Primary model for AI match scoring (0–100) and tailored cover-letter drafting. ~$0/month on Google AI Studio's free tier for most usage. Falls back gracefully if quota exhausted.",
      },
      {
        label: "Groq (optional)",
        detail:
          "Optional Llama-3.3-70B fallback for if Gemini is down or you prefer it. Toggle via GROQ_API_KEY in .env.",
      },
      {
        label: "Hand-written templates",
        detail:
          "If no AI key is set, the bot uses curated jinja2 templates per category (PM, BA, etc.) with your résumé data merged in. Still personalised, just rule-based.",
      },
    ],
  },
  {
    title: "4. Email finding (the secret sauce)",
    blurb:
      "Recruiters rarely list their email on a job post. The bot has a 5-tier waterfall to find a verified address — and falls silent if no tier returns one with high confidence.",
    bullets: [
      {
        label: "Tier 0 — cache",
        detail:
          "Already-verified emails from previous cycles are reused without re-checking.",
      },
      {
        label: "Tier 1 — careers page scrape",
        detail:
          "Visits company.com/careers and parses for mailto: links. Highest precision; fully ToS-safe.",
      },
      {
        label: "Tier 2 — LinkedIn HR lookup",
        detail:
          "Uses your li_at cookie to find recruiter profiles on the job post and resolve their email via Hunter-style domain pattern matching. Quota-capped at 30 lookups/day.",
      },
      {
        label: "Tier 3 — country-aware patterns",
        detail:
          "Lowest precision. Tries common GCC patterns (careers@, hr@, jobs@) but only forwards an address if Tier 4 verifies it.",
      },
      {
        label: "Tier 4 — SMTP RCPT probe",
        detail:
          "Speaks SMTP to the candidate domain's MX server, asks 'do you accept mail for <address>?', and drops anything that fails. Results cached so we don't re-probe.",
      },
    ],
  },
  {
    title: "5. Marketing site (jobybots.com)",
    blurb:
      "Everything you see when you visit the website. Completely separate from the bot — the website never sees your data, the bot never connects to the website except for the once-per-cycle license check.",
    bullets: [
      {
        label: "Next.js 15 (App Router)",
        detail:
          "Server components for SEO, client components for interactivity. React 19. TypeScript strict mode.",
      },
      {
        label: "Tailwind CSS",
        detail:
          "Utility-first styling. Zero runtime CSS-in-JS overhead. ~30KB final stylesheet.",
      },
      {
        label: "Framer Motion",
        detail:
          "Used sparingly for the founder story and product tour. Respects prefers-reduced-motion.",
      },
      {
        label: "Vercel KV (Redis)",
        detail:
          "Stores customer accounts, payment orders, and machine-license bindings. Backed up nightly.",
      },
      {
        label: "scrypt (node:crypto)",
        detail:
          "Customer passwords stored with scrypt N=16384, r=8, p=1. Even with the KV dump, brute-force would cost ~$10k per password.",
      },
      {
        label: "Nodemailer + Gmail SMTP",
        detail:
          "Transactional emails (activation, rejection) use the same Gmail account the support team monitors. No SendGrid / Postmark / Mailgun — fewer vendors, smaller blast radius.",
      },
    ],
  },
  {
    title: "6. What we deliberately don't use",
    blurb:
      "Every dependency is a future security headache. Here&apos;s what we cut.",
    bullets: [
      {
        label: "No analytics SDK",
        detail:
          "No Google Analytics, no Mixpanel, no PostHog, no Plausible. We use Vercel's built-in deploy logs and that's it. You're not being tracked.",
      },
      {
        label: "No CDN third parties",
        detail:
          "All fonts, icons, and scripts are self-hosted. No Google Fonts, no jsDelivr, no FontAwesome. Page works offline once loaded.",
      },
      {
        label: "No payment processor on file",
        detail:
          "UPI payments are settled out-of-band with a screenshot upload. No Stripe, no Razorpay, no card numbers ever touch our infrastructure.",
      },
      {
        label: "No background services on your laptop",
        detail:
          "Only what you explicitly start. No system tray icon. No 'JobyBots Helper' lurking in Activity Monitor. Close the terminal window and the bot is gone.",
      },
    ],
  },
];

export default function TechnologyPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(techLd) }}
      />
      <article className="mx-auto max-w-5xl section-pad">
        <Reveal>
          <header className="mb-12 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
              Under the hood
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
              The technology, in plain English.
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-ink-muted">
              Every library, every service, every reason it&apos;s here.
              No black boxes. No tracking pixels. No surprises.
            </p>
          </header>
        </Reveal>

        <Reveal delay={1}>
          <div className="rounded-3xl border border-line bg-paper p-6 sm:p-8">
            <div className="grid gap-4 sm:grid-cols-3">
              <Stat label="Lines of Python (the bot)" value="~4 200" />
              <Stat label="Lines of TypeScript (the site)" value="~18 000" />
              <Stat label="Third-party servers your bot phones home to" value="0" />
            </div>
            <p className="mt-4 text-sm text-ink-muted">
              The bot makes exactly one network call to jobybots.com per cycle (license
              check). It cannot &mdash; by design &mdash; upload your résumé or sent emails.
            </p>
          </div>
        </Reveal>

        <div className="mt-12 space-y-10">
          {LAYERS.map((layer, i) => (
            <Reveal key={layer.title} delay={(Math.min(6, i + 1)) as 1 | 2 | 3 | 4 | 5 | 6}>
              <section className="rounded-3xl border border-line bg-paper p-6 sm:p-8">
                <h2 className="text-2xl font-bold tracking-tight">{layer.title}</h2>
                <p className="mt-2 text-ink-muted">{layer.blurb}</p>
                <ul className="mt-6 grid gap-4 sm:grid-cols-2">
                  {layer.bullets.map((b) => (
                    <li
                      key={b.label}
                      className="rounded-xl border border-line bg-bg-soft/40 p-4"
                    >
                      <h3 className="font-semibold tracking-tight">{b.label}</h3>
                      <p className="mt-1 text-sm text-ink-muted">{b.detail}</p>
                    </li>
                  ))}
                </ul>
              </section>
            </Reveal>
          ))}
        </div>

        <Reveal delay={6}>
          <section className="mt-12 rounded-3xl border border-ink/15 bg-ink p-8 text-paper">
            <h2 className="text-2xl font-bold">Read it yourself</h2>
            <p className="mt-2 text-paper/80">
              The entire bot is on GitHub. Clone it, audit it, fork it, run your own.
            </p>
            <div className="mt-5 flex flex-wrap gap-3 text-sm">
              <a
                href="https://github.com/muttonkodibiriyani/Jobybot"
                className="rounded-full bg-accent px-4 py-2 font-semibold text-white hover:bg-accent/90"
                target="_blank"
                rel="noopener noreferrer"
              >
                github.com/muttonkodibiriyani/Jobybot ↗
              </a>
              <Link
                href="/security"
                className="rounded-full border border-paper/40 bg-transparent px-4 py-2 font-semibold text-paper hover:border-paper"
              >
                Security model →
              </Link>
              <Link
                href="/trust"
                className="rounded-full border border-paper/40 bg-transparent px-4 py-2 font-semibold text-paper hover:border-paper"
              >
                Bot boundaries →
              </Link>
            </div>
          </section>
        </Reveal>
      </article>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-bg-soft/40 p-4 text-center">
      <p className="text-3xl font-bold tabular-nums tracking-tight">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-wider text-ink-muted">{label}</p>
    </div>
  );
}
