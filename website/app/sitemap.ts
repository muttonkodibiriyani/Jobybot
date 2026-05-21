import type { MetadataRoute } from "next";
import { seoPages } from "@/lib/seo-pages";
import { blogPosts } from "@/lib/blog-posts";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://jobybots.com";

const STATIC_ROUTES: Array<{ path: string; priority?: number; freq?: MetadataRoute.Sitemap[number]["changeFrequency"] }> = [
  { path: "/",            priority: 1.0,  freq: "weekly"  },
  { path: "/demo",        priority: 0.9,  freq: "weekly"  },
  { path: "/install",     priority: 0.9,  freq: "monthly" },
  { path: "/pricing",     priority: 0.9,  freq: "monthly" },
  { path: "/buy-india",   priority: 0.9,  freq: "monthly" },
  { path: "/dashboard",   priority: 0.7,  freq: "monthly" },
  { path: "/faq",         priority: 0.8,  freq: "monthly" },
  { path: "/about",       priority: 0.7,  freq: "monthly" },
  { path: "/wins",        priority: 0.8,  freq: "weekly"  },
  { path: "/testimonials",priority: 0.6,  freq: "monthly" },
  { path: "/press",       priority: 0.5,  freq: "monthly" },
  { path: "/changelog",   priority: 0.5,  freq: "monthly" },
  { path: "/signup",      priority: 0.5,  freq: "monthly" },
  { path: "/refund",      priority: 0.4,  freq: "yearly"  },
  { path: "/privacy",     priority: 0.4,  freq: "yearly"  },
  { path: "/terms",       priority: 0.4,  freq: "yearly"  },
  { path: "/blog",        priority: 0.7,  freq: "weekly"  },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: now,
    changeFrequency: r.freq,
    priority: r.priority,
  }));

  const seoEntries: MetadataRoute.Sitemap = seoPages.map((p) => ({
    url: `${SITE_URL}/${p.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const blogEntries: MetadataRoute.Sitemap = blogPosts.map((p) => ({
    url: `${SITE_URL}/blog/${p.slug}`,
    lastModified: p.updatedAt ? new Date(p.updatedAt) : now,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticEntries, ...seoEntries, ...blogEntries];
}
