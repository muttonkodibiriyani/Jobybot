import { PRICING } from "@/lib/config";
import { CheckoutButton } from "@/components/CheckoutButton";
import Link from "next/link";

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

      <article className="card mx-auto mt-12 max-w-lg border-2 border-accent shadow-lift">
        <p className="text-sm font-semibold text-accent">Most popular</p>
        <h2 className="mt-2 text-2xl font-bold">{plan.name}</h2>
        <p className="mt-1 text-ink-muted">{plan.description}</p>
        <p className="mt-6 flex items-baseline gap-2">
          <span className="text-5xl font-bold tracking-tight">{plan.priceDisplay.USD}</span>
          <span className="text-ink-muted">one-time</span>
        </p>
        <p className="mt-1 text-sm text-ink-muted">
          Also shown at checkout: {plan.priceDisplay.AED} · {plan.priceDisplay.INR}
        </p>
        <ul className="mt-8 space-y-3 border-t border-surface-border pt-8">
          {plan.features.map((f) => (
            <li key={f} className="flex gap-3 text-sm">
              <span className="text-success font-bold" aria-hidden>
                ✓
              </span>
              {f}
            </li>
          ))}
        </ul>
        <CheckoutButton className="mt-10 w-full" />
        <p className="mt-4 text-center text-xs text-ink-muted">
          Secure checkout by Stripe. Download link immediately after payment.
        </p>
      </article>

      <p className="mt-12 text-center text-sm text-ink-muted">
        Want free?{" "}
        <Link href="https://github.com/muttonkodibiriyani/Jobybot" className="font-medium text-accent underline">
          Community edition on GitHub
        </Link>
      </p>
    </div>
  );
}
