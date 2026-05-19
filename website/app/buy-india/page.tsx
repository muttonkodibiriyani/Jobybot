import Image from "next/image";
import { PAYMENT, SUPPORT } from "@/lib/config";
import { OrderForm } from "@/components/OrderForm";

export const metadata = {
  title: "Buy JobyBots Pro — UPI ₹2,999 · India (PhonePe / GPay / Paytm)",
  description:
    "Pay with any UPI app — PhonePe, GPay, Paytm, BHIM. Lifetime JobyBots Pro license delivered to your email after manual payment verification.",
};

export default function BuyIndiaPage() {
  return (
    <div className="mx-auto max-w-page section-pad px-4">
      <div className="mx-auto max-w-2xl text-center">
        <p className="eyebrow">India · UPI Payment</p>
        <h1 className="h1 mt-2">₹{PAYMENT.amountInr.toLocaleString("en-IN")} · Lifetime · Delivered to your email</h1>
        <p className="lead mt-4">
          Pay with any UPI app and submit the form below. Owner verifies within{" "}
          {SUPPORT.verificationWindow} and emails your download link automatically.
          7-day money-back guarantee.
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
            We email your installer to the address below after verification.
          </p>
          <OrderForm amountInr={PAYMENT.amountInr} />
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
          title="Encrypted in transit"
          desc="Full HTTPS · HSTS preload · CSP enforced site-wide."
        />
        <SafetyBadge
          title="Payment proof is private"
          desc="Your screenshot is sent only to the owner during verification."
        />
        <SafetyBadge
          title="7-day refund"
          desc="Submit at /refund · refunded to the same UPI in 5 days."
        />
      </div>

      <p className="mt-10 text-center text-sm text-ink-muted">
        Outside India? Pay by card on the{" "}
        <a href="/pricing" className="font-medium text-accent underline">
          Stripe checkout
        </a>{" "}
        for instant delivery.
      </p>
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
