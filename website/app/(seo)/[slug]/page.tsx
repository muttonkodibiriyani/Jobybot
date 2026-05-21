import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { seoPages, seoBySlug } from "@/lib/seo-pages";
import { PAYMENT } from "@/lib/config";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://jobybots.com";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return seoPages.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = seoBySlug[slug];
  if (!page) return { title: "Not found" };
  return {
    title: page.metaTitle,
    description: page.metaDescription,
    alternates: { canonical: `${SITE_URL}/${page.slug}` },
    openGraph: {
      title: page.metaTitle,
      description: page.metaDescription,
      url: `${SITE_URL}/${page.slug}`,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: page.metaTitle,
      description: page.metaDescription,
    },
  };
}

export default async function SeoLandingPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const page = seoBySlug[slug];
  if (!page) notFound();

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: page.faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: page.title,
        item: `${SITE_URL}/${page.slug}`,
      },
    ],
  };

  const compareLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `JobyBots vs ${page.competitorName}`,
    description: page.metaDescription,
    brand: { "@type": "Brand", name: "JobyBots" },
    offers: {
      "@type": "Offer",
      price: "2999",
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
      url: `${SITE_URL}/buy-india`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(compareLd) }}
      />

      {/* Hero */}
      <section className="mx-auto max-w-page section-pad px-4 sm:px-6 lg:px-8">
        <nav aria-label="breadcrumb" className="text-sm text-ink-muted">
          <Link href="/" className="hover:text-ink">Home</Link>
          <span aria-hidden> / </span>
          <span className="text-ink">{page.title}</span>
        </nav>

        <h1 className="display-1 mt-6 text-ink">{page.h1}</h1>
        <p className="lead mt-6 max-w-3xl">{page.heroBlurb}</p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/buy-india" className="btn-accent">
            {page.cta} · ₹{PAYMENT.amountInr.toLocaleString("en-IN")}
            <span aria-hidden>→</span>
          </Link>
          <Link href="/#watch-demo" className="btn-outline">
            Watch the 2-min demo
          </Link>
        </div>
      </section>

      {/* Key answer (featured snippet bait) */}
      <section className="border-y border-surface-divider bg-surface-subtle">
        <div className="mx-auto max-w-page section-pad px-4 sm:px-6 lg:px-8">
          <p className="eyebrow">Short answer</p>
          <p className="mt-3 max-w-4xl text-xl leading-relaxed text-ink">
            {page.keyAnswer}
          </p>
        </div>
      </section>

      {/* Bullets */}
      <section className="mx-auto max-w-page section-pad px-4 sm:px-6 lg:px-8">
        <h2 className="display-2 text-ink">
          Why <span className="shimmer-text">JobyBots</span> wins this category
        </h2>
        <ul className="mt-10 grid gap-5 sm:grid-cols-2">
          {page.bullets.map((b) => (
            <li
              key={b}
              className="card flex items-start gap-3 text-[15px] leading-relaxed text-ink"
            >
              <span aria-hidden className="mt-1 text-accent">✓</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Comparison */}
      <section className="border-y border-surface-divider bg-surface-subtle">
        <div className="mx-auto max-w-page section-pad px-4 sm:px-6 lg:px-8">
          <h2 className="display-2 text-ink">
            {page.competitorName} <span className="text-ink-muted">vs</span> JobyBots
          </h2>
          <p className="lead mt-5 max-w-3xl">
            Public pricing pages and product docs, last verified May 2026.
          </p>

          <div className="mt-10 overflow-x-auto rounded-3xl border border-surface-divider bg-white shadow-card">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-surface-subtle">
                <tr>
                  <th className="px-5 py-4 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-muted">
                    Feature
                  </th>
                  <th className="px-5 py-4 font-display text-base font-semibold text-ink-muted">
                    {page.competitorName}{" "}
                    <span className="text-xs font-normal">({page.competitorPrice})</span>
                  </th>
                  <th className="px-5 py-4 font-display text-base font-semibold text-accent">
                    JobyBots{" "}
                    <span className="text-xs font-normal">({page.jobybotsPrice})</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {page.comparison.map((row, i) => (
                  <tr
                    key={row.feature}
                    className={i % 2 === 0 ? "bg-white" : "bg-surface-subtle/40"}
                  >
                    <td className="px-5 py-4 font-medium text-ink">{row.feature}</td>
                    <td className="px-5 py-4 text-ink-muted">{row.competitor}</td>
                    <td className="px-5 py-4 font-medium text-ink">{row.jobybots}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-page section-pad px-4 sm:px-6 lg:px-8">
        <h2 className="display-2 text-ink">FAQ</h2>
        <div className="mx-auto mt-10 max-w-3xl space-y-3">
          {page.faq.map((f) => (
            <details
              key={f.q}
              className="group rounded-2xl border border-surface-divider bg-white p-5 shadow-xs"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                <span className="font-display text-lg font-semibold text-ink">{f.q}</span>
                <span
                  aria-hidden
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-surface-divider text-ink-muted transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-4 text-[15px] leading-relaxed text-ink-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-page px-4 pb-24 text-center sm:px-6 lg:px-8 lg:pb-32">
        <h2 className="display-2 text-ink">
          Ready to <span className="shimmer-text">switch</span>?
        </h2>
        <p className="lead mx-auto mt-5 max-w-xl">
          Pay once. Lifetime license. 7-day refund if it isn't for you.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link href="/buy-india" className="btn-accent">
            {page.cta} · ₹{PAYMENT.amountInr.toLocaleString("en-IN")}
            <span aria-hidden>→</span>
          </Link>
          <Link href="/pricing" className="btn-outline">
            Pay by card ($49)
          </Link>
        </div>
      </section>
    </>
  );
}
