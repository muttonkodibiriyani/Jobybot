import { NextResponse } from "next/server";
import { seoPages } from "@/lib/seo-pages";
import { blogPosts } from "@/lib/blog-posts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * IndexNow ping endpoint.
 *
 * Tells Bing (and therefore ChatGPT search / Copilot / DuckDuckGo / Yandex)
 * about new or updated URLs INSTANTLY, instead of waiting weeks for a normal
 * crawl. This is a free open protocol every modern non-Google engine supports.
 *
 * Trigger by:
 *   GET /api/indexnow                           -> pings all known URLs
 *   GET /api/indexnow?url=/install              -> pings one URL
 *   GET /api/indexnow?secret=XYZ&host=...       -> custom host
 *
 * Optional CRON_SECRET env var protects bulk runs. Single-URL pings are open
 * so users can copy a link and refresh the index from a phone if needed.
 */

const INDEXNOW_KEY =
  process.env.INDEXNOW_KEY ??
  "87bae8d256e500b7373c52700615730a84e6e838f3f44b66dc919e632e73fccd";

const SITE_HOST =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/^https?:\/\//, "").replace(/\/$/, "") ??
  "jobybots.com";

const SITE_URL = `https://${SITE_HOST}`;

const STATIC_PATHS = [
  "/",
  "/demo",
  "/install",
  "/pricing",
  "/buy-india",
  "/about",
  "/testimonials",
  "/press",
  "/changelog",
  "/wins",
  "/faq",
  "/blog",
  "/refund",
  "/privacy",
  "/terms",
];

function allKnownUrls(): string[] {
  const urls = new Set<string>();
  for (const p of STATIC_PATHS) urls.add(SITE_URL + p);
  for (const s of seoPages) urls.add(`${SITE_URL}/${s.slug}`);
  for (const b of blogPosts) urls.add(`${SITE_URL}/blog/${b.slug}`);
  return Array.from(urls);
}

async function pingIndexNow(urlList: string[]): Promise<{
  ok: boolean;
  status: number;
  count: number;
  responses: Array<{ engine: string; status: number; ok: boolean }>;
}> {
  // Chunk: IndexNow allows up to 10,000 URLs per request, but small batches
  // are more reliable across all engines.
  const body = {
    host: SITE_HOST,
    key: INDEXNOW_KEY,
    keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
    urlList,
  };

  // Bing is the official endpoint; api.indexnow.org fans it out to the rest
  // (Yandex, Naver, etc) — we hit both for redundancy.
  const endpoints = [
    { engine: "Bing",     url: "https://www.bing.com/indexnow" },
    { engine: "IndexNow", url: "https://api.indexnow.org/IndexNow" },
  ];

  const responses = await Promise.all(
    endpoints.map(async (ep) => {
      try {
        const res = await fetch(ep.url, {
          method: "POST",
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body: JSON.stringify(body),
        });
        return { engine: ep.engine, status: res.status, ok: res.ok };
      } catch {
        return { engine: ep.engine, status: 0, ok: false };
      }
    }),
  );

  const ok = responses.some((r) => r.ok);
  return {
    ok,
    status: responses[0]?.status ?? 0,
    count: urlList.length,
    responses,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const single = searchParams.get("url");
  const secret = searchParams.get("secret");

  // Single-URL mode is open (no secret).
  if (single) {
    const target = single.startsWith("http")
      ? single
      : `${SITE_URL}${single.startsWith("/") ? "" : "/"}${single}`;
    const result = await pingIndexNow([target]);
    return NextResponse.json({ ok: result.ok, target, result });
  }

  // Bulk mode requires the CRON_SECRET (env-set in GitHub + Vercel).
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ ok: false, error: "secret required" }, { status: 401 });
  }

  const urls = allKnownUrls();
  const result = await pingIndexNow(urls);
  return NextResponse.json({
    ok: result.ok,
    pinged: result.count,
    sample: urls.slice(0, 5),
    result,
  });
}

export async function POST(request: Request) {
  const auth = request.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  let urls: string[] = [];
  try {
    const body = await request.json();
    urls = Array.isArray(body?.urls) ? body.urls : [];
  } catch {
    /* no body */
  }
  if (urls.length === 0) urls = allKnownUrls();
  const result = await pingIndexNow(urls);
  return NextResponse.json({ ok: result.ok, pinged: result.count, result });
}
