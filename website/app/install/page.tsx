import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { MotionMagnet } from "@/components/MotionFade";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://jobybots.com";

export const metadata: Metadata = {
  title: "Install JobyBots in 5 minutes · Windows + macOS visual guide",
  description:
    "A photoreal, step-by-step walkthrough of installing JobyBots on Windows or macOS — from the email that arrives after you pay, to the first recruiter replies five days later. No jargon, no IT skills needed. Use the /setup wizard to generate your config in your browser without us ever seeing your credentials.",
  alternates: { canonical: `${SITE_URL}/install` },
  openGraph: {
    title: "Install JobyBots — the 10-step visual walkthrough",
    description:
      "Photoreal screens of every step: email, ZIP, setup wizard, health check, scheduler, dashboard, first replies. Take a look before you buy.",
    url: `${SITE_URL}/install`,
    type: "article",
    images: [
      {
        url: `${SITE_URL}/install-storyboard/install-10-replies.png`,
        width: 1024,
        height: 683,
        alt: "Six recruiter replies in five days — the result of installing JobyBots",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Install JobyBots — 10-step visual walkthrough",
    description:
      "From paid email to first recruiter reply, in 10 photoreal frames.",
    images: [`${SITE_URL}/install-storyboard/install-10-replies.png`],
  },
};

type Step = {
  n: string;
  title: string;
  caption: string;
  alt: string;
  src: string;
};

const STEPS: Step[] = [
  {
    n: "01",
    title: "Your installer arrives in Gmail",
    caption:
      "Right after you pay (Stripe or UPI), an email lands in your inbox with your license key and a one-click download link. ZIP is ~80 MB and signed with your name.",
    alt: "Gmail inbox open on a laptop showing the JobyBots Pro installer email with an orange download button",
    src: "/install-storyboard/install-01-email.png",
  },
  {
    n: "02",
    title: "Unzip — 13 friendly .bat files",
    caption:
      "Drag the ZIP to Desktop, right-click → Extract. You'll see thirteen plainly-named files: JOBYBOT.bat (the menu), RUN_BOT_NOW.bat (one cycle), START_AUTOSCHEDULE.bat (24/7), and friends. Each one is a single double-click.",
    alt: "Windows 11 File Explorer showing the JobyBot-Pro folder with thirteen .bat files clearly visible",
    src: "/install-storyboard/install-02-extract.png",
  },
  {
    n: "03",
    title: "Windows asks once — click Run anyway",
    caption:
      "Because we're an indie tool, Microsoft's SmartScreen shows a one-time warning. Click More info → Run anyway. This happens exactly once. From then on, Windows trusts JobyBots forever.",
    alt: "Windows SmartScreen dialog with More info link and Run anyway button highlighted in orange",
    src: "/install-storyboard/install-03-smartscreen.png",
  },
  {
    n: "04",
    title: "Setup wizard asks five questions",
    caption:
      "A friendly terminal wizard walks you through five questions: your resume path, Gmail address (App Password, not your normal password), Gemini API key (free from Google AI Studio), your target roles, and your cities. Total time: about two minutes.",
    alt: "Windows PowerShell terminal showing the JobyBots installer wizard asking for the resume path",
    src: "/install-storyboard/install-04-wizard.png",
  },
  {
    n: "05",
    title: "Health check — every green tick",
    caption:
      "Before anything sends, JobyBots tests: Python venv, your resume parses, Gmail SMTP login works, Gemini API key responds, the database initialises, the daily cap is set. Six green checks. If anything fails, the wizard tells you exactly what to fix.",
    alt: "Terminal showing six green check marks confirming JobyBots is fully verified and ready",
    src: "/install-storyboard/install-05-verify.png",
  },
  {
    n: "06",
    title: "Scheduled. Running. 24/7.",
    caption:
      "Two soft Windows notifications confirm: the scheduler is running in the background, and JobyBots will auto-start every time you sign in. The live dashboard opens in your browser. You can close every window — the bot keeps going.",
    alt: "Windows 11 desktop showing JobyBots notifications confirming the scheduler is running 24/7",
    src: "/install-storyboard/install-06-scheduled.png",
  },
  {
    n: "07",
    title: "One menu. Eighteen one-key actions.",
    caption:
      "Need to stop the bot? Press 3. Want to see today's stats? Press 6. Send a test email? Press 13. The control center is one screen with eighteen colour-coded actions, grouped by intent. No command-line knowledge required.",
    alt: "JOBYBOT Control Center terminal showing 18 menu options grouped into four categories",
    src: "/install-storyboard/install-07-menu.png",
  },
  {
    n: "08",
    title: "How the .bat files connect",
    caption:
      "Six files, one mental model. JOBYBOT.bat is the front door. Behind it: START_AUTOSCHEDULE for 24/7 mode, RUN_BOT_NOW for ad-hoc cycles, SETUP_FOR_FRIENDS for first install, DASHBOARD for stats, CHECK_BOUNCES for IMAP sync. Everything routes through the same Python cycle: search → score → email.",
    alt: "Flow diagram showing how six JobyBots .bat files connect into one workflow",
    src: "/install-storyboard/install-08-interconnect.png",
  },
  {
    n: "09",
    title: "Live dashboard, refreshes every 15s",
    caption:
      "Open the dashboard whenever you want — it shows jobs found, emails sent, bounces (target: zero), recruiter replies, plus an hourly chart. Recent sends appear on the right with company logos and a green delivered pill.",
    alt: "JobyBots live dashboard showing 47 jobs found, 38 emails sent, 0 bounces, 6 replies",
    src: "/install-storyboard/install-09-dashboard.png",
  },
  {
    n: "10",
    title: "Five days later — six recruiter replies",
    caption:
      "This is the whole product. While you slept, JobyBots searched, scored, wrote and sent personalised emails to the right people. The replies that come back are real conversations — yours to take from here.",
    alt: "Gmail inbox showing six recruiter replies five days after starting JobyBots",
    src: "/install-storyboard/install-10-replies.png",
  },
];

const howToLd = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "Install JobyBots on Windows",
  description:
    "A 10-step visual walkthrough of installing JobyBots — from the email that arrives after payment to the first recruiter replies five days later.",
  totalTime: "PT5M",
  estimatedCost: { "@type": "MonetaryAmount", currency: "INR", value: "2999" },
  supply: [
    { "@type": "HowToSupply", name: "Windows 10 or 11 PC" },
    { "@type": "HowToSupply", name: "Gmail account with App Password" },
    { "@type": "HowToSupply", name: "Free Gemini API key from Google AI Studio" },
    { "@type": "HowToSupply", name: "Your resume as PDF" },
  ],
  step: STEPS.map((s) => ({
    "@type": "HowToStep",
    name: s.title,
    text: s.caption,
    image: `${SITE_URL}${s.src}`,
  })),
};

export default function InstallPage() {
  return (
    <main className="bg-gradient-to-b from-white via-cream to-white">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToLd) }}
      />

      <section className="mx-auto max-w-4xl px-6 pt-20 pb-12">
        <Reveal>
          <p className="text-sm font-semibold uppercase tracking-widest text-accent-strong">
            Install in 5 minutes
          </p>
        </Reveal>
        <Reveal delay={1}>
          <h1 className="mt-4 text-4xl sm:text-5xl font-bold text-ink tracking-tight">
            From payment to recruiter reply — in ten doors.
          </h1>
        </Reveal>
        <Reveal delay={2}>
          <p className="mt-6 text-lg text-slate-700 leading-relaxed">
            Every step you'll see happens on{" "}
            <strong>your own computer</strong>. Nothing is uploaded to a server.
            Your resume, your Gmail, your API key — they live in your folder, not ours.
            This page is the honest walkthrough of every screen, with no marketing fluff.
          </p>
        </Reveal>
        <Reveal delay={3}>
          <div className="mt-8 flex flex-wrap gap-4">
            <MotionMagnet>
              <Link
                href="/buy-india"
                aria-label="Buy JobyBots for two thousand nine hundred ninety nine rupees and start installing"
                className="inline-flex rounded-full bg-accent px-6 py-3 text-base font-semibold text-white shadow-lg shadow-accent/30 hover:bg-accent-strong transition"
              >
                Buy now — install in 5 minutes
              </Link>
            </MotionMagnet>
            <MotionMagnet>
              <Link
                href="/setup"
                aria-label="Open the configuration wizard"
                className="inline-flex rounded-full border border-slate-300 px-6 py-3 text-base font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Open setup wizard →
              </Link>
            </MotionMagnet>
            <MotionMagnet>
              <Link
                href="/security"
                aria-label="Read the JobyBots security explanation"
                className="inline-flex rounded-full border border-slate-300 px-6 py-3 text-base font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Why are .bat / .command safe?
              </Link>
            </MotionMagnet>
          </div>
        </Reveal>

        {/* OS PICKER */}
        <Reveal delay={4}>
          <div className="mt-12 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Pick your platform
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <a
                href="#windows"
                className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 transition hover:border-accent hover:bg-cream"
              >
                <p className="text-xs font-mono uppercase tracking-[0.18em] text-slate-500">
                  Windows 10 / 11
                </p>
                <p className="mt-1 text-base font-semibold text-ink">
                  Run <code>SETUP_FOR_FRIENDS.bat</code>
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  10-step photoreal walkthrough below.
                </p>
              </a>
              <a
                href="#macos"
                className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 transition hover:border-accent hover:bg-cream"
              >
                <p className="text-xs font-mono uppercase tracking-[0.18em] text-slate-500">
                  macOS 12+ (Intel + Apple Silicon)
                </p>
                <p className="mt-1 text-base font-semibold text-ink">
                  Run <code>mac/Setup.command</code>
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  6 double-click files, full launchd scheduling.
                </p>
              </a>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="mx-auto max-w-4xl px-6 pb-2" id="windows">
        <Reveal>
          <p className="text-xs font-mono uppercase tracking-[0.22em] text-accent-strong">
            Windows install · 10 photoreal steps
          </p>
        </Reveal>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-24">
        <ol className="space-y-24">
          {STEPS.map((step, idx) => (
            <Reveal key={step.n} as="li" delay={(idx % 3) as 0 | 1 | 2}>
              <article className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                <div
                  className={
                    idx % 2 === 0
                      ? "md:col-span-7 md:order-1"
                      : "md:col-span-7 md:order-2"
                  }
                >
                  <div className="rounded-2xl overflow-hidden ring-1 ring-slate-200/70 shadow-2xl shadow-slate-900/10">
                    <Image
                      src={step.src}
                      alt={step.alt}
                      width={1024}
                      height={683}
                      sizes="(min-width: 768px) 640px, 100vw"
                      priority={idx === 0}
                      className="w-full h-auto"
                    />
                  </div>
                </div>
                <div
                  className={
                    idx % 2 === 0
                      ? "md:col-span-5 md:order-2"
                      : "md:col-span-5 md:order-1"
                  }
                >
                  <p className="text-5xl font-bold text-accent-strong tabular-nums">
                    {step.n}
                  </p>
                  <h2 className="mt-3 text-2xl sm:text-3xl font-bold text-ink tracking-tight">
                    {step.title}
                  </h2>
                  <p className="mt-4 text-base text-slate-700 leading-relaxed">
                    {step.caption}
                  </p>
                </div>
              </article>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* ─── macOS section ───────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-6 pb-16" id="macos">
        <Reveal>
          <div className="rounded-3xl border border-slate-200 bg-white p-8 sm:p-12 shadow-2xl shadow-slate-900/5">
            <p className="text-xs font-mono uppercase tracking-[0.22em] text-accent-strong">
              macOS install · 6 double-click files
            </p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-ink tracking-tight">
              Same flow, native on Mac.
            </h2>
            <p className="mt-4 text-base text-slate-700 leading-relaxed">
              The Mac package is the same JobyBots brain with macOS-native
              entry points. Six <code>.command</code> files in a{" "}
              <code>mac/</code> subfolder, a <code>launchd</code>{" "}
              <code>.plist</code> for 24/7 scheduling, and a friendly{" "}
              <code>Setup.command</code> that walks you through Python,
              dependencies, configuration, and a Gmail+Gemini health check.
              Tested on macOS 12 Monterey, 13 Ventura, 14 Sonoma and 15
              Sequoia. Works on Intel Macs and Apple Silicon (M1 / M2 / M3 /
              M4).
            </p>

            <ol className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                {
                  n: "01",
                  title: "Download the JobyBots-Mac.zip",
                  body: "Your purchase email contains a Mac ZIP. Drag to Desktop, double-click to extract.",
                },
                {
                  n: "02",
                  title: "Right-click → Open on Setup.command",
                  body: "macOS asks once because we're an indie tool. Right-click → Open → Open. Happens once. From then on Mac trusts JobyBots.",
                },
                {
                  n: "03",
                  title: "Setup walks you through Python + .env",
                  body: "Detects Python 3.10+ (offers Homebrew if missing), creates .venv, installs libraries, opens .env in TextEdit.",
                },
                {
                  n: "04",
                  title: "Drop your résumé.pdf in the folder",
                  body: "JobyBots auto-detects the first PDF and reads it as your résumé. Locked to chmod 600 (owner-only).",
                },
                {
                  n: "05",
                  title: "Health check — green ticks",
                  body: "Gmail SMTP test. Gemini API test. SQLite init. Daily cap set. Six green checks → ready.",
                },
                {
                  n: "06",
                  title: "Double-click StartAutoSchedule.command",
                  body: "Installs a launchd agent in ~/Library/LaunchAgents. Bot runs every 30 min, even when you log out.",
                },
                {
                  n: "07",
                  title: "Use the JobyBot.command menu",
                  body: "Front-door menu — run a cycle, open the dashboard, edit settings, view logs. All from one terminal screen.",
                },
                {
                  n: "08",
                  title: "Watch live in the browser",
                  body: "Dashboard.command opens data/dashboard.html — auto-refreshes every 15 seconds while a cycle is running.",
                },
              ].map((s, i) => (
                <Reveal
                  key={s.n}
                  as="li"
                  delay={Math.min(4, (i % 4) + 1) as 1 | 2 | 3 | 4}
                  className="rounded-2xl border border-slate-100 bg-slate-50 p-5"
                >
                  <p className="font-display text-2xl font-bold text-accent-strong tabular-nums">
                    {s.n}
                  </p>
                  <p className="mt-2 font-display text-base font-semibold text-ink">
                    {s.title}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-700">
                    {s.body}
                  </p>
                </Reveal>
              ))}
            </ol>

            {/* Mac uninstall + scheduling reference */}
            <div className="mt-10 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-cream p-5 ring-1 ring-amber-100">
                <p className="text-xs font-mono uppercase tracking-[0.18em] text-accent-strong">
                  Useful Mac commands
                </p>
                <ul className="mt-3 space-y-1 text-xs font-mono text-slate-800">
                  <li>tail -f data/jobybot_launchd.log</li>
                  <li>launchctl list | grep jobybots</li>
                  <li>launchctl unload ~/Library/LaunchAgents/com.jobybots.scheduler.plist</li>
                </ul>
              </div>
              <div className="rounded-2xl bg-cream p-5 ring-1 ring-amber-100">
                <p className="text-xs font-mono uppercase tracking-[0.18em] text-accent-strong">
                  Uninstall = drag to Trash
                </p>
                <p className="mt-3 text-xs leading-relaxed text-slate-800">
                  1) Double-click <code>StopBot.command</code> (removes the
                  scheduler).<br />
                  2) Drag the <code>JobyBots-Pro</code> folder to Trash.<br />
                  3) That's it. Nothing else lives on your system.
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/setup"
                className="inline-flex rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white hover:bg-ink-soft transition"
              >
                Build my .env in the browser →
              </Link>
              <Link
                href="/security"
                className="inline-flex rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Why this is safe →
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-24">
        <Reveal>
          <div className="rounded-2xl bg-gradient-to-br from-accent to-accent-strong p-10 text-white shadow-2xl shadow-accent/30">
            <p className="text-sm font-semibold uppercase tracking-widest opacity-80">
              The promise
            </p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight">
              If you can double-click a file, you can run JobyBots.
            </h2>
            <p className="mt-6 text-lg leading-relaxed opacity-95">
              No subscriptions, no servers, no surveillance.
              Your data stays on your machine.
              Five minutes to install. Twenty-four hours to your first batch
              of personalised emails. A week to your first real conversation.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/buy-india"
                aria-label="Buy JobyBots and start your install"
                className="rounded-full bg-white px-6 py-3 text-base font-semibold text-accent-strong hover:bg-cream transition"
              >
                Get JobyBots — ₹2,999 lifetime
              </Link>
              <Link
                href="/faq"
                aria-label="Read frequently asked questions about installing JobyBots"
                className="rounded-full border border-white/70 px-6 py-3 text-base font-semibold text-white hover:bg-white/10 transition"
              >
                Read the install FAQ
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
