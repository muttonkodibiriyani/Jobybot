import Image from "next/image";
import QRCode from "qrcode";
import { UPI, PRICING } from "@/lib/config";
import { OrderForm } from "@/components/OrderForm";

export const metadata = {
  title: "Buy Jobybot Pro — UPI ₹2,999 · India",
  description:
    "Pay with any UPI app (GPay, PhonePe, Paytm, BHIM). Lifetime Jobybot Pro license delivered to your email after manual payment verification.",
};

async function buildQr() {
  const link = `upi://pay?pa=${encodeURIComponent(UPI.vpa)}&pn=${encodeURIComponent(
    UPI.payeeName,
  )}&am=${UPI.amountInr}&cu=INR&tn=${encodeURIComponent("Jobybot Pro Lifetime")}`;
  const dataUrl = await QRCode.toDataURL(link, {
    width: 320,
    margin: 1,
    color: { dark: "#0B0B0B", light: "#FFFFFF" },
  });
  return { dataUrl, link };
}

export default async function BuyIndiaPage() {
  const { dataUrl, link } = await buildQr();
  const plan = PRICING.pro;

  return (
    <div className="mx-auto max-w-page section-pad">
      <div className="mx-auto max-w-2xl text-center">
        <p className="eyebrow">India · UPI Payment</p>
        <h1 className="h1 mt-2">{plan.priceDisplay.INR} · lifetime · delivered to email</h1>
        <p className="lead mt-4">
          Pay with any UPI app and submit the form below. We verify within ~30 minutes
          and email your download link.
        </p>
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-2">
        <section className="card border-2 border-accent shadow-lift">
          <p className="text-sm font-semibold text-accent">Step 1 of 2</p>
          <h2 className="mt-2 text-2xl font-bold">Scan and pay ₹{UPI.amountInr}</h2>
          <p className="mt-1 text-ink-muted">
            UPI ID: <strong className="text-ink">{UPI.vpa}</strong>
          </p>

          <div className="mt-6 flex flex-col items-center gap-4 rounded-2xl border border-surface-border bg-white p-6">
            <Image
              src={dataUrl}
              alt={`UPI QR for ₹${UPI.amountInr}`}
              width={280}
              height={280}
              priority
              unoptimized
            />
            <a
              href={link}
              className="btn-secondary !text-sm"
              rel="nofollow"
            >
              Open in UPI app
            </a>
          </div>

          <ul className="mt-6 space-y-2 text-sm text-ink-muted">
            <li>• Works with Google Pay, PhonePe, Paytm, BHIM, Amazon Pay.</li>
            <li>• Amount is pre-filled — please don&apos;t change it.</li>
            <li>• Take a screenshot of the success page — you&apos;ll attach it next.</li>
          </ul>
        </section>

        <section className="card">
          <p className="text-sm font-semibold text-accent">Step 2 of 2</p>
          <h2 className="mt-2 text-2xl font-bold">Confirm your payment</h2>
          <p className="mt-1 text-ink-muted">
            Fill this and we&apos;ll email your download link after manual verification.
          </p>
          <OrderForm amountInr={UPI.amountInr} />
        </section>
      </div>

      <p className="mt-12 text-center text-sm text-ink-muted">
        Outside India? Pay by card on the{" "}
        <a href="/pricing" className="font-medium text-accent underline">
          Stripe checkout
        </a>{" "}
        for instant delivery.
      </p>
    </div>
  );
}
