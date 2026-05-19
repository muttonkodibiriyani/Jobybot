import { NextResponse } from "next/server";
import { SITE, PRICING } from "@/lib/config";
import { getStripe, isDemoMode } from "@/lib/stripe";

export async function POST() {
  const base = SITE.url.replace(/\/$/, "");
  const successUrl = `${base}/success?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${base}/pricing`;

  if (isDemoMode()) {
    return NextResponse.json({
      demo: true,
      successUrl: `${base}/success?session_id=demo_${Date.now()}`,
    });
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Payments not configured" }, { status: 500 });
  }

  const priceId = process.env.STRIPE_PRICE_ID;
  if (!priceId) {
    return NextResponse.json({ error: "STRIPE_PRICE_ID missing" }, { status: 500 });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: true,
    metadata: { product: "jobybot_pro" },
  });

  return NextResponse.json({ url: session.url });
}
