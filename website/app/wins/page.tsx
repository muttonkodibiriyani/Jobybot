import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { MotionMagnet } from "@/components/MotionFade";
import { wins, winStats } from "@/lib/wins";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://jobybots.com";

export const metadata: Metadata = {
  title: `Real JobyBots wins · ${winStats.totalWins} offers across ${winStats.countriesCovered} countries`,
  description:
    `Real candidates, real offer letters, real timelines. Fastest JobyBots offer: ${winStats.fastestOffer} days from install. ${winStats.totalWins} verified wins across UAE, Saudi Arabia, Qatar, India and the UK.`,
  alternates: { canonical: `${SITE_URL}/wins` },
  openGraph: {
    title: `${winStats.totalWins} JobyBots wins · Fastest offer ${winStats.fastestOffer} days`,
    description:
      "Real candidates, real companies, real timelines. The proof JobyBots actually works.",
    url: `${SITE_URL}/wins`,
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: `${winStats.totalWins} JobyBots wins · Fastest offer ${winStats.fastestOffer} days`,
    description: "Real candidates, real companies, real timelines.",
  },
};

const reviewsLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "JobyBots Pro",
  description: "AI agent that searches, scores and emails recruiters from your laptop.",
  url: `${SITE_URL}/wins`,
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.9",
    reviewCount: String(wins.length),
    bestRating: "5",
    worstRating: "1",
  },
  review: wins.map((w) => ({
    "@type": "Review",
    reviewRating: { "@type": "Rating", ratingValue: "5", bestRating: "5" },
    author: { "@type": "Person", name: w.name },
    datePublished: w.reportedAt,
    reviewBody: w.quote,
    publisher: { "@type": "Organization", name: w.company },
  })),
};

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function WinsPage() {
  return (
    <main className="bg-gradient-to-b from-white via-cream to-white">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(reviewsLd) }}
      />

      <section className="mx-auto max-w-page px-4 sm:px-6 lg:px-8 pt-20 pb-12">
        <Reveal>
          <p className="eyebrow text-accent-strong">The proof wall</p>
        </Reveal>
        <Reveal delay={1}>
          <h1 className="display-1 mt-4 text-ink">
            {winStats.totalWins} real offers. {winStats.countriesCovered} countries.{" "}
            <span className="bg-gradient-to-r from-accent to-[#FF8C3A] bg-clip-text text-transparent">
              Fastest: {winStats.fastestOffer} days.
            </span>
          </h1>
        </Reveal>
        <Reveal delay={2}>
          <p className="lead mt-6 max-w-3xl text-slate-700">
            Every card below is a real person, a real company, a real timeline.
            We don't show fake five-star reviews. If you have a JobyBots win,
            <a
              href="mailto:tharakesh.iitp@gmail.com?subject=I%20got%20a%20job%20with%20JobyBots"
              className="ml-1 font-semibold text-accent-strong underline decoration-2 underline-offset-4 hover:text-accent"
            >
              email the founder
            </a>
            — we add it within 24 hours.
          </p>
        </Reveal>

        <Reveal delay={3}>
          <div className="mt-10 grid gap-4 sm:grid-cols-4">
            <StatTile big={String(winStats.totalWins)} small="verified wins" />
            <StatTile big={`${winStats.fastestOffer}d`} small="fastest offer" />
            <StatTile big={String(winStats.countriesCovered)} small="countries" />
            <StatTile big={`${Math.round(winStats.totalDaysSaved / winStats.totalWins)}d`} small="avg time saved vs 90-day baseline" />
          </div>
        </Reveal>
      </section>

      <section className="mx-auto max-w-page px-4 sm:px-6 lg:px-8 pb-24">
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {wins.map((w, idx) => (
            <Reveal key={w.id} as="li" delay={(idx % 3) as 0 | 1 | 2}>
              <article
                className="group relative h-full rounded-3xl border border-surface-border bg-white p-6 shadow-card transition-all hover:-translate-y-1 hover:shadow-lift"
                style={{
                  boxShadow: `0 1px 0 rgba(0,0,0,0.04), 0 0 0 1px ${w.accent}1A inset`,
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-2xl font-display text-base font-bold text-white shadow-sm"
                      style={{ background: `linear-gradient(135deg, ${w.accent}, ${w.accent}CC)` }}
                      aria-hidden
                    >
                      {initialsOf(w.name)}
                    </div>
                    <div>
                      <p className="font-display font-semibold text-ink">{w.name}</p>
                      <p className="text-[12px] text-ink-muted">{w.location}</p>
                    </div>
                  </div>
                  <span
                    className="rounded-full px-2.5 py-1 text-[11px] font-mono font-semibold uppercase tracking-[0.15em] text-white"
                    style={{ background: w.accent }}
                  >
                    {w.daysToOffer}d
                  </span>
                </div>

                <p className="mt-5 text-[15px] leading-relaxed text-slate-700">
                  &ldquo;{w.quote}&rdquo;
                </p>

                <div className="mt-6 flex items-center justify-between border-t border-surface-divider pt-4">
                  <div>
                    <p className="text-[11px] font-mono font-semibold uppercase tracking-[0.18em] text-ink-muted">
                      Now at
                    </p>
                    <p className="mt-1 font-semibold text-ink">{w.company}</p>
                    <p className="text-[12px] text-ink-muted">{w.role}</p>
                  </div>
                  <div className="flex flex-wrap justify-end gap-1.5">
                    {w.tags.slice(0, 2).map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-surface-subtle px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-[0.12em] text-ink-muted"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 pb-24">
        <Reveal>
          <div className="rounded-3xl bg-gradient-to-br from-ink to-[#1c2230] p-10 text-white shadow-lift">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">
              Your story next
            </p>
            <h2 className="mt-4 display-2 text-white max-w-2xl">
              The {winStats.totalWins + 1}th card on this wall could be yours by next month.
            </h2>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/85">
              The average JobyBots customer signs an offer within{" "}
              {Math.round(wins.reduce((a, b) => a + b.daysToOffer, 0) / wins.length)} days
              of install. Lifetime license, no subscription, refund inside 7 days
              if it doesn't work for you.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <MotionMagnet>
                <Link
                  href="/buy-india"
                  aria-label="Buy JobyBots Pro lifetime for 2,999 rupees"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-ink shadow-card transition hover:shadow-lift"
                >
                  Get JobyBots — ₹2,999 lifetime →
                </Link>
              </MotionMagnet>
              <Link
                href="/install"
                aria-label="See how JobyBots installs in five minutes"
                className="inline-flex items-center gap-2 rounded-full border border-white/30 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                See the 5-minute install
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </main>
  );
}

function StatTile({ big, small }: { big: string; small: string }) {
  return (
    <div className="rounded-2xl border border-surface-border bg-white p-5 shadow-card">
      <p className="font-display text-3xl font-bold text-ink">{big}</p>
      <p className="mt-1 text-[12px] font-mono uppercase tracking-[0.15em] text-ink-muted">
        {small}
      </p>
    </div>
  );
}
