import Link from "next/link";
import { SUPPORT, PAYMENT } from "@/lib/config";

export const metadata = {
  title: "FAQ · Payments, refunds, security & support — JobyBots",
  description:
    "Everything about UPI payments, the 7-day refund policy, security, GDPR, and how to contact JobyBots support.",
};

const sections: { heading: string; items: { q: string; a: React.ReactNode }[] }[] = [
  {
    heading: "Payments",
    items: [
      {
        q: `How do I pay ₹${PAYMENT.amountInr} for JobyBots Pro from India?`,
        a: (
          <>
            Go to <Link className="underline" href="/buy-india">/buy-india</Link>,
            scan the PhonePe QR code, and pay the exact amount. Then fill the
            confirmation form with your UPI transaction reference and a
            screenshot of the success page. We verify within ~30 minutes and
            email your download link.
          </>
        ),
      },
      {
        q: "Which UPI apps work?",
        a: "Any UPI-enabled app: PhonePe, Google Pay (GPay), Paytm, BHIM, Amazon Pay, CRED, Slice — they all read the same QR.",
      },
      {
        q: "Can I pay from outside India?",
        a: (
          <>
            Yes — use the Stripe checkout on{" "}
            <Link className="underline" href="/pricing">/pricing</Link>. We
            accept all major cards, Apple Pay, Google Pay, and Link. Delivery
            is instant for card payments.
          </>
        ),
      },
      {
        q: "How long until I get the installer?",
        a: `UPI: usually within ${SUPPORT.verificationWindow} of submitting the verification form (we batch-verify every 30 minutes). Card: instant. Both arrive at the email you entered on the form.`,
      },
      {
        q: "Are taxes included?",
        a: "Yes. The displayed price (₹2,999 / $49 / AED 179) is the final amount you pay — no GST on top, no surprises.",
      },
      {
        q: "Is my payment information stored on your servers?",
        a: "No. UPI transaction proofs (screenshot + reference) are stored encrypted and only viewed by the owner during verification. Card details never touch our servers — Stripe handles everything end-to-end and is PCI-DSS Level 1 certified.",
      },
    ],
  },
  {
    heading: "Refunds",
    items: [
      {
        q: `Is there a refund policy?`,
        a: (
          <>
            Yes — a full <strong>{SUPPORT.refundDays}-day money-back
            guarantee</strong> from the moment you receive the installer. If
            JobyBots doesn&apos;t make your job search easier, request a
            refund through the form at{" "}
            <Link className="underline" href="/refund">/refund</Link> and we
            refund 100% to the same UPI / card within 5 business days. No
            calls, no questions.
          </>
        ),
      },
      {
        q: "How do I submit a refund request?",
        a: (
          <>
            Go to <Link className="underline" href="/refund">/refund</Link>,
            fill the form (Order ID, registered email, reason). We acknowledge
            within 30 minutes and process within 5 business days.
          </>
        ),
      },
      {
        q: "What if I lose my Order ID?",
        a: (
          <>
            Email us from your registered address at{" "}
            <a className="underline" href={`mailto:${SUPPORT.email}`}>
              {SUPPORT.email}
            </a>{" "}
            and we&apos;ll look it up for you.
          </>
        ),
      },
      {
        q: `What happens after ${SUPPORT.refundDays} days?`,
        a: `After ${SUPPORT.refundDays} days we no longer issue automatic refunds, but you can still reach out — we review fair-use cases (broken install, missing features, hardware change) on a case-by-case basis.`,
      },
      {
        q: "Will my data be deleted after a refund?",
        a: "Yes. Your account record (email, phone, transaction reference, screenshot) is permanently deleted within 24 hours of the refund being processed.",
      },
    ],
  },
  {
    heading: "Product",
    items: [
      {
        q: "Does it really run 24/7?",
        a: "Yes. JobyBots installs as a Windows Scheduled Task or a background scheduler. Your laptop just needs to be on and connected to the internet. Default cadence: every 60 minutes. Configurable down to 30 minutes via .env.",
      },
      {
        q: "How is JobyBots different from LazyApply / Sonara / AIApply?",
        a: (
          <>
            See the comparison on the{" "}
            <Link className="underline" href="/">home page</Link>. Short version:
            we don&apos;t need cloud access to your accounts, we run on your
            own machine, we&apos;re a one-time payment (not a $40-90/mo
            subscription), and we&apos;re GDPR-safe by design (we never
            email-blast EU recruiters, just surface their jobs to apply
            officially).
          </>
        ),
      },
      {
        q: "Can it auto-submit on LinkedIn Easy Apply?",
        a: (
          <>
            We deliberately don&apos;t auto-submit because LinkedIn detects
            and bans automation, which would destroy your real account. Instead
            we ship a browser bookmarklet + Chrome extension that{" "}
            <strong>pre-fills</strong> Easy Apply / Indeed / Bayt / Workday
            forms — you click Submit. Same speed, zero ban risk. Full
            reasoning in our auto-apply doc.
          </>
        ),
      },
      {
        q: "Will it get my Gmail blacklisted?",
        a: "We cap outbound mail at 200/day (you can lower it), validate every recipient&apos;s MX records before sending, read your Mailer-Daemon NDRs to quarantine bad addresses, and skip GDPR-strict EU markets entirely. This is exactly the deliverability discipline a real sales team uses.",
      },
    ],
  },
  {
    heading: "Security & privacy",
    items: [
      {
        q: "Where is my resume / Gmail App Password stored?",
        a: "Only on your laptop, in your project folder (.env file + your PDF). Nothing is uploaded to our servers — there are no servers that process your job applications. We simply sell you the software.",
      },
      {
        q: "Is jobybots.com secure?",
        a: "Yes. The site is encrypted end-to-end, blocks login abuse automatically, and the owner gets an instant email alert if anything suspicious happens. The admin area is password-protected and every login is logged. You'll never see a security pop-up or scam warning here.",
      },
      {
        q: "What if a hacker tries to access my account?",
        a: "Failed admin logins, repeated form submissions from the same IP, and unusual traffic patterns automatically trigger an email alert to the owner within minutes. We treat the alerts as actionable and rotate credentials immediately if we see anything unexpected.",
      },
      {
        q: "Do you sell my data?",
        a: "No. Never. Your details (name, email, phone, payment proof) are used only for delivery and refunds. We don&apos;t run ads, retarget you, or share with third parties.",
      },
    ],
  },
  {
    heading: "Support",
    items: [
      {
        q: "How do I reach a human?",
        a: (
          <>
            Email{" "}
            <a className="underline" href={`mailto:${SUPPORT.email}`}>
              {SUPPORT.email}
            </a>{" "}
            or WhatsApp/call{" "}
            <a className="underline" href={`tel:${SUPPORT.phone.replace(/\s/g, "")}`}>
              {SUPPORT.phone}
            </a>{" "}
            during {SUPPORT.hours}. We respond to email within 4 hours on business
            days.
          </>
        ),
      },
      {
        q: "Where do you operate from?",
        a: "JobyBots is run by Tharakeswara Reddy out of India, serving customers in India, UAE, Singapore, Canada, Australia, UK and select EU markets (apply-via-website only).",
      },
    ],
  },
];

export default function FAQPage() {
  return (
    <div className="mx-auto max-w-3xl section-pad px-4">
      <p className="eyebrow">Help center</p>
      <h1 className="h1 mt-2">Frequently asked questions</h1>
      <p className="lead mt-4">
        Quick answers about payments, refunds, security, and how to reach us.
      </p>

      <div className="mt-10 grid gap-3 sm:grid-cols-2">
        <a
          href={`mailto:${SUPPORT.email}`}
          className="card flex items-center gap-4 hover:border-accent"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-soft text-2xl">
            ✉️
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-ink-muted">Email support</p>
            <p className="font-semibold">{SUPPORT.email}</p>
            <p className="text-xs text-ink-muted">Reply in 4 hours · {SUPPORT.hours}</p>
          </div>
        </a>
        <a
          href={`tel:${SUPPORT.phone.replace(/\s/g, "")}`}
          className="card flex items-center gap-4 hover:border-accent"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-soft text-2xl">
            📞
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-ink-muted">Call / WhatsApp</p>
            <p className="font-semibold">{SUPPORT.phone}</p>
            <p className="text-xs text-ink-muted">{SUPPORT.hours}</p>
          </div>
        </a>
      </div>

      {sections.map((s) => (
        <section key={s.heading} className="mt-16">
          <h2 className="text-2xl font-bold tracking-tight">{s.heading}</h2>
          <dl className="mt-6 space-y-4">
            {s.items.map((it, i) => (
              <details
                key={i}
                className="group rounded-2xl border border-surface-border bg-surface p-5 transition open:border-accent"
              >
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-base font-semibold">
                  <span>{it.q}</span>
                  <span className="ml-4 mt-1 text-ink-muted transition group-open:rotate-45">+</span>
                </summary>
                <dd className="mt-3 text-ink-muted leading-relaxed">{it.a}</dd>
              </details>
            ))}
          </dl>
        </section>
      ))}

      <section className="mt-20 rounded-3xl bg-ink p-10 text-center text-white">
        <p className="eyebrow text-white/70">Still stuck?</p>
        <h2 className="mt-2 text-3xl font-bold">We&apos;re a real person away.</h2>
        <p className="mt-3 text-white/70">
          Email or call — we&apos;ll get you sorted, even on weekends.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <a href={`mailto:${SUPPORT.email}`} className="btn-primary">
            Email {SUPPORT.email}
          </a>
          <a
            href={`tel:${SUPPORT.phone.replace(/\s/g, "")}`}
            className="btn-secondary !bg-white !text-ink"
          >
            Call {SUPPORT.phone}
          </a>
        </div>
      </section>
    </div>
  );
}
