import type { Metadata } from "next";
import Link from "next/link";
import { changelog } from "@/lib/changelog";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://jobybots.com";

export const metadata: Metadata = {
  title: "Changelog · JobyBots",
  description:
    "What's new in JobyBots — every shipped release, written for humans. Updated whenever a tag lands on main.",
  alternates: { canonical: `${SITE_URL}/changelog` },
};

const TAG_LABEL: Record<string, string> = {
  release:  "Release",
  feature:  "Feature",
  fix:      "Fix",
  docs:     "Docs",
  infra:    "Infra",
};

const TAG_COLOR: Record<string, string> = {
  release:  "bg-accent/15 text-accent-strong",
  feature:  "bg-emerald-100 text-emerald-800",
  fix:      "bg-blue-100 text-blue-800",
  docs:     "bg-slate-200 text-slate-800",
  infra:    "bg-purple-100 text-purple-800",
};

export default function ChangelogPage() {
  return (
    <section className="mx-auto max-w-page section-pad px-4 sm:px-6 lg:px-8">
      <p className="eyebrow">Changelog</p>
      <h1 className="display-1 mt-3 text-ink">
        Every <span className="shimmer-text">shipped change</span>, written for humans.
      </h1>
      <p className="lead mt-6 max-w-2xl text-slate-700">
        We don&apos;t hide releases behind a customer portal. Every feature,
        every fix, every market pack lives below.
      </p>

      <div className="mt-14 space-y-12">
        {changelog.map((entry) => (
          <article
            key={entry.version}
            className="rounded-3xl border border-surface-divider bg-white p-8 shadow-card"
          >
            <header className="flex flex-wrap items-baseline gap-4">
              <span className="font-mono text-sm font-semibold text-ink">
                {entry.version}
              </span>
              <span className="text-sm text-slate-700">
                {new Date(entry.date).toLocaleDateString("en-GB", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
              <span
                className={`rounded-full px-3 py-1 text-[12px] font-semibold ${TAG_COLOR[entry.tag] || "bg-slate-200 text-slate-800"}`}
              >
                {TAG_LABEL[entry.tag] || entry.tag}
              </span>
            </header>
            <h2 className="mt-4 font-display text-2xl font-semibold text-ink">
              {entry.title}
            </h2>
            <ul className="mt-5 list-disc space-y-2 pl-6 text-[15px] leading-relaxed text-ink">
              {entry.bullets.map((b) => <li key={b}>{b}</li>)}
            </ul>
          </article>
        ))}
      </div>

      <div className="mt-16 text-center">
        <Link
          href="/buy-india"
          aria-label="Buy JobyBots Pro lifetime license for 2,999 rupees"
          className="btn-accent"
        >
          See what&apos;s possible &mdash; &#8377;2,999 lifetime &rarr;
        </Link>
      </div>
    </section>
  );
}
