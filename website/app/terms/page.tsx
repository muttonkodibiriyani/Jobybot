import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service · JobyBots",
  description:
    "How JobyBots may be used, our Gmail sending limits, platform-compliance rules for LinkedIn/Bayt/Naukri/Indeed/RemoteOK, refund policy, and your responsibilities as the operator.",
  alternates: { canonical: "/terms" },
};

const SECTION = "rounded-2xl border border-line bg-paper p-6 sm:p-8";

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-3xl section-pad">
      <header className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          Legal
        </p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight">Terms of Service</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Last updated: May 21, 2026 · Effective for all customers
        </p>
      </header>

      <div className="space-y-6">
        {/* ─── 1. WHAT JOBYBOTS IS ─── */}
        <section className={SECTION}>
          <h2 className="text-xl font-bold">1. What JobyBots is (and isn&apos;t)</h2>
          <p className="mt-3 text-ink-muted">
            JobyBots is <strong>desktop software</strong> that runs entirely on your computer.
            It searches public job boards, finds plausible recruiter contacts, drafts personalised
            emails using your Gmail App Password, and (in default DRAFT mode) hands every message
            to you for one-click review before sending.
          </p>
          <p className="mt-3 text-ink-muted">
            JobyBots is <strong>not</strong> a job board, a recruiter agency, or an outsourced
            sending service. We never have access to your inbox, your resume, your password,
            or the emails the bot drafts. Everything lives on your machine.
          </p>
        </section>

        {/* ─── 2. SENDING LIMITS ─── */}
        <section className={SECTION}>
          <h2 className="text-xl font-bold">
            2. Gmail sending limits (please read carefully)
          </h2>
          <p className="mt-3 text-ink-muted">
            Google enforces hard sending limits on Gmail (consumer + Workspace). The bot is
            shipped with safe defaults so you don&apos;t trip them:
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-ink-muted">
                  <th className="py-2">Account</th>
                  <th className="py-2">Hard cap</th>
                  <th className="py-2">JobyBots default</th>
                  <th className="py-2">Why</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                <tr>
                  <td className="py-3 font-semibold">Gmail (free)</td>
                  <td>500 / day</td>
                  <td className="font-mono text-accent">50 / day</td>
                  <td className="text-ink-muted">
                    Cold-outreach &gt; ~50/day flips Gmail&apos;s anti-spam filter.
                  </td>
                </tr>
                <tr>
                  <td className="py-3 font-semibold">Google Workspace</td>
                  <td>2,000 / day</td>
                  <td className="font-mono text-accent">50 / day</td>
                  <td className="text-ink-muted">
                    Same anti-spam filter applies; raise gradually after 2–3 weeks.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-ink-muted">
            You can raise the cap in your <code className="rounded bg-line/30 px-1">.env</code> by
            editing <code className="rounded bg-line/30 px-1">DAILY_EMAIL_CAP</code>, but doing so
            <strong> is your decision and at your risk</strong>. If Google flags or suspends your
            account because you exceeded their guidance, JobyBots is not responsible.
          </p>
          <p className="mt-3 text-sm text-ink-muted">
            Source: <a className="text-accent underline" href="https://support.google.com/a/answer/166852"
              target="_blank" rel="noopener noreferrer">Google Workspace sending limits</a>.
          </p>
        </section>

        {/* ─── 3. PLATFORM COMPLIANCE ─── */}
        <section className={SECTION}>
          <h2 className="text-xl font-bold">3. Job-platform compliance</h2>
          <p className="mt-3 text-ink-muted">
            JobyBots reads <strong>publicly listed jobs</strong> from the following platforms.
            Each has its own Terms of Service. We have engineered the bot to honour them; you
            agree to use it within the rules below.
          </p>

          <div className="mt-5 space-y-4 text-sm">
            <PlatformRule name="LinkedIn" url="https://www.linkedin.com/legal/user-agreement">
              We only read jobs from your authenticated session, never scrape behind a login that
              isn&apos;t yours, and never automate connection requests or messages inside LinkedIn.
              The optional <code>li_at</code> cookie is your session cookie under your control; you
              may revoke it at any time.{" "}
              <strong>LinkedIn Easy Apply automation is an opt-in feature</strong> that is OFF by
              default — see{" "}
              <Link href="/easy-apply" className="text-accent underline">/easy-apply</Link>{" "}
              for the algorithm, risks, and how to enable it. Enabling it puts your LinkedIn
              account at risk of restriction; you accept that risk by setting{" "}
              <code>ENABLE_EASY_APPLY=true</code>.
            </PlatformRule>
            <PlatformRule name="Bayt" url="https://www.bayt.com/en/site-services-agreement/">
              Public job listings are read at a rate of one page every ~2 seconds with the standard
              User-Agent. We respect <code>robots.txt</code> directives.
            </PlatformRule>
            <PlatformRule name="Naukri / Naukri Gulf" url="https://www.naukri.com/terms-and-conditions">
              Public job pages only. The bot never logs into your Naukri account, never auto-applies
              from inside the platform, and never harvests profiles other than the recruiter
              contact on the published listing.
            </PlatformRule>
            <PlatformRule name="Indeed" url="https://www.indeed.com/legal">
              We use the public listing pages with respectful rate-limiting. The bot does not bypass
              CAPTCHAs and stops if it sees one.
            </PlatformRule>
            <PlatformRule name="RemoteOK" url="https://remoteok.com/about">
              Uses the public JSON feed exclusively — no HTML scraping.
            </PlatformRule>
            <PlatformRule name="GulfTalent">
              Public listing pages only; the bot does not access logged-in employer-only sections.
            </PlatformRule>
          </div>

          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">
            <p className="font-semibold text-amber-900">Your responsibility</p>
            <p className="mt-1 text-amber-900/90">
              These platforms may change their Terms at any time. You are the operator of the bot
              — you are responsible for stopping it if a platform asks you to, and for complying
              with the laws of your country regarding unsolicited commercial email
              (CAN-SPAM in the US, GDPR in the UK/EU, ePrivacy in the GCC).
            </p>
          </div>
        </section>

        {/* ─── 4. WHAT THE BOT WILL NEVER DO ─── */}
        <section className={SECTION}>
          <h2 className="text-xl font-bold">4. Hard boundaries the bot will never cross</h2>
          <p className="mt-3 text-ink-muted">
            These are enforced in code. See <Link href="/trust" className="text-accent underline">/trust</Link> for the technical proof.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-ink-muted">
            <li>• Never sends without your approval if <code>DRAFT_MODE=true</code> (the default).</li>
            <li>• Never sends to an address that fails MX/DNS validation.</li>
            <li>• Never sends to an address that previously bounced.</li>
            <li>• Never sends more than <code>DAILY_EMAIL_CAP</code> in 24 h.</li>
            <li>• Never opens an outbound network connection except to: Gmail SMTP, the job
              boards listed above, jobybots.com (license check), and the AI APIs you enable.</li>
            <li>• Never uploads your resume, .env, credentials, or sent emails to our servers.</li>
            <li>• Never auto-installs updates without your consent.</li>
          </ul>
        </section>

        {/* ─── 5. LICENSE / ANTI-SHARING ─── */}
        <section className={SECTION}>
          <h2 className="text-xl font-bold">5. Your license</h2>
          <p className="mt-3 text-ink-muted">
            Your purchase grants <strong>one</strong> personal, non-transferable lifetime license to
            run JobyBots on <strong>one</strong> machine at a time. The bot binds itself to that
            machine on first run via a one-way SHA-256 fingerprint of your hardware (no PII).
          </p>
          <p className="mt-3 text-ink-muted">
            <strong>You may not</strong> share the installer ZIP, the source code, your activation
            email, or your bound fingerprint with anyone else. Each shared install is a separate
            license sale we lose — and JobyBots is built and supported by one person.
          </p>
          <p className="mt-3 text-ink-muted">
            <strong>You may</strong> move your license to a new laptop at any time:
            sign in at <Link href="/portal" className="text-accent underline">/portal</Link>{" "}
            → click <strong>&quot;Move my license&quot;</strong>. The next bot cycle on the new machine
            will re-bind automatically. There&apos;s no limit on legitimate moves; abuse (e.g. moving
            10+ times in a month) may pause your license.
          </p>
        </section>

        {/* ─── 6. PRICING & REFUNDS ─── */}
        <section className={SECTION}>
          <h2 className="text-xl font-bold">6. Pricing &amp; refunds</h2>
          <p className="mt-3 text-ink-muted">
            JobyBots is sold as a one-time ₹2,999 (India) / $99 (international) lifetime license.
            No recurring fees, no per-email charges, no upsells.
          </p>
          <p className="mt-3 text-ink-muted">
            <strong>14-day refund</strong>: full refund on request if the bot does not run on a
            supported Windows 10/11 PC or macOS 12+ Mac after following the setup guide. Email
            <a className="text-accent underline" href="mailto:support@jobybots.com"> support@jobybots.com</a>.
          </p>
        </section>

        {/* ─── 7. WARRANTY DISCLAIMER ─── */}
        <section className={SECTION}>
          <h2 className="text-xl font-bold">7. Warranty disclaimer</h2>
          <p className="mt-3 text-ink-muted">
            JobyBots is provided <strong>&quot;as is&quot;</strong>. We do not guarantee interviews, replies, or
            job offers. We do not guarantee specific deliverability rates. We have built the bot to
            be as safe and accurate as we know how, but you are the operator of every message it
            sends from your inbox.
          </p>
        </section>

        {/* ─── 8. CONTACT ─── */}
        <section className={SECTION}>
          <h2 className="text-xl font-bold">8. Contact</h2>
          <p className="mt-3 text-ink-muted">
            Questions about these Terms or about how the bot works:
            <a className="text-accent underline" href="mailto:support@jobybots.com"> support@jobybots.com</a>.
          </p>
        </section>
      </div>

      <footer className="mt-10 flex flex-wrap gap-4 text-sm">
        <Link href="/trust" className="text-accent underline">Trust &amp; safety</Link>
        <Link href="/technology" className="text-accent underline">How the technology works</Link>
        <Link href="/security" className="text-accent underline">Security model</Link>
        <Link href="/portal" className="text-accent underline">My portal</Link>
      </footer>
    </article>
  );
}

function PlatformRule({
  name,
  url,
  children,
}: {
  name: string;
  url?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-line bg-bg-soft/40 p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-bold">{name}</h3>
        {url ? (
          <a className="text-xs text-accent underline" href={url} target="_blank" rel="noopener noreferrer">
            their ToS ↗
          </a>
        ) : null}
      </div>
      <p className="mt-2 text-ink-muted">{children}</p>
    </div>
  );
}
