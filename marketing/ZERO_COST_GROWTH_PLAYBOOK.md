# JobyBots — Zero-Cost Growth Playbook

> Goal: get JobyBots from "1 day ago" obscure Google result to **trending in 30 days**, without spending a rupee on ads.

The path is not magic. It is six deliberate moves done in order. The first five cost only time. The sixth costs ₹0–₹500. Total expected reach: **150,000–500,000 organic impressions** in 30 days based on comparable indie launches (Lazyapply, Sonara, Reverse Recruiter).

---

## Move 1 — IndexNow blitz (today, 2 minutes)

We just shipped `/api/indexnow`. The first time you call it, Bing's index updates within **5–60 minutes**, and ChatGPT search, Copilot, DuckDuckGo and Yandex follow within 24h. Google takes its own sweet time but **you stop being invisible on every non-Google engine immediately**.

```bash
# One curl call. Pings Bing + IndexNow.org for ALL known URLs.
curl "https://jobybots.com/api/indexnow?secret=YOUR_CRON_SECRET"
```

Run this after **every** deploy. Add it to your `BUILD_VIDEO.bat`-style helpers, or wire a Vercel cron once a day.

Why this matters: Bing powers ChatGPT's "Browse the web" tool. If you appear in Bing, you appear in **ChatGPT answers** — which is the new top-of-funnel.

---

## Move 2 — The HackerNews "Show HN" launch (this week)

The Show HN post template lives in `marketing/HACKERNEWS_LAUNCH.md`. Read it once.

**Timing**:
- Submit Tuesday or Wednesday, 8:00 AM US Eastern (13:00 UTC).
- Have 2-3 friends with HN accounts ready to upvote in the first 10 minutes (not 100, just 2-3 — algorithm rewards velocity, not volume).
- Be glued to comments for the next 4 hours. Reply to every single one.

**Expected outcome on a strong launch**: 200–800 upvotes, 50–300 comments, **5,000–25,000 unique visitors in 24h**, **100–300 GitHub stars**.

A successful Show HN gets you onto:
- Hacker News front page (4-12 hours)
- HN newsletter the next morning
- TLDR, Hackernoon, "What I Learned This Week" newsletters
- Twitter/X tech-launch accounts (auto-scraped)
- Reddit r/programming front page (sometimes)
- Product Hunt's "Coming soon" suggestions

---

## Move 3 — LinkedIn native video the same day (highest organic reach)

LinkedIn's algorithm gives **native video uploads** ~10× the reach of links or articles. Upload `releases/jobybots-60s.mp4` directly (not a YouTube link).

Post copy (`marketing/LINKEDIN_LAUNCH_POST.md`):
- First 2 lines must hook (LinkedIn truncates at ~210 chars)
- Use the founder's actual story, not corporate copy
- End with a no-link CTA ("Search JobyBots") — LinkedIn de-prioritises posts with external links
- Drop the URL in the **first comment** after posting

Post 7 days later: the same 60s video clipped to 30s with a single comment "if you missed this last week."

---

## Move 4 — Reddit, the right way

The five subreddits that actually convert for job-search tools:

| Subreddit | Size | What works |
|---|---|---|
| r/jobsearch | 150k | Honest post format only. No "I built X" → instant ban. |
| r/dubai | 260k | Genuine "I built this for my own UAE job hunt" post. |
| r/india | 1M | "₹2,999 lifetime alternative to ₹3,000/month LinkedIn Premium" angle. |
| r/saudiarabia | 60k | NEOM / Vision 2030 angle. |
| r/cscareerquestions | 1M | Technical breakdown of how the bot avoids LinkedIn bans. |

Each post template is in `marketing/REDDIT_LAUNCH.md`. **Rule:** post Mon-Thu, 8-10 AM local time, never ask for upvotes, always respond within 30 min to top comments.

---

## Move 5 — The "Show your work" content engine (ongoing, 1 hour/week)

Publish ONE of these every week, rotating:

| Week | Content type | Channel | Effort |
|---|---|---|---|
| 1 | "How I built the bounce tracker" technical post | dev.to + Medium | 90 min |
| 2 | "GCC recruiter database deep-dive" (gated lead magnet) | LinkedIn + blog | 60 min |
| 3 | "Why 95% of cold emails bounce + how we fixed it" | r/cscareerquestions + HN | 45 min |
| 4 | "The Saudi Vision 2030 hiring map for 2026" | LinkedIn carousel | 90 min |

Each one is **also a /blog post**, which means a new sitemap entry, which means another IndexNow ping, which means another shot at ranking. Compound interest.

---

## Move 6 — The 60-second pieces of armour

These are "deploy and forget" zero-cost trust signals that lift every other channel's conversion rate by 1.2-2×:

1. **G2 / Capterra / TrustPilot listings** — claim now, ask 5 happiest customers to review. 60-second submission.
2. **AlternativeTo.net entry** for "LazyApply alternative" — auto-ranks for every alternative search.
3. **Bing Webmaster Tools** account + sitemap submission. **Critical for ChatGPT search.**
4. **Google Search Console** (already done) → submit `/wins`, `/install`, and the new SEO pages manually.
5. **Schema.org rich snippets** (already shipping via `Product`, `HowTo`, `Review`, `FAQPage` JSON-LD).
6. **OpenGraph + Twitter card preview** on every page — already shipping.

---

## The compounding move: `/wins` social-proof flywheel

Every time a customer lands an offer:
1. They report it (existing customer email → 2-min reply).
2. You add it to `lib/wins.ts` in a 30-second PR.
3. Vercel rebuilds, sitemap updates, IndexNow pings.
4. The new card becomes a **shareable URL** for that customer to post on their LinkedIn ("here's how I got my Talabat offer in 11 days").
5. That LinkedIn post drives traffic to `/wins`, which has a CTA to `/buy-india`.
6. New customer buys, lands a job, reports it. Loop.

This is exactly how Calendly, Linear and Substack grew without ad spend.

---

## What surprises Google (not other founders)

These are real, working, zero-cost SEO moves most indie launches skip:

| Tactic | Why it works |
|---|---|
| **Programmatic SEO pages** (we have 14 now) | Every long-tail search gets its own answer page |
| **HowTo Schema** on /install | Google may show a step-by-step rich snippet in results |
| **Product Review JSON-LD** on /wins | Star rating appears in search results (CTR +24%) |
| **VideoObject** in layout | Google Video carousel inclusion |
| **FAQ schema** on / and /install | "People also ask" inclusion |
| **hreflang en-AE / en-GB / en-SA / en-IN** | Targeted to GCC + India searchers separately |
| **IndexNow ping after every deploy** | Bing + ChatGPT crawl within hours |
| **Internal linking density** (every page links to 2+ others) | PageRank flows correctly |
| **Open-graph image per page** | 2× share-rate on social |
| **Site speed on mobile** (CLS < 0.1) | Direct ranking factor |

---

## The honest 30-day forecast

| Day | Where you stand |
|---|---|
| Day 0 | Indexed by Bing within 6 hours via IndexNow. Visible in ChatGPT search within 24h. |
| Day 3 | HN launch over. Either 5k visitors and momentum, or you regroup. |
| Day 7 | LinkedIn post compounding. First Reddit replies. First non-friend buyer. |
| Day 14 | First "real" wins to add to `/wins`. Google sees fresh, unique content. |
| Day 21 | "jobybots" branded search starts appearing in autocomplete (because you ARE the only result). |
| Day 30 | Position #1-3 for "lazyapply alternative", "uae job search bot", "saudi vision 2030 jobs" long-tails. Position 5-10 for "ai job hunter india". |

This is what compound, zero-cost effort looks like.

---

## What NOT to do

- ❌ Pay for "SEO services" — for a $36k-MRR-or-less tool, 100% of the value is in the moves above.
- ❌ Buy Google Ads on "jobybots" — you'll cannibalise your organic and bid against yourself.
- ❌ Spam LinkedIn DMs — costs you reputation, gains you nothing.
- ❌ Stuff keywords into the homepage — Google penalises this since 2019.
- ❌ Use AI-generated reviews on /wins — Google catches it.
- ❌ Submit to 200 directories — 90% are dead, the 10 in the list above are the ones that matter.

---

## Today's execution checklist (30 minutes total)

- [ ] Add `INDEXNOW_KEY` to Vercel env vars (use the value in `87bae8d2…fccd.txt`).
- [ ] Hit `https://jobybots.com/api/indexnow` once.
- [ ] Open Bing Webmaster Tools, claim site, submit sitemap.xml.
- [ ] Open Google Search Console, request indexing for `/install`, `/wins`, both new SEO pages.
- [ ] Post the 60-second video natively to your personal LinkedIn (copy from LINKEDIN_LAUNCH_POST.md).
- [ ] Draft HN Show post (HACKERNEWS_LAUNCH.md is ready). Schedule for Tuesday/Wednesday 8 AM ET.
- [ ] Add yourself / first 3 customers as the first wins on `/wins` (already seeded).

The website is already doing 80% of the work. You just need to fire the starter pistol.
