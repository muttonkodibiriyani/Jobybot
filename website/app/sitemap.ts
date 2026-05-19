import type { MetadataRoute } from "next";

const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://jobybots.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${base}/`,           lastModified: now, changeFrequency: "weekly",  priority: 1.0 },
    { url: `${base}/pricing`,    lastModified: now, changeFrequency: "weekly",  priority: 0.9 },
    { url: `${base}/buy-india`,  lastModified: now, changeFrequency: "weekly",  priority: 0.9 },
    { url: `${base}/signup`,     lastModified: now, changeFrequency: "weekly",  priority: 0.8 },
    { url: `${base}/demo`,       lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/faq`,        lastModified: now, changeFrequency: "weekly",  priority: 0.8 },
    { url: `${base}/refund`,     lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/terms`,      lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
    { url: `${base}/privacy`,    lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
  ];
}
