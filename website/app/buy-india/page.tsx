import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PAYMENT, SUPPORT } from "@/lib/config";
import { OrderForm } from "@/components/OrderForm";
import { verifySession, CUSTOMER_SESSION_COOKIE } from "@/lib/auth";
import { getCustomerByEmail } from "@/lib/customers";

export const metadata = {
  title: "Pay ₹2,999 by UPI · JobyBots Pro · India",
  description:
    "Step 2 of signup: scan the UPI QR with PhonePe / GPay / Paytm and submit your payment screenshot. Owner verifies manually within 30 minutes.",
};

export const dynamic = "force-dynamic";

const PREVIEW_STEPS: Array<{ n: string; src: string; alt: string; title: string }> = [
  { n: "01", src: "/install-storyboard/install-01-email.png", alt: "Installer email arrives in Gmail", title: "Installer email" },
  { n: "02", src: "/install-storyboard/install-02-extract.png", alt: "ZIP extracted showing 13 .bat files", title: "13 one-click files" },
  { n: "05", src: "/install-storyboard/install-05-verify.png", alt: "Health check terminal with 6 green ticks", title: "All-green health check" },
  { n: "07", src: "/install-storyboard/install-07-menu.png", alt: "JOBYBOT Control Center menu with 18 options", title: "Control center menu" },
  { n: "08", src: "/install-storyboard/install-08-interconnect.png", alt: "Diagram of how the .bat files connect", title: "How the .bats connect" },
  { n: "09", src: "/install-storyboard/install-09-dashboard.png", alt: "Live JobyBots dashboard with stats", title: "Live dashboard" },
  { n: "10", src: "/install-storyboard/install-10-replies.png", alt: "Six recruiter replies in Gmail inbox", title: "First recruiter replies" },
];

export default async function BuyIndiaPage() {
  // Try to read the customer session — if signed up, we lock the form
  // to that account so order ↔ customer linkage is automatic.
  const jar = await cookies();
  const token = jar.get(CUSTOMER_SESSION_COOKIE)?.value;
  const sessionEmail = verifySession(token);
  const customer = sessionEmail ? await getCustomerByEmail(sessionEmail) : null;

  // If the customer is already active, no reason to be on this page.
  if (customer?.status === "active") redirect("/portal");

  return (
    <div className="mx-auto max-w-page section-pad px-4">
      <div className="mx-auto max-w-2xl text-center">
        <p className="eyebrow">India · UPI Payment · Step 2 of signup</p>
        <h1 className="h1 mt-2">₹{PAYMENT.amountInr.toLocaleString("en-IN")} · Lifetime · One-time</h1>
        <p className="lead mt-4">
          {customer ? (
            <>
              Hi <strong>{customer.name}</strong>, your account is created.
              Pay below and we&apos;ll email you the moment payment is verified —
              usually within {SUPPORT.verificationWindow}.
            </>
          ) : (
            <>
              Pay with any UPI app and submit the form below. Owner verifies
              within {SUPPORT.verificationWindow} and emails you the moment
              your payment is approved. 7-day money-back guarantee.{" "}
              <Link href="/signup" className="font-semibold text-accent underline">
                New? Create an account first →
              </Link>
            </>
          )}
        </p>
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-2">
        <section className="card border-2 border-accent shadow-lift">
          <p className="text-sm font-semibold text-accent">Step 1 of 2</p>
          <h2 className="mt-2 text-2xl font-bold">Scan & pay ₹{PAYMENT.amountInr.toLocaleString("en-IN")}</h2>
          <p className="mt-1 text-ink-muted">Receiver: <strong className="text-ink">{PAYMENT.upiPayeeName}</strong></p>

          <div className="mt-6 flex flex-col items-center gap-4 rounded-2xl border border-surface-border bg-white p-4">
            <Image
              src={PAYMENT.upiQrImage}
              alt={`PhonePe / UPI QR — Pay ₹${PAYMENT.amountInr} to ${PAYMENT.upiPayeeName}`}
              width={360}
              height={580}
              priority
              className="h-auto w-full max-w-[320px] rounded-xl"
            />
          </div>

          <ul className="mt-6 space-y-2 text-sm text-ink-muted">
            <li>• Open any UPI app (PhonePe / GPay / Paytm / BHIM / Amazon Pay / CRED).</li>
            <li>• Tap <strong>Scan QR</strong> → point at the QR above.</li>
            <li>• Enter <strong>₹{PAYMENT.amountInr.toLocaleString("en-IN")}</strong> (exact amount).</li>
            <li>• Take a screenshot of the success page — you&apos;ll attach it on the right.</li>
          </ul>

          <div className="mt-6 rounded-xl bg-accent-soft p-4 text-sm">
            <p className="font-semibold text-accent">7-day money-back guarantee.</p>
            <p className="mt-1 text-ink-muted">
              Don&apos;t love it? Submit a refund form within 7 days — full refund to the
              same UPI / account within 5 business days.
            </p>
          </div>
        </section>

        <section className="card">
          <p className="text-sm font-semibold text-accent">Step 2 of 2</p>
          <h2 className="mt-2 text-2xl font-bold">Confirm your payment</h2>
          <p className="mt-1 text-ink-muted">
            We email you the moment your payment is verified — usually in {SUPPORT.verificationWindow}.
          </p>
          <OrderForm
            amountInr={PAYMENT.amountInr}
            lockedName={customer?.name}
            lockedEmail={customer?.email}
            lockedPhone={customer?.phone}
          />
          <p className="mt-6 rounded-lg bg-surface-subtle p-3 text-xs text-ink-muted">
            Owner verifies pending payments every 30 minutes. Need it now? WhatsApp{" "}
            <a className="font-semibold underline" href={`tel:${SUPPORT.phone.replace(/\s/g, "")}`}>
              {SUPPORT.phone}
            </a>{" "}
            with your screenshot.
          </p>
        </section>
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-3">
        <SafetyBadge
          title="Owner-verified · 30 minutes"
          desc="Every payment is manually approved by the founder. No auto-charges, no surprise renewals."
        />
        <SafetyBadge
          title="Payment proof is private"
          desc="Your screenshot is sent only to the owner during verification. Deleted after delivery."
        />
        <SafetyBadge
          title="7-day money-back"
          desc="Try the AI for a week. Not happy? Refund to the same UPI within 5 business days."
        />
      </div>

      <p className="mt-10 text-center text-sm text-ink-muted">
        Outside India? Pay by card on the{" "}
        <a href="/pricing" className="font-medium text-accent underline">
          Stripe checkout
        </a>{" "}
        for instant delivery.
      </p>

      <section className="mt-20 border-t border-surface-divider pt-16">
        <div className="mx-auto max-w-3xl text-center">
          <p className="eyebrow">What you receive after payment</p>
          <h2 className="h2 mt-3">Exactly seven screens stand between you and your first recruiter reply.</h2>
          <p className="mt-4 text-ink-muted">
            Tap any thumbnail to see the full installer journey — or visit the{" "}
            <Link
              href="/install"
              aria-label="See the full ten step installation walkthrough"
              className="font-medium text-accent underline"
            >
              full 10-step walkthrough
            </Link>
            .
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {PREVIEW_STEPS.map((s) => (
            <Link
              key={s.n}
              href="/install"
              aria-label={`See step ${s.n} of the JobyBots install walkthrough: ${s.title}`}
              className="group block overflow-hidden rounded-2xl border border-surface-border bg-white shadow-card transition-all hover:-translate-y-1 hover:shadow-lift"
            >
              <div className="aspect-[16/10] overflow-hidden bg-surface-subtle">
                <Image
                  src={s.src}
                  alt={s.alt}
                  width={1024}
                  height={683}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(min-width: 1024px) 320px, (min-width: 640px) 50vw, 100vw"
                />
              </div>
              <div className="flex items-center justify-between p-4">
                <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
                  Step {s.n}
                </p>
                <p className="text-sm font-semibold text-ink">{s.title}</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-10 rounded-2xl bg-gradient-to-br from-accent/10 to-accent/5 p-6 text-center">
          <p className="text-[15px] text-ink-muted">
            Average install: <strong className="text-ink">5 minutes</strong> · First emails sent:{" "}
            <strong className="text-ink">within 1 hour</strong> · First recruiter replies:{" "}
            <strong className="text-ink">2&ndash;5 days</strong>
          </p>
        </div>
      </section>
    </div>
  );
}

function SafetyBadge({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-surface-border bg-surface-subtle p-4 text-sm">
      <p className="font-semibold">✓ {title}</p>
      <p className="mt-1 text-ink-muted">{desc}</p>
    </div>
  );
}
