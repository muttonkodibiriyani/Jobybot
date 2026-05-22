import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://jobybots.com";

export const metadata: Metadata = {
  title: "Security · Why .bat and .command files are safe in JobyBots",
  description:
    "An honest, plain-English explanation of how JobyBots protects your data. Local-first architecture, no telemetry, every script readable in Notepad, SHA-256 verification, and what we explicitly do NOT do. Read every line of every installer before running it.",
  alternates: { canonical: `${SITE_URL}/security` },
  openGraph: {
    title: "JobyBots — Security & honesty page",
    description:
      "We never see your Gmail password, Gemini key, or résumé. Here's exactly why, in plain English.",
    url: `${SITE_URL}/security`,
    type: "article",
  },
};

const securityLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Why JobyBots .bat and .command installers are safe",
  description:
    "A plain-English explanation of JobyBots' local-first security model — no servers, no telemetry, every line of every installer script auditable.",
  author: {
    "@type": "Person",
    name: "Darapu Tharakeswara Reddy",
    url: SITE_URL,
  },
  publisher: {
    "@type": "Organization",
    name: "JobyBots",
    url: SITE_URL,
  },
  datePublished: "2026-05-21",
  dateModified: "2026-05-21",
};

const RED_FLAGS_OTHER_TOOLS = [
  "Asks for your raw Gmail password (not an App Password)",
  "Wants admin / sudo / UAC privileges to install",
  "Has obfuscated or compiled installers (no readable source)",
  "Sends your résumé to a server you never agreed to",
  "Mines your contacts or imports your LinkedIn connections",
  "Auto-updates without your permission",
  "Phones home with telemetry on every action",
];

const WHAT_JOBYBOTS_DOES = [
  {
    icon: "→",
    title: "Reads files YOU put there",
    body: "Reads your résumé PDF and the .env file you saved into the JobyBots folder. Never touches anything else on your disk.",
  },
  {
    icon: "→",
    title: "Talks to public job boards",
    body: "HTTPS GET requests to LinkedIn, Bayt, Naukrigulf, GulfTalent, Indeed, RemoteOK and ~40 company career pages. Same traffic your browser makes when you visit them.",
  },
  {
    icon: "→",
    title: "Sends mail through YOUR Gmail",
    body: "Authenticated SMTP connection to smtp.gmail.com:587 using the App Password you generated in your Google account. Replies land in your own inbox.",
  },
  {
    icon: "→",
    title: "Calls Google Gemini",
    body: "HTTPS calls to generativelanguage.googleapis.com using the free API key you generated in Google AI Studio.",
  },
  {
    icon: "→",
    title: "Writes back to ./data/",
    body: "Stores the SQLite tracker, dashboard.html, and run logs in a data/ subfolder inside JobyBots. Nothing escapes that folder.",
  },
];

const WHAT_JOBYBOTS_DOES_NOT_DO = [
  "Ask for admin / sudo / UAC at any point",
  "Read or modify files outside the JobyBots folder",
  "Install drivers, services, browser extensions, or registry keys",
  "Send any data to JobyBots-owned servers (we don't run any)",
  "Use telemetry, analytics, error reporting, or crash dumps",
  "Auto-update itself without your knowledge",
  "Persist beyond a folder you can drag to Trash",
];

const SCRIPTS = [
  {
    name: "JOBYBOT.bat / mac/JobyBot.command",
    role: "Front-door menu",
    what: "Shows you a numbered menu and calls one of the other scripts.",
  },
  {
    name: "SETUP_FOR_FRIENDS.bat / mac/Setup.command",
    role: "First-run installer",
    what: "Detects Python, creates a .venv/ folder, runs `pip install -r python-deps.txt`, opens .env in your text editor, runs a health check.",
  },
  {
    name: "RUN_BOT_NOW.bat / mac/RunBotNow.command",
    role: "One full cycle",
    what: "Calls `python jobybot.py run` once. Window stays open so you can watch.",
  },
  {
    name: "START_AUTOSCHEDULE.bat / mac/StartAutoSchedule.command",
    role: "24/7 scheduling",
    what: "Windows: registers a Task Scheduler task. Mac: writes a launchd .plist into ~/Library/LaunchAgents.",
  },
  {
    name: "DASHBOARD.bat / mac/Dashboard.command",
    role: "Open local HTML",
    what: "Opens data/dashboard.html in your default browser. That's it.",
  },
  {
    name: "SECURITY_CHECK.bat",
    role: "Self-audit",
    what: "Verifies .env permissions, scans for accidentally committed secrets, prints a hash of every Python file. You can run this any time.",
  },
];

export default function SecurityPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-cream via-white to-white">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(securityLd) }}
      />

      {/* HERO */}
      <section className="mx-auto max-w-4xl px-6 pt-20 pb-12">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-strong">
            Security · Honesty page
          </p>
        </Reveal>
        <Reveal delay={1}>
          <h1 className="mt-3 text-3xl sm:text-5xl font-bold text-ink tracking-tight">
            Why JobyBots is the safest job-search tool you'll ever run.
          </h1>
        </Reveal>
        <Reveal delay={2}>
          <p className="mt-6 text-lg text-slate-700 leading-relaxed">
            Most "AI job tools" are SaaS apps. You upload your résumé, your
            Gmail credentials, your LinkedIn cookie — and trust a company in
            another country to keep them safe forever. JobyBots flips that
            model. Everything runs <strong>on your laptop</strong>. We don't
            have a database. We don't have a server-side queue. We literally
            cannot leak data we don't have.
          </p>
        </Reveal>
        <Reveal delay={3}>
          <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200">
            <span aria-hidden>●</span>
            Zero servers · Zero telemetry · 100% auditable bash + Python
          </div>
        </Reveal>
      </section>

      {/* WHY .BAT AND .COMMAND */}
      <section className="mx-auto max-w-4xl px-6 pb-16">
        <Reveal>
          <h2 className="text-2xl sm:text-3xl font-bold text-ink">
            Why "<code>.bat</code>" and "<code>.command</code>" feel scary —
            and why JobyBots' aren't
          </h2>
        </Reveal>
        <Reveal delay={1}>
          <p className="mt-5 text-base text-slate-700 leading-relaxed">
            <code>.bat</code> (Windows) and <code>.command</code> (macOS) files
            are just <strong>plain-text scripts</strong>. The reason they have
            a bad reputation is that <em>any</em> script can do <em>anything</em>{" "}
            the user could do — including malicious things. The same is true of{" "}
            a Word macro, a PowerShell script, or a Python file.
          </p>
        </Reveal>
        <Reveal delay={2}>
          <p className="mt-4 text-base text-slate-700 leading-relaxed">
            The right question isn't <em>"is this file extension safe?"</em>{" "}
            (no extension is). The right question is{" "}
            <strong>"can I read what this script does before I run it?"</strong>
          </p>
        </Reveal>
        <Reveal delay={3}>
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
            <p className="text-sm font-bold text-emerald-900">
              You can read every JobyBots script in 90 seconds. Try it now.
            </p>
            <ol className="mt-3 ml-5 list-decimal space-y-1.5 text-sm text-emerald-900">
              <li>
                Right-click any <code>.bat</code> or{" "}
                <code>.command</code> file in your JobyBots folder.
              </li>
              <li>
                Choose <strong>Edit</strong> (Windows) or <strong>Open With →
                TextEdit</strong> (Mac).
              </li>
              <li>
                Read the file top-to-bottom. Every JobyBots script is between{" "}
                30 and 80 lines, with section headers and English comments.
              </li>
            </ol>
          </div>
        </Reveal>
      </section>

      {/* SCRIPT INVENTORY */}
      <section className="mx-auto max-w-5xl px-6 pb-16">
        <Reveal>
          <h2 className="text-2xl sm:text-3xl font-bold text-ink">
            What every JobyBots script does, in one line each
          </h2>
        </Reveal>
        <Reveal delay={1}>
          <p className="mt-3 text-sm text-slate-600">
            All six together are about 250 lines of bash + batch. No obfuscation,
            no compiled binaries, no minified launchers.
          </p>
        </Reveal>
        <div className="mt-8 grid gap-3 md:grid-cols-2">
          {SCRIPTS.map((s, i) => (
            <Reveal
              key={s.name}
              delay={Math.min(4, (i + 1)) as 1 | 2 | 3 | 4}
              className="rounded-2xl border border-slate-200 bg-white p-5"
            >
              <p className="font-mono text-xs font-bold text-accent-strong">
                {s.role}
              </p>
              <p className="mt-1.5 font-mono text-[13px] font-semibold text-ink">
                {s.name}
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-slate-700">
                {s.what}
              </p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* WHAT IT DOES vs WHAT IT DOESN'T */}
      <section className="bg-ink text-white">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <Reveal>
            <h2 className="text-2xl sm:text-3xl font-bold">
              What JobyBots does on your machine
            </h2>
          </Reveal>
          <Reveal delay={1}>
            <p className="mt-3 text-sm text-white/70">
              Five operations. That's the whole list.
            </p>
          </Reveal>
          <ul className="mt-8 grid gap-4 md:grid-cols-2">
            {WHAT_JOBYBOTS_DOES.map((item, i) => (
              <Reveal
                key={item.title}
                as="li"
                delay={Math.min(5, i + 1) as 1 | 2 | 3 | 4 | 5}
                className="rounded-2xl border border-white/10 bg-white/5 p-5"
              >
                <p className="font-mono text-2xl text-accent">{item.icon}</p>
                <p className="mt-2 font-display text-lg font-semibold">
                  {item.title}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-white/80">
                  {item.body}
                </p>
              </Reveal>
            ))}
          </ul>

          <Reveal delay={6}>
            <h3 className="mt-16 text-xl font-bold">
              And — explicitly — what it does <em>not</em> do
            </h3>
          </Reveal>
          <ul className="mt-5 grid gap-2 md:grid-cols-2">
            {WHAT_JOBYBOTS_DOES_NOT_DO.map((line, i) => (
              <li
                key={line}
                className="flex items-start gap-2 text-sm text-white/85"
              >
                <span aria-hidden className="mt-0.5 text-accent">✗</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* RED FLAGS COMPARISON */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <Reveal>
          <h2 className="text-2xl sm:text-3xl font-bold text-ink">
            Red flags to look for in <em>any</em> job-hunting tool
          </h2>
        </Reveal>
        <Reveal delay={1}>
          <p className="mt-3 text-sm text-slate-600">
            These are the things JobyBots was specifically built to <em>not</em> do.
            Use them as a checklist when evaluating any other tool too.
          </p>
        </Reveal>
        <ul className="mt-8 grid gap-3 md:grid-cols-2">
          {RED_FLAGS_OTHER_TOOLS.map((flag, i) => (
            <Reveal
              key={flag}
              as="li"
              delay={Math.min(4, (i % 4) + 1) as 1 | 2 | 3 | 4}
              className="flex items-start gap-3 rounded-2xl bg-red-50 p-4 ring-1 ring-red-100"
            >
              <span aria-hidden className="mt-0.5 text-red-500">⚠</span>
              <span className="text-sm leading-relaxed text-red-900">
                {flag}
              </span>
            </Reveal>
          ))}
        </ul>
      </section>

      {/* HOW WIZARD STAYS LOCAL */}
      <section className="mx-auto max-w-4xl px-6 pb-16">
        <Reveal>
          <h2 className="text-2xl sm:text-3xl font-bold text-ink">
            How the <Link href="/setup" className="text-accent-strong underline">/setup wizard</Link> stays local
          </h2>
        </Reveal>
        <Reveal delay={1}>
          <p className="mt-5 text-base text-slate-700 leading-relaxed">
            The wizard is a single-page React form. Every value you type lives
            in the browser's <code>useState</code> hook. When you click{" "}
            <em>Download .env</em>, the page assembles the file using the{" "}
            <code>Blob</code> API and triggers a normal browser download.{" "}
            <strong>No <code>fetch()</code>, no <code>XMLHttpRequest</code>,
            no analytics on the values you typed.</strong>
          </p>
        </Reveal>
        <Reveal delay={2}>
          <p className="mt-4 text-base text-slate-700 leading-relaxed">
            You can verify this yourself in 30 seconds:
          </p>
        </Reveal>
        <Reveal delay={3}>
          <ol className="mt-4 ml-6 list-decimal space-y-2 text-base text-slate-700">
            <li>Open <Link href="/setup" className="text-accent-strong underline">/setup</Link> in Chrome or Edge.</li>
            <li>Press <kbd className="kbd">F12</kbd> → <strong>Network</strong> tab.</li>
            <li>Click the <strong>🚫 Clear</strong> button to start fresh.</li>
            <li>Fill in the form and click <strong>Download .env</strong>.</li>
            <li>
              You'll see <strong>zero new requests</strong> — only the original
              page load. Nothing leaves your browser.
            </li>
          </ol>
        </Reveal>
      </section>

      {/* WHAT WE STORE ON OUR SERVERS */}
      <section className="bg-cream">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <Reveal>
            <h2 className="text-2xl sm:text-3xl font-bold text-ink">
              What JobyBots <em>does</em> store, server-side
            </h2>
          </Reveal>
          <Reveal delay={1}>
            <p className="mt-5 text-base text-slate-700 leading-relaxed">
              Honest answer: just enough to deliver the product. The full list is
              short.
            </p>
          </Reveal>
          <Reveal delay={2}>
            <ul className="mt-6 space-y-3 text-base text-slate-800">
              <li className="flex items-start gap-2">
                <span aria-hidden className="mt-0.5 text-accent">●</span>
                <span>
                  <strong>Stripe / Razorpay payment record</strong> — name,
                  billing email, transaction ID, amount. Required for tax + refund
                  compliance. Held by the payment processor; we have read access.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span aria-hidden className="mt-0.5 text-accent">●</span>
                <span>
                  <strong>License-key email</strong> — the email address Stripe
                  sends us when you pay, so we can mail you the installer ZIP.
                  Stored in a single Postgres table on Vercel.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span aria-hidden className="mt-0.5 text-accent">●</span>
                <span>
                  <strong>Standard web logs</strong> — Vercel's edge logs (IP,
                  page visited, user-agent) for 30 days. Same as any website.
                </span>
              </li>
            </ul>
          </Reveal>
          <Reveal delay={3}>
            <p className="mt-5 text-base text-slate-700 leading-relaxed">
              That's it. We don't store: your résumé, Gmail address, App Password,
              Gemini key, LinkedIn cookie, search history, applied-jobs database,
              recruiter emails, replies, or any text you type into the wizard.
            </p>
          </Reveal>
        </div>
      </section>

      {/* AUDIT YOURSELF */}
      <section className="mx-auto max-w-4xl px-6 py-20">
        <Reveal>
          <h2 className="text-2xl sm:text-3xl font-bold text-ink">
            Audit JobyBots yourself in 5 minutes
          </h2>
        </Reveal>
        <Reveal delay={1}>
          <ol className="mt-6 space-y-5 text-base text-slate-700 leading-relaxed">
            <li>
              <strong>Open every <code>.bat</code> / <code>.command</code> in
              Notepad / TextEdit.</strong> Read top to bottom. Total: about 250
              lines.
            </li>
            <li>
              <strong>Open <code>jobybot.py</code> and <code>core/*.py</code>{" "}
              in any code editor.</strong> Search for{" "}
              <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">
                requests.post
              </code>{" "}
              and read every URL the bot calls. You'll find LinkedIn, Bayt,
              Naukrigulf, GulfTalent, Indeed, RemoteOK, smtp.gmail.com,
              generativelanguage.googleapis.com, api.groq.com, and a list of
              ~40 company career-page domains. Nothing else.
            </li>
            <li>
              <strong>Run <code>SECURITY_CHECK.bat</code></strong> after
              install. It (a) verifies <code>.env</code> permissions, (b) scans
              the project for any accidentally committed secrets, (c) prints
              SHA-256 of every Python file. Re-run any time to confirm nothing
              has changed without your knowledge.
            </li>
            <li>
              <strong>Inspect outgoing traffic with Wireshark / Little Snitch{" "}
              / Lulu.</strong> You will see HTTPS connections only to job
              boards, Gmail SMTP, and Gemini. No traffic to anything ending in{" "}
              <code>.jobybots.com</code>. Promise.
            </li>
            <li>
              <strong>Drag the JobyBots folder to Trash to uninstall.</strong>{" "}
              On Windows: also run{" "}
              <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">
                schtasks /Delete /TN JobyBotScheduler /F
              </code>
              . On Mac: also double-click <code>StopBot.command</code> to
              remove the launchd agent. Done. Nothing left on your system.
            </li>
          </ol>
        </Reveal>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-3xl px-6 pb-24">
        <Reveal>
          <div className="rounded-3xl bg-gradient-to-br from-accent to-accent-strong p-10 text-white shadow-2xl">
            <p className="text-sm font-semibold uppercase tracking-widest opacity-80">
              Still nervous?
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight">
              Run JobyBots in a virtual machine first.
            </h2>
            <p className="mt-4 text-base leading-relaxed opacity-95">
              Install VirtualBox or UTM, spin up a clean Windows 11 / macOS VM,
              run JobyBots inside it. If everything looks fine after a week,
              promote it to your real machine. We support this — it's how the
              founder ran the first version himself.
            </p>
            <div className="mt-7 flex flex-wrap gap-4">
              <Link
                href="/setup"
                className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-accent-strong hover:bg-cream transition"
              >
                Open the local-first wizard →
              </Link>
              <Link
                href="/install"
                className="rounded-full border border-white/70 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition"
              >
                See the install walkthrough
              </Link>
              <a
                href="mailto:tharakesh.iitp@gmail.com?subject=Security%20question%20about%20JobyBots"
                className="rounded-full border border-white/70 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition"
              >
                Email the founder a security question
              </a>
            </div>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
