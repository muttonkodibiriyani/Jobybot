import type { Metadata } from "next";
import Link from "next/link";
import { blogPosts } from "@/lib/blog-posts";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://jobybots.com";

export const metadata: Metadata = {
  title: "Blog · JobyBots",
  description:
    "Strategic playbooks, hiring-market data, and AI cover-letter benchmarks from the team building JobyBots — the local-first AI job hunter.",
  alternates: { canonical: `${SITE_URL}/blog` },
};

export default function BlogIndex() {
  return (
    <section className="mx-auto max-w-page section-pad px-4 sm:px-6 lg:px-8">
      <p className="eyebrow">Blog</p>
      <h1 className="display-1 mt-3 text-ink">
        Field reports from the <span className="shimmer-text">AI job-hunting</span> frontier.
      </h1>
      <p className="lead mt-6 max-w-2xl text-slate-700">
        Real data, real numbers, real money. Everything we publish is grounded
        in the 12,500+ applications JobyBots has shipped on behalf of users.
      </p>

      <div className="mt-14 grid gap-8 md:grid-cols-2 xl:grid-cols-3">
        {blogPosts.map((p) => (
          <article
            key={p.slug}
            className="card flex h-full flex-col justify-between transition-transform hover:-translate-y-0.5 hover:shadow-card"
          >
            <div>
              <p className="font-mono text-[12px] font-semibold uppercase tracking-[0.18em] text-accent-strong">
                {new Date(p.publishedAt).toLocaleDateString("en-GB", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}{" "}
                &middot; {p.readingTimeMin} min read
              </p>
              <h2 className="mt-4 font-display text-2xl font-semibold text-ink">
                <Link
                  href={`/blog/${p.slug}`}
                  aria-label={`Read article: ${p.title}`}
                  className="hover:text-accent"
                >
                  {p.title}
                </Link>
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-slate-700">
                {p.description}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {p.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-surface-subtle px-3 py-1 text-[12px] font-semibold text-slate-700"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>
            <Link
              href={`/blog/${p.slug}`}
              aria-label={`Continue reading: ${p.title}`}
              className="mt-8 font-display text-sm font-semibold text-accent-strong hover:text-accent"
            >
              Read full article &rarr;
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
