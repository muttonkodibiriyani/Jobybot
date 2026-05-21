import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { blogPosts, blogBySlug, type BlogSection } from "@/lib/blog-posts";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://jobybots.com";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return blogPosts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = blogBySlug[slug];
  if (!post) return { title: "Not found" };
  return {
    title: post.metaTitle,
    description: post.description,
    alternates: { canonical: `${SITE_URL}/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.metaTitle,
      description: post.description,
      url: `${SITE_URL}/blog/${post.slug}`,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt || post.publishedAt,
      tags: post.tags,
      authors: [post.author.name],
    },
    twitter: {
      card: "summary_large_image",
      title: post.metaTitle,
      description: post.description,
    },
  };
}

function Section({ s }: { s: BlogSection }) {
  switch (s.type) {
    case "p":
      return <p className="my-5 text-[17px] leading-relaxed text-ink">{s.text}</p>;
    case "h2":
      return <h2 className="mt-12 mb-4 font-display text-3xl font-semibold text-ink">{s.text}</h2>;
    case "h3":
      return <h3 className="mt-8 mb-3 font-display text-2xl font-semibold text-ink">{s.text}</h3>;
    case "ul":
      return (
        <ul className="my-5 list-disc space-y-2 pl-6 text-[17px] leading-relaxed text-ink">
          {s.items.map((i) => <li key={i}>{i}</li>)}
        </ul>
      );
    case "ol":
      return (
        <ol className="my-5 list-decimal space-y-2 pl-6 text-[17px] leading-relaxed text-ink">
          {s.items.map((i) => <li key={i}>{i}</li>)}
        </ol>
      );
    case "quote":
      return (
        <blockquote className="my-8 border-l-4 border-accent bg-surface-subtle px-6 py-5 italic text-ink">
          {s.text}
          {s.attribution && (
            <footer className="mt-3 text-sm not-italic text-ink-muted">— {s.attribution}</footer>
          )}
        </blockquote>
      );
    case "code":
      return (
        <pre className="my-6 overflow-x-auto rounded-2xl bg-ink p-5 text-sm text-white">
          <code>{s.text}</code>
        </pre>
      );
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const post = blogBySlug[slug];
  if (!post) notFound();

  const postUrl = `${SITE_URL}/blog/${post.slug}`;
  const postLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt || post.publishedAt,
    author: {
      "@type": "Person",
      name: post.author.name,
      url: post.author.url ? `${SITE_URL}${post.author.url}` : undefined,
    },
    publisher: {
      "@type": "Organization",
      name: "JobyBots",
      logo: { "@type": "ImageObject", url: `${SITE_URL}/jobybots-logo.png` },
    },
    mainEntityOfPage: postUrl,
    url: postUrl,
    keywords: post.tags.join(", "),
  };

  return (
    <article className="mx-auto max-w-3xl section-pad px-4 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(postLd) }}
      />

      <nav aria-label="breadcrumb" className="text-sm text-ink-muted">
        <Link href="/" className="hover:text-ink">Home</Link>
        <span aria-hidden> / </span>
        <Link href="/blog" className="hover:text-ink">Blog</Link>
        <span aria-hidden> / </span>
        <span className="text-ink">{post.title}</span>
      </nav>

      <header className="mt-8">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
          {new Date(post.publishedAt).toLocaleDateString("en-GB", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}{" "}
          · {post.readingTimeMin} min read · by {post.author.name}
        </p>
        <h1 className="display-1 mt-4 text-ink">{post.title}</h1>
        <p className="lead mt-6">{post.description}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {post.tags.map((t) => (
            <span
              key={t}
              className="rounded-full bg-surface-subtle px-3 py-1 text-[11px] font-medium text-ink-muted"
            >
              #{t}
            </span>
          ))}
        </div>
      </header>

      <div className="prose mt-10">
        {post.body.map((s, i) => <Section key={i} s={s} />)}
      </div>

      <footer className="mt-16 rounded-3xl border border-surface-divider bg-surface-subtle p-8">
        <p className="font-display text-xl font-semibold text-ink">
          Built and operated by Darapu Tharakeswara Reddy in Dubai.
        </p>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">
          If this post helped you, the easiest thank-you is a one-time ₹2,999 for the
          tool we built around these ideas. 7-day refund if it isn't for you.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/buy-india" className="btn-accent">Get JobyBots →</Link>
          <Link href="/blog" className="btn-ghost">More posts</Link>
        </div>
      </footer>
    </article>
  );
}
