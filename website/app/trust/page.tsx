import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://jobybots.com";

export const metadata: Metadata = {
  title: "Trust · Bot boundaries and what JobyBots will never do",
  description:
    "Every guardrail JobyBots ships with. Hard limits the bot cannot exceed, what it never touches, and the exact code that enforces each rule. No surprises, no hidden behaviour.",
  alternates: { canonical: `${SITE_URL}/trust` },
  openGraph: {
    title: "JobyBots — Trust, boundaries, and bot safety",
    description:
      "10 hard rules the bot enforces in code. No surprises, no hidden behaviour, no risk to your inbox reputation.",
    url: `${SITE_URL}/trust`,
    type: "article",
  },
};

const trustLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "JobyBots Trust & Bot Boundaries",
  description:
    "The hard rules JobyBots enforces in code so the bot cannot be misused, hacked, or weaponised — by us or by anyone else.",
  author: { "@type": "Person", name: "Darapu Tharakeswara Reddy", url: SITE_URL },
  publisher: { "@type": "Organization", name: "JobyBots", url: SITE_URL },
  datePublished: "2026-05-21",
  dateModified: "2026-05-21",
};

const HARD_RULES: Array<{
  title: string;
  rule: string;
  why: string;
  enforced_in: string;
}> = [
  {
    title: "Never sends without your one-click approval",
    rule:
      "By default (DRAFT_MODE=true), every drafted email lands in a local review queue. The bot does not send a single byte to Gmail until you click 'Send' in the Review Queue UI at localhost:7868.",
    why: "Eliminates 'the bot sent something I didn't approve' incidents. You are always the operator of every outbound message from your inbox.",
    enforced_in: "core/email_sender.py · send_application() · DRAFT_MODE check",
  },
  {
    title: "Never sends to an unverified address",
    rule:
      "Every recipient candidate goes through MX-record DNS validation. Addresses that don't resolve to a real mail server are dropped before they can reach SMTP.",
    why: "Protects your sender reputation. One bounced email is fine; ten in a row gets you flagged as a spammer.",
    enforced_in: "core/email_validator.py · validate_email()",
  },
  {
    title: "Never sends to an address that previously bounced",
    rule:
      "Every bounce gets written to the invalid_emails table. The next time the bot considers that address — even months later — it skips silently.",
    why: "Repeated sends to known-bad addresses are the #1 signal Gmail uses to quarantine your account.",
    enforced_in: "core/db.py · mark_invalid_email() / is_invalid_email()",
  },
  {
    title: "Never exceeds the safe daily cap",
    rule:
      "DAILY_EMAIL_CAP defaults to 50. The bot tracks every send in SQLite and stops the moment the day's count hits the cap, even mid-cycle.",
    why: "Cold outreach over ~50/day flips Google's anti-spam classifier. Hard cap means you can't accidentally torch your domain.",
    enforced_in: "core/email_sender.py · emails_sent_today() check",
  },
  {
    title: "Never sends from a non-Gmail address",
    rule:
      "The SMTP client is hardcoded to smtp.gmail.com:587 with STARTTLS. There is no configuration for an arbitrary SMTP server, so the bot cannot be repurposed as a generic spam relay.",
    why: "If someone steals your installer, they can't aim it at any other provider. It only knows Gmail.",
    enforced_in: "core/email_sender.py · send_email() · smtplib.SMTP() call",
  },
  {
    title: "Never opens an outbound connection you didn't approve",
    rule:
      "The bot's only outbound destinations are: Gmail SMTP, the job boards listed on /terms, jobybots.com (one license check per cycle), and the AI APIs you explicitly enable via API key.",
    why: "No telemetry, no analytics, no 'phone home' for usage tracking. Inspect outbound traffic with Wireshark; you'll see only those five domains.",
    enforced_in: "core/net_safety.py · allowed-host list",
  },
  {
    title: "Never accesses files outside its own folder",
    rule:
      "The bot reads only what's inside the JobyBots folder: resume.pdf, .env, data/jobybot.db, data/*.html. It does not have admin/UAC/sudo permissions and cannot scan your disk.",
    why: "Even if the bot were compromised, the blast radius is one folder. It cannot reach your Documents, browser cookies, SSH keys, or anything sensitive.",
    enforced_in: "All file I/O uses relative paths starting with ./ or ./data/",
  },
  {
    title: "Never accepts remote commands",
    rule:
      "The Review Queue HTTP server binds to 127.0.0.1 only — never 0.0.0.0. A CSRF token cookie + matching header is required on every POST. The CSP header blocks third-party scripts from making requests against it.",
    why: "Nothing on your home Wi-Fi, your office network, or the public internet can reach the queue API. Only YOUR browser, with the page YOU opened, can send actions.",
    enforced_in: "core/queue_server.py · ThreadingHTTPServer((\"127.0.0.1\", …)) + _csrf_ok()",
  },
  {
    title: "Never runs on a machine that isn't yours",
    rule:
      "On first cycle the bot binds itself to your machine's SHA-256 fingerprint via /api/license/bind. Subsequent cycles from a different machine for the same license are rejected with a clear error message.",
    why: "Stops the 'I'll share the ZIP with friends' problem. Each paid license = one machine. Move to a new laptop anytime from /portal.",
    enforced_in: "core/license_check.py · verify_or_bind()",
  },
  {
    title: "Never auto-updates itself",
    rule:
      "There is no auto-updater. To upgrade you run UPDATE.bat which performs a 'git pull' — and you can read the diff first.",
    why: "Auto-updaters are the most common supply-chain attack vector. You decide when (and whether) to take new code.",
    enforced_in: "Look — there's no updater script at all. Promise.",
  },
  {
    title: "Never auto-applies on LinkedIn without explicit opt-in",
    rule:
      "Easy Apply automation is OFF by default. Even when ENABLE_EASY_APPLY=true, the bot is in DRY-RUN mode (fills form, screenshots it, stops at Submit). 10/day hard cap. Random 20-60s jitter. Visible browser. Never auto-clicks Follow.",
    why: "Easy Apply violates LinkedIn ToS §8.2. We refuse to make that a silent default. You opt in twice (enable + un-dry-run) before any application is submitted, and you watch every click in a real Chromium window. See /easy-apply for the full risk surface.",
    enforced_in: "core/easy_apply.py · run_easy_apply() · enable_easy_apply + dry_run gates",
  },
];

const NEVER_LIST = [
  "Never uploads your résumé to our servers (it stays in your folder)",
  "Never uploads your .env, Gmail App Password, or any API key",
  "Never reads emails in your inbox (it only sends; bounce-scan reads bounce metadata only)",
  "Never imports your contacts, LinkedIn connections, or browser bookmarks",
  "Never connects to social media beyond reading public job listings",
  "Never sells, shares, or aggregates your data — there is no JobyBots server with your data on it",
  "Never modifies system settings, scheduled tasks (except its own), or other applications",
  "Never bundles ads, trackers, analytics SDKs, or third-party JavaScript",
];

export default function TrustPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(trustLd) }}
      />
      <article className="mx-auto max-w-5xl section-pad">
        <Reveal>
          <header className="mb-12 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
              Trust &amp; safety
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
              The 11 rules the bot can&apos;t break.
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-ink-muted">
              Every guardrail is enforced in code, not in a policy doc. Open the
              repo and grep — you&apos;ll find the exact line that stops the bot
              from misbehaving.
            </p>
          </header>
        </Reveal>

        <Reveal delay={1}>
          <div className="rounded-3xl border border-line bg-paper p-6 sm:p-8">
            <ol className="space-y-6">
              {HARD_RULES.map((r, i) => (
                <li key={r.title} className="grid gap-4 md:grid-cols-[auto,1fr]">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-accent/30 bg-accent/10 font-bold text-accent">
                    {i + 1}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold tracking-tight">{r.title}</h3>
                    <p className="mt-1 text-ink-muted">{r.rule}</p>
                    <p className="mt-2 text-sm text-ink-muted">
                      <span className="font-semibold text-ink">Why it matters:</span> {r.why}
                    </p>
                    <p className="mt-2 text-xs text-ink-muted">
                      <span className="font-mono font-semibold">Enforced in:</span>{" "}
                      <code className="rounded bg-line/30 px-1.5 py-0.5 text-[11px]">
                        {r.enforced_in}
                      </code>
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </Reveal>

        <Reveal delay={2}>
          <section className="mt-12 rounded-3xl border border-ink/15 bg-ink p-6 text-paper sm:p-8">
            <h2 className="text-2xl font-bold">What the bot will <em>never</em> do</h2>
            <p className="mt-2 text-paper/80">
              Things you might worry about that simply aren&apos;t in the code:
            </p>
            <ul className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
              {NEVER_LIST.map((line) => (
                <li key={line} className="flex gap-3 text-paper/90">
                  <span className="mt-0.5 select-none text-accent">✗</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </section>
        </Reveal>

        <Reveal delay={3}>
          <section className="mt-10 rounded-3xl border border-line bg-paper p-6 sm:p-8">
            <h2 className="text-2xl font-bold">If you spot a boundary we missed</h2>
            <p className="mt-3 text-ink-muted">
              Responsible-disclosure friendly. Email{" "}
              <a className="text-accent underline" href="mailto:security@jobybots.com">
                security@jobybots.com
              </a>{" "}
              with reproduction steps. Confirmed reports get acknowledged in
              CHANGELOG and a thank-you in the next release notes.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 text-sm">
              <Link href="/security" className="rounded-full border border-line bg-bg-soft px-4 py-2 hover:border-accent">
                Security model →
              </Link>
              <Link href="/technology" className="rounded-full border border-line bg-bg-soft px-4 py-2 hover:border-accent">
                How the technology works →
              </Link>
              <Link href="/terms" className="rounded-full border border-line bg-bg-soft px-4 py-2 hover:border-accent">
                Terms of service →
              </Link>
            </div>
          </section>
        </Reveal>
      </article>
    </>
  );
}
