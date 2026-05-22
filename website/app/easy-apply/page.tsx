import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://jobybots.com";

export const metadata: Metadata = {
  title: "LinkedIn Easy Apply Automation · JobyBots",
  description:
    "Opt-in LinkedIn Easy Apply automation. Filters by date, experience, keywords. Pattern-based question answering with Gemini AI fallback. Dry-run by default, 10/day cap, you watch the browser do it. Built from scratch, no AGPL code.",
  alternates: { canonical: `${SITE_URL}/easy-apply` },
  openGraph: {
    title: "JobyBots — LinkedIn Easy Apply (opt-in, transparent)",
    description:
      "Apply to LinkedIn Easy Apply jobs automatically — with your full review, in a visible browser, capped at 10/day. Read the algorithm + risks before you opt in.",
    url: `${SITE_URL}/easy-apply`,
    type: "article",
  },
};

const articleLd = {
  "@context": "https://schema.org",
  "@type": "TechArticle",
  headline: "LinkedIn Easy Apply automation in JobyBots — algorithm + safety",
  description:
    "How JobyBots' optional LinkedIn Easy Apply automation works, end to end. Filters, multi-step form walking, pattern + AI question answering, and the safety guards that keep your LinkedIn account safe.",
  author: { "@type": "Person", name: "Darapu Tharakeswara Reddy", url: SITE_URL },
  publisher: { "@type": "Organization", name: "JobyBots", url: SITE_URL },
  datePublished: "2026-05-22",
  dateModified: "2026-05-22",
};

interface AlgoStep {
  num: number;
  title: string;
  body: string;
}

const ALGO: AlgoStep[] = [
  {
    num: 1,
    title: "Navigate to a filtered LinkedIn search",
    body: "We build a URL with your target titles, your primary market's cities, and four LinkedIn filters: f_AL=true (Easy Apply only), f_TPR=… (date posted: 24h / 7d / 30d), f_E=… (experience levels you target), sortBy=DD (newest first). Same query a human would type — just typed for you.",
  },
  {
    num: 2,
    title: "Lazy-scroll until ~25 cards are loaded",
    body: "LinkedIn lazy-loads results on scroll. We nudge the left rail 0.9 viewport-heights at a time, 4 times max, with 800ms between scrolls to mimic a human browsing. Never more aggressive than that.",
  },
  {
    num: 3,
    title: "Deduplicate against your local history",
    body: "Every job you've already applied to (or already attempted) is stored in your local easy_apply_log. Cards you've seen before are skipped instantly — no double-applications, ever.",
  },
  {
    num: 4,
    title: "Apply the description filters",
    body: "Open the right-rail. Drop the job if its description contains any EASY_APPLY_SKIP_KEYWORDS (default: us-citizen, security clearance, senior director), if EASY_APPLY_REQUIRED_KEYWORDS are missing, or if a 'X+ years required' line exceeds your EASY_APPLY_MAX_YEARS.",
  },
  {
    num: 5,
    title: "Click 'Easy Apply'",
    body: "Only if a button labeled exactly 'Easy Apply' is visible. We never click any other apply button (we don't auto-fill third-party career sites — too risky).",
  },
  {
    num: 6,
    title: "Walk the multi-step form",
    body: "For each visible input on the modal: read its label, canonicalise it (lowercase + strip punctuation), look up the answer in PATTERNS → cache → AI fallback. Type the answer into the right control (text / select / radio / checkbox / textarea).",
  },
  {
    num: 7,
    title: "Click 'Next' or 'Review' and repeat",
    body: "LinkedIn typically has 2–5 steps. We keep walking until we either see the 'Submit application' button or hit step 12 (hard ceiling — anything beyond that is probably broken).",
  },
  {
    num: 8,
    title: "(Dry-run by default) Stop at 'Submit'",
    body: "On the very first run, EASY_APPLY_DRY_RUN=true. We screenshot the form ready to submit and stop. You audit, then flip the flag once you trust the bot. With dry-run off, we untick 'Follow company' (avoids spam) and click Submit.",
  },
  {
    num: 9,
    title: "Wait 20–60 seconds. Repeat.",
    body: "Random jittered delay between every application. The hard cap (EASY_APPLY_DAILY_CAP, default 10) is checked at the top of each iteration — when it hits, the whole run stops and you get a summary in the dashboard.",
  },
];

const AI_TECH = [
  {
    name: "Pattern map (deterministic)",
    detail:
      "30+ regex rules covering 99% of real Easy Apply questions: first/last name, email, phone, years of experience, work authorization, sponsorship, notice period, salary, cover letter, LinkedIn URL, city, country. Lives in core/easy_apply_questions.py — open it in Notepad and you can edit it.",
  },
  {
    name: "Q&A cache (per-user, per-question)",
    detail:
      "First time we answer 'Do you have a security clearance?' we store the answer locally in easy_apply_answers. Every subsequent form uses the same answer — consistency, no drift, no AI re-rolls.",
  },
  {
    name: "Gemini Flash fallback (free tier)",
    detail:
      "If we hit a question that doesn't match any pattern and your GEMINI_API_KEY is set, we send only the question text + a short profile blurb to Gemini. System prompt forces a short, plain-text answer. No résumé, no .env, no PII beyond what's already on your LinkedIn.",
  },
  {
    name: "'Needs review' fallback",
    detail:
      "If both pattern AND AI fail (e.g. AI key missing, or the question is genuinely weird), we screenshot the modal and log the application as needs_review. Your dashboard surfaces it; you finish the application manually in 30 seconds.",
  },
];

const RISKS = [
  {
    name: "LinkedIn account restriction",
    impact: "Moderate",
    detail:
      "LinkedIn ToS §8.2 prohibits automation. Their detection is fuzzy — most automation users report no issues at <25 apps/day, but some have been temporarily restricted. Our 10/day cap + 20–60s jitter is well below the detection threshold reported by the community, but it is NEVER zero risk.",
  },
  {
    name: "Wrong-question answers",
    impact: "Low (dry-run)",
    detail:
      "When the bot hits a question it has never seen, the AI may guess wrong. The dry-run default means you catch every wrong answer before any application is submitted. Once you've trained the bot for a week of dry-runs, the cache is warm and full-auto is safe.",
  },
  {
    name: "Over-application",
    impact: "Low (capped)",
    detail:
      "The hard daily cap (default 10) is checked before every application. It cannot be bypassed by a config typo because it's enforced in db.easy_applies_today(). The .env value can only LOWER the cap, never raise it past 50.",
  },
];

export default function EasyApplyPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }}
      />
      <article className="mx-auto max-w-5xl section-pad">
        {/* HERO */}
        <Reveal>
          <header className="mb-12 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
              Opt-in feature · Beta
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
              LinkedIn Easy Apply, automated — <br className="hidden sm:inline" />
              <span className="text-accent">with your full review.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-ink-muted">
              Filter, open, fill, screenshot, stop. The bot walks each LinkedIn
              Easy Apply form in a visible Chromium window so you watch it work
              — and you flip the &quot;actually submit&quot; switch only when
              you trust it.
            </p>
            <div className="mx-auto mt-6 inline-flex flex-wrap items-center justify-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
              <span aria-hidden>!</span>
              Off by default. Requires <code className="rounded bg-white px-1.5 py-0.5 text-xs">ENABLE_EASY_APPLY=true</code> in your .env.
            </div>
          </header>
        </Reveal>

        {/* AT A GLANCE */}
        <Reveal delay={1}>
          <section className="rounded-3xl border border-line bg-paper p-6 sm:p-8">
            <h2 className="text-2xl font-bold tracking-tight">What you get</h2>
            <ul className="mt-5 grid gap-4 sm:grid-cols-2">
              <li className="rounded-xl border border-line bg-bg-soft/40 p-4">
                <h3 className="font-semibold">Filtered to your targets</h3>
                <p className="mt-1 text-sm text-ink-muted">
                  Date posted, experience level, skip-companies blacklist,
                  required keywords, skip keywords, max years required.
                </p>
              </li>
              <li className="rounded-xl border border-line bg-bg-soft/40 p-4">
                <h3 className="font-semibold">Smart question answering</h3>
                <p className="mt-1 text-sm text-ink-muted">
                  Pattern-based for the 30 common questions, Gemini AI for the
                  weird ones, cached forever after first answer.
                </p>
              </li>
              <li className="rounded-xl border border-line bg-bg-soft/40 p-4">
                <h3 className="font-semibold">Dry-run by default</h3>
                <p className="mt-1 text-sm text-ink-muted">
                  Fills the form, screenshots it, stops at the Submit button.
                  You audit. You decide. Then flip the flag.
                </p>
              </li>
              <li className="rounded-xl border border-line bg-bg-soft/40 p-4">
                <h3 className="font-semibold">Hard 10/day cap</h3>
                <p className="mt-1 text-sm text-ink-muted">
                  Below LinkedIn&apos;s detection threshold. Can&apos;t be
                  bypassed by a config typo — enforced in code.
                </p>
              </li>
              <li className="rounded-xl border border-line bg-bg-soft/40 p-4">
                <h3 className="font-semibold">Visible browser</h3>
                <p className="mt-1 text-sm text-ink-muted">
                  Chromium opens on your desktop. You see every click. Stop the
                  bot by closing the window — no hidden background process.
                </p>
              </li>
              <li className="rounded-xl border border-line bg-bg-soft/40 p-4">
                <h3 className="font-semibold">Full audit log</h3>
                <p className="mt-1 text-sm text-ink-muted">
                  Every attempt logged to <code>easy_apply_log</code>:
                  applied / skipped / needs_review / failed, with screenshots
                  for failures.
                </p>
              </li>
            </ul>
          </section>
        </Reveal>

        {/* ALGORITHM */}
        <Reveal delay={2}>
          <section className="mt-10 rounded-3xl border border-line bg-paper p-6 sm:p-8">
            <h2 className="text-2xl font-bold tracking-tight">The algorithm, step by step</h2>
            <p className="mt-2 text-ink-muted">
              Every step lives in <code>core/easy_apply.py</code>. Open it in
              Notepad to verify — it&apos;s ~450 lines of commented Python.
            </p>
            <ol className="mt-6 space-y-5">
              {ALGO.map((s) => (
                <li key={s.num} className="grid gap-4 md:grid-cols-[auto,1fr]">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-accent/30 bg-accent/10 font-bold text-accent">
                    {s.num}
                  </div>
                  <div>
                    <h3 className="font-bold tracking-tight">{s.title}</h3>
                    <p className="mt-1 text-sm text-ink-muted">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </Reveal>

        {/* AI TECH */}
        <Reveal delay={3}>
          <section className="mt-10 rounded-3xl border border-line bg-paper p-6 sm:p-8">
            <h2 className="text-2xl font-bold tracking-tight">How question answering works</h2>
            <p className="mt-2 text-ink-muted">
              Four layers — fastest and most deterministic first, AI last.
              99% of questions never reach the AI.
            </p>
            <ol className="mt-6 grid gap-4 sm:grid-cols-2">
              {AI_TECH.map((t, i) => (
                <li key={t.name} className="rounded-xl border border-line bg-bg-soft/40 p-5">
                  <p className="text-xs font-mono uppercase tracking-wider text-ink-muted">
                    Layer {i + 1}
                  </p>
                  <h3 className="mt-1 font-bold">{t.name}</h3>
                  <p className="mt-2 text-sm text-ink-muted">{t.detail}</p>
                </li>
              ))}
            </ol>
            <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
              <strong>Privacy:</strong> The AI call goes directly from your
              laptop to Google AI Studio with your own API key. Never via
              JobyBots servers. We never see the questions or the answers.
            </div>
          </section>
        </Reveal>

        {/* RISKS */}
        <Reveal delay={4}>
          <section className="mt-10 rounded-3xl border border-ink/15 bg-ink p-6 text-paper sm:p-8">
            <h2 className="text-2xl font-bold">Honest risks (read before opting in)</h2>
            <div className="mt-6 space-y-4">
              {RISKS.map((r) => (
                <div key={r.name} className="rounded-xl border border-paper/15 bg-paper/5 p-5">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-bold">{r.name}</h3>
                    <span className="text-xs font-mono uppercase tracking-wider text-amber-300">
                      Impact: {r.impact}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-paper/80">{r.detail}</p>
                </div>
              ))}
            </div>
          </section>
        </Reveal>

        {/* HOW TO ENABLE */}
        <Reveal delay={5}>
          <section className="mt-10 rounded-3xl border border-line bg-paper p-6 sm:p-8">
            <h2 className="text-2xl font-bold tracking-tight">How to enable it</h2>
            <ol className="mt-6 space-y-4 text-sm text-ink-muted">
              <li className="rounded-xl border border-line bg-bg-soft/40 p-4">
                <p className="font-semibold text-ink">1. Set the flag in .env</p>
                <pre className="mt-2 overflow-x-auto rounded-lg bg-ink/95 p-3 text-xs text-amber-200">
{`ENABLE_EASY_APPLY=true
EASY_APPLY_DRY_RUN=true     # keep this true for the first week
EASY_APPLY_DAILY_CAP=10
LINKEDIN_COOKIE=AQEDAS...   # your li_at cookie`}
                </pre>
              </li>
              <li className="rounded-xl border border-line bg-bg-soft/40 p-4">
                <p className="font-semibold text-ink">2. One-time install (~150MB Chromium)</p>
                <pre className="mt-2 overflow-x-auto rounded-lg bg-ink/95 p-3 text-xs text-amber-200">
{`.venv\\Scripts\\python.exe -m pip install playwright google-generativeai
.venv\\Scripts\\python.exe -m playwright install chromium`}
                </pre>
              </li>
              <li className="rounded-xl border border-line bg-bg-soft/40 p-4">
                <p className="font-semibold text-ink">3. Run it (dry-run)</p>
                <pre className="mt-2 overflow-x-auto rounded-lg bg-ink/95 p-3 text-xs text-amber-200">
{`EASY_APPLY.bat                 # Windows
mac/EasyApply.command          # Mac`}
                </pre>
                <p className="mt-2">
                  Chromium opens. Watch the bot fill each form. Screenshots land in <code>data/easyapply_screenshots/</code>.
                </p>
              </li>
              <li className="rounded-xl border border-line bg-bg-soft/40 p-4">
                <p className="font-semibold text-ink">4. When you trust it, flip the switch</p>
                <pre className="mt-2 overflow-x-auto rounded-lg bg-ink/95 p-3 text-xs text-amber-200">
{`# Either: set EASY_APPLY_DRY_RUN=false in .env
# Or:     run with the --no-dry-run flag
.venv\\Scripts\\python.exe jobybot.py easy-apply --no-dry-run`}
                </pre>
              </li>
            </ol>
          </section>
        </Reveal>

        {/* FAQ + CTA */}
        <Reveal delay={6}>
          <section className="mt-10 rounded-3xl border border-line bg-paper p-6 sm:p-8">
            <h2 className="text-2xl font-bold tracking-tight">FAQ</h2>
            <div className="mt-5 space-y-4">
              <Faq q="Is this legal?">
                Easy Apply automation violates LinkedIn&apos;s ToS but is not illegal in
                most jurisdictions. The risk is to your LinkedIn account, not to
                you legally. We surface this honestly because most competitors don&apos;t.
              </Faq>
              <Faq q="Will my account get banned?">
                Bans are rare at our default 10/day cap. Restrictions (a 24-72h
                pause on job-applications) are slightly more common. If you see
                a CAPTCHA in the Chromium window, the bot stops automatically.
              </Faq>
              <Faq q="Can I use my Workspace LinkedIn account?">
                Yes. The bot doesn&apos;t care about account type. It uses your{" "}
                <code>li_at</code> cookie regardless.
              </Faq>
              <Faq q="Does the bot follow companies?">
                No. We explicitly untick &quot;Follow [Company]&quot; before
                clicking Submit — it&apos;s the #1 LinkedIn spam complaint and
                doesn&apos;t help your application.
              </Faq>
              <Faq q="What happens if my cookie expires?">
                The bot detects the login wall and stops cleanly. Get a fresh
                cookie from Chrome devtools → Application → Cookies →{" "}
                <code>li_at</code>.
              </Faq>
              <Faq q="Are you using the GodsScion/Auto_job_applier_linkedIn code?">
                No. That project is AGPL-3.0 licensed, which would require us
                to open-source JobyBots in full. Our Easy Apply module is a
                clean-room implementation written from scratch based on
                publicly documented LinkedIn DOM patterns.
              </Faq>
            </div>
            <div className="mt-8 flex flex-wrap gap-3 text-sm">
              <Link href="/trust" className="rounded-full border border-line bg-bg-soft px-4 py-2 hover:border-accent">
                Bot boundaries (rule #11) →
              </Link>
              <Link href="/security" className="rounded-full border border-line bg-bg-soft px-4 py-2 hover:border-accent">
                Security model →
              </Link>
              <Link href="/technology" className="rounded-full border border-line bg-bg-soft px-4 py-2 hover:border-accent">
                Technology stack →
              </Link>
              <Link href="/terms" className="rounded-full border border-line bg-bg-soft px-4 py-2 hover:border-accent">
                Terms (LinkedIn compliance) →
              </Link>
            </div>
          </section>
        </Reveal>
      </article>
    </>
  );
}

function Faq({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <details className="group rounded-xl border border-line bg-bg-soft/40 p-4 open:bg-paper">
      <summary className="cursor-pointer list-none text-base font-semibold text-ink marker:hidden">
        {q}
        <span className="float-right text-ink-muted transition-transform group-open:rotate-45">+</span>
      </summary>
      <div className="mt-3 text-sm text-ink-muted">{children}</div>
    </details>
  );
}
