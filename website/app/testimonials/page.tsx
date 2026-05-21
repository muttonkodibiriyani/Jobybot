import type { Metadata } from "next";
import Link from "next/link";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://jobybots.com";

export const metadata: Metadata = {
  title: "Testimonials · Real users, real numbers",
  description:
    "Honest user reviews of JobyBots from product managers, business analysts and engineers across UAE, Saudi Arabia, India and the UK. Real reply counts, real interview rates.",
  alternates: { canonical: `${SITE_URL}/testimonials` },
};

const reviews = [
  {
    name: "Priya R.",
    role: "Senior Product Manager",
    city: "Bangalore → Dubai",
    rating: 5,
    body:
      "Set it up on a Friday, woke up Monday to 11 recruiter replies. The Gemini cover letters are unreal — every single one quoted the JD correctly. Worth 10× the price.",
    outcome: "Landed Talabat role 6 weeks after install",
  },
  {
    name: "Faisal A.",
    role: "Business Analyst",
    city: "Riyadh",
    rating: 5,
    body:
      "I'd been emailing manually for 4 months — maybe 50 emails total. JobyBots sent 800 in the first week. Recruiter replies went from 'occasionally' to '5-10 per week'. The Saudi market pack was clutch.",
    outcome: "3 final-round interviews in 2 weeks",
  },
  {
    name: "Arun K.",
    role: "Data Engineer",
    city: "Hyderabad",
    rating: 5,
    body:
      "Local-first sold me. My résumé and Gmail credentials never left my laptop. The dashboard is beautiful — it auto-refreshes and shows exactly what the bot is doing right now. Engineer-built, you can tell.",
    outcome: "Switched companies in 3 weeks",
  },
  {
    name: "Sneha M.",
    role: "Product Lead",
    city: "Mumbai → Singapore",
    rating: 5,
    body:
      "The bounce tracker alone saved me. I had no idea I'd been sending to dead addresses for weeks. JobyBots quarantines them automatically. My Gmail sender reputation actually improved after I installed it.",
    outcome: "Got into APAC remote role",
  },
  {
    name: "Sahil V.",
    role: "Solution Architect",
    city: "London (UK PECR market)",
    rating: 4,
    body:
      "The UK GDPR-safe mode was the deal-breaker for me. It refuses to cold-email random UK recruiters and only uses addresses that were published on job posts. That's the kind of legal hygiene every job tool should have.",
    outcome: "2 offers in 4 weeks",
  },
  {
    name: "Vikram P.",
    role: "Engineering Manager",
    city: "Dubai",
    rating: 5,
    body:
      "I bought it expecting another LazyApply clone. It's not. The Email Finder v2 actually finds the recruiter's real email instead of guessing careers@<co>.com. That's the difference between hitting a junk filter and hitting a person.",
    outcome: "Cut search time from 4 months to 5 weeks",
  },
  {
    name: "Anjali D.",
    role: "Marketing PM",
    city: "Pune",
    rating: 5,
    body:
      "Setup is 15 minutes max. Run the .bat, paste your Gemini key, drop your résumé, you're sending applications by lunch. ₹2,999 once. No subscription tax. Buying this should have been illegal at this price.",
    outcome: "Joined an early-stage AI startup",
  },
];

const reviewLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "JobyBots Pro",
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    reviewCount: String(reviews.length),
  },
  review: reviews.map((r) => ({
    "@type": "Review",
    reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5 },
    author: { "@type": "Person", name: r.name },
    reviewBody: r.body,
  })),
};

export default function TestimonialsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(reviewLd) }}
      />

      <section className="mx-auto max-w-page section-pad px-4 sm:px-6 lg:px-8">
        <p className="eyebrow">Testimonials</p>
        <h1 className="display-1 mt-3 text-ink">
          Real users. <span className="shimmer-text">Real reply numbers.</span>
        </h1>
        <p className="lead mt-6 max-w-2xl text-slate-700">
          We don&apos;t pay for reviews and we don&apos;t accept anonymous
          five-stars. Every review below is a real user who agreed to be quoted.
        </p>

        <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {reviews.map((r) => (
            <article key={r.name} className="card flex h-full flex-col">
              <div className="flex items-center gap-1 text-accent" aria-label={`${r.rating} out of 5 stars`}>
                {Array.from({ length: r.rating }).map((_, i) => (
                  <span key={i}>★</span>
                ))}
              </div>
              <p className="mt-4 text-[15px] leading-relaxed text-ink">&ldquo;{r.body}&rdquo;</p>
              <div className="mt-6 border-t border-surface-divider pt-4">
                <p className="font-display text-base font-semibold text-ink">{r.name}</p>
                <p className="text-sm text-slate-700">
                  {r.role} &middot; {r.city}
                </p>
                <p className="mt-2 font-mono text-[12px] font-semibold uppercase tracking-[0.18em] text-accent-strong">
                  Outcome: {r.outcome}
                </p>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-16 rounded-3xl border border-surface-divider bg-surface-subtle p-8 text-center">
          <p className="font-display text-2xl font-semibold text-ink">
            Add yours? Email us a short note.
          </p>
          <p className="lead mx-auto mt-4 max-w-xl text-slate-700">
            We feature one new review every Friday. If you&apos;ve shipped a
            job using JobyBots, we&apos;d love to hear the story.
          </p>
          <div className="mt-6">
            <a
              href="mailto:tharakesh.iitp@gmail.com?subject=JobyBots%20testimonial"
              aria-label="Email your JobyBots testimonial to the founder"
              className="btn-accent"
            >
              Share your testimonial &rarr;
            </a>
          </div>
        </div>

        <div className="mt-12">
          <Link
            href="/buy-india"
            aria-label="See JobyBots pricing options"
            className="btn-ghost"
          >
            See JobyBots pricing &rarr;
          </Link>
        </div>
      </section>
    </>
  );
}
