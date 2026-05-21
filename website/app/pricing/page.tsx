import type { Metadata } from "next";
import { PRICING } from "@/lib/config";
import { CheckoutButton } from "@/components/CheckoutButton";
import Link from "next/link";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://jobybots.com";

export const metadata: Metadata = {
  title: "Pricing · ₹2,999 lifetime · No subscriptions",
  description:
    "JobyBots Pro is a one-time ₹2,999 (₹2,999 / $49 / AED 179) lifetime license. UPI for India, card / Apple Pay / Google Pay worldwide. 7-day refund, no recurring charges.",
  alternates: { canonical: `${SITE_URL}/pricing` },
  openGraph: {
    title: "JobyBots Pricing — ₹2,999 lifetime",
    description: "One-time payment. Lifetime upgrades. 7-day refund.",
    url: `${SITE_URL}/pricing`,
    type: "website",
  },
};

export default function PricingPage() {
  const plan = PRICING.pro;

  return (
    <div className="mx-auto max-w-page section-pad">
      <div className="mx-auto max-w-2xl text-center">
        <p className="eyebrow">Pricing</p>
        <h1 className="h1 mt-2">One price. Full Pro. Yours forever.</h1>
        <p className="lead mt-4">
          Like buying a product on Amazon — clear price, instant digital delivery.
        </p>
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        <article className="card border-2 border-accent shadow-lift">
          <p className="text-sm font-semibold text-accent">India · UPI</p>
          <h2 className="mt-2 text-2xl font-bold">{plan.name}</h2>
          <p className="mt-1 text-ink-muted">{plan.description}</p>
          <p className="mt-6 flex items-baseline gap-2">
            <span className="text-5xl font-bold tracking-tight">{plan.priceDisplay.INR}</span>
            <span className="text-ink-muted">one-time</span>
          </p>
          <p className="mt-1 text-sm text-ink-muted">
            Pay by GPay, PhonePe, Paytm — manual verification in ~30 min.
          </p>
          <ul className="mt-8 space-y-3 border-t border-surface-border pt-8">
            {plan.features.map((f) => (
              <li key={f} className="flex gap-3 text-sm">
                <span className="text-success font-bold" aria-hidden>✓</span>
                {f}
              </li>
            ))}
          </ul>
          <Link href="/buy-india" className="btn-primary mt-10 w-full text-center">
            Pay with UPI →
          </Link>
          <p className="mt-4 text-center text-xs text-ink-muted">
            Scan QR · upload screenshot · we email your installer.
          </p>
        </article>

        <article className="card">
          <p className="text-sm font-semibold text-ink-muted">International · card</p>
          <h2 className="mt-2 text-2xl font-bold">{plan.name}</h2>
          <p className="mt-1 text-ink-muted">{plan.description}</p>
          <p className="mt-6 flex items-baseline gap-2">
            <span className="text-5xl font-bold tracking-tight">{plan.priceDisplay.USD}</span>
            <span className="text-ink-muted">one-time</span>
          </p>
          <p className="mt-1 text-sm text-ink-muted">
            Also accepted: {plan.priceDisplay.AED}
          </p>
          <p className="mt-8 border-t border-surface-border pt-8 text-sm text-ink-muted">
            Card / Apple Pay / Google Pay via Stripe. Instant download after
            payment.
          </p>
          <CheckoutButton className="mt-8 w-full" />
          <p className="mt-4 text-center text-xs text-ink-muted">
            Secure checkout by Stripe.
          </p>
        </article>
      </div>

      <p className="mt-12 text-center text-sm text-ink-muted">
        Want free?{" "}
        <Link href="https://github.com/muttonkodibiriyani/Jobybot" className="font-medium text-accent underline">
          Community edition on GitHub
        </Link>
      </p>
    </div>
  );
}
