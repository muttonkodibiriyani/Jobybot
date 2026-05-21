/**
 * Public changelog.
 *
 * Auto-regeneratable from `git log` via `scripts/regen-changelog.ts`, but the
 * file is checked-in as plain TS so the website builds without git access
 * (Vercel builds without a .git directory).
 */

export type ChangelogEntry = {
  version: string;
  date: string;
  title: string;
  tag: "release" | "feature" | "fix" | "docs" | "infra";
  bullets: string[];
};

export const changelog: ChangelogEntry[] = [
  {
    version: "v1.4.0",
    date: "2026-05-22",
    title: "Deliverability + GCC expansion + SEO overhaul",
    tag: "release",
    bullets: [
      "Rewrote core/bounce_tracker.py — broader sender allow-list, modern Gmail RCPT regex, subject-correlation fallback. Backfill quarantined 230+ historical bounces.",
      "Added core/email_finder_v2.py with 5-tier waterfall: cache → careers-page scrape → LinkedIn poster lookup → country-aware patterns → SMTP RCPT probe.",
      "Added 12 rotating subject templates (core/subjects.py) — no two emails per cycle share a subject. Major Gmail-deliverability win.",
      "AI cover-letter writer now opens with the recruiter's first name when known (LinkedIn discovery) and quotes ONE JD requirement.",
      "Five new market files: primary_saudi.json, primary_qatar.json, primary_oman.json, primary_bahrain.json, primary_uk.json (GDPR-hybrid).",
      "Homepage hero now embeds a 2-minute demo video (https://youtu.be/fwKCITDa2MM).",
      "Full SEO foundation: app/sitemap.ts, robots.ts, Organization + Product + WebSite + VideoObject + FAQPage JSON-LD on /.",
      "12 programmatic SEO landing pages (LazyApply / Sonara / Workday / UAE / Saudi / Qatar / UK / etc.).",
      "5 long-form blog posts (1,500-2,500 words each).",
      "/about, /testimonials, /press, /changelog EEAT pages.",
      "Lighthouse CI workflow target: Perf ≥ 90 / a11y ≥ 95 / BP ≥ 95 / SEO 100.",
    ],
  },
  {
    version: "v1.3.0",
    date: "2026-05-08",
    title: "Dashboard live-status + India market pack",
    tag: "feature",
    bullets: [
      "Dashboard now shows a live banner: 'Searching all 7 sources right now', 'Just sent: <recipient>', etc., based on the run-log freshness.",
      "Added India market pack with 82 curated contacts (Mumbai, Bangalore, Hyderabad, Pune, Delhi NCR).",
      "/buy-india page with UPI QR code for instant payment.",
    ],
  },
  {
    version: "v1.2.0",
    date: "2026-04-21",
    title: "Gemini AI scoring + cover letters",
    tag: "feature",
    bullets: [
      "Every job is scored 0-100 by Gemini Flash against the user's résumé embedding.",
      "Jobs above 70 get a tailored 4-6 sentence cover letter quoting the JD.",
      "Groq Llama 3.3 fallback if Gemini quota is exhausted.",
    ],
  },
  {
    version: "v1.1.0",
    date: "2026-04-02",
    title: "GDPR-safe market routing",
    tag: "feature",
    bullets: [
      "Germany, Netherlands, Ireland, Sweden auto-treated as 'apply via official site only' — never cold-emailed.",
      "GDPR-hybrid mode for the UK (legitimate-interest contacts only).",
      "Per-market metadata in markets/*.json: gdpr_strict, visa_note, demand summary.",
    ],
  },
  {
    version: "v1.0.0",
    date: "2026-03-15",
    title: "Public launch",
    tag: "release",
    bullets: [
      "7-source job crawler: LinkedIn, Indeed, Naukrigulf, Bayt, GulfTalent, RemoteOK, company careers ATS (Greenhouse / Lever / Workable / Ashby).",
      "Gmail SMTP sender with daily cap, randomised delays, follow-up scheduler.",
      "Local SQLite database — no SaaS, no uploads.",
      "Browser dashboard auto-refreshing every 15 seconds.",
    ],
  },
];
