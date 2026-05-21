# Reddit Launch Playbook — JobyBots

Reddit is the highest-conversion channel for indie tools IF you respect each subreddit's culture. The five subs below are the ones that actually move the needle for a job-search tool aimed at UAE + India + UK.

**Universal rules** (break any one of these → ban):
- Read each sub's rules + recent top posts BEFORE posting.
- Never use a tracking link (no bit.ly, no utm_source).
- Reply to every top-level comment in the first 4 hours.
- Don't shill in comment threads. Answer the question, then mention JobyBots if it's genuinely relevant.
- Post Mon-Thu 8-10 AM local time.

---

## r/jobsearch (150k members)

**Title:** `Quietly job-hunting on top of a full-time job. 200 manual emails got me 6 replies. So I built a small tool to automate the boring half.`

**Body:**
```
Long-time lurker. Still in a full-time role. The "quiet search" on evenings and weekends turned out to be its own kind of full-time job.

By April I had:
- A Notion of every job I'd applied to (314 entries)
- A folder of 47 cover letter variants
- Six replies, zero interviews

The honest realisation: 80% of my time was finding the right email, copying the JD, tweaking the cover letter — not actually applying.

So I built a tiny Python script. It does the boring half:
1. Scans my saved job boards every 30 min
2. Scores each posting against my résumé (Gemini Flash)
3. Finds the recruiter email (carries page, LinkedIn, SMTP probe)
4. Writes a 4-line cover letter that quotes the JD
5. Sends from my Gmail (daily cap to stay sane)

Tracking is what I obsessed over. Every email's open/bounce/reply is in a local SQLite file. I can see EXACTLY which subject lines are getting opened.

Not selling anything in this post — just sharing what's actually been working for me. Happy to share the SQL queries I use to track deliverability if anyone wants them.

(For full transparency: a few people asked me to package it up, so I did. If you want the link DM me, I'd rather not derail this thread.)
```

**Why this works:** A personal story, a falsifiable detail (314 entries), useful resources offered for free in the thread, no link unless asked. Reddit voters reward this.

---

## r/dubai (260k members)

**Title:** `Built a UAE-specific job-search bot for myself after the Feb layoffs. Sharing in case anyone here is hunting too.`

**Body:**
```
Tech PM in the UAE for the last 8 years. Earlier this year I started quietly looking for what's next, on top of a full-time role. The Dubai job market is broken in a way I didn't realise until I was in it:

- LinkedIn UAE has ~1,200 applicants per Senior PM post
- Bayt and Naukrigulf surface different jobs than LinkedIn
- The actual recruiter you want is rarely in the JD — they're usually 2 LinkedIn clicks away
- Half the careers pages on company websites are 404s

I wrote a small Python bot to handle the boring parts:
- Searches Bayt + Naukrigulf + GulfTalent + LinkedIn UAE every 30 min
- Scores each job using Gemini against my CV
- Pulls the recruiter email from the company's own careers page (not LinkedIn — that gets you banned)
- Sends a tailored cover letter via my Gmail (200/day cap)

After 3 weeks: 4 interviews, 1 offer (which I declined to keep building this).

Anyone else hunting in DXB? Happy to share what I learned about UAE-specific email patterns / which job boards are actually worth scraping.

Edit: A few folks DM'd. The tool is at jobybots.com if you want it — ₹2,999 lifetime, runs on your laptop, no subscriptions. Mods, if this counts as self-promo please DM me, happy to redact.
```

**Why this works:** Tags the local pain ("Feb layoffs", "DXB"), uses local board names, declares the link only after community asked.

---

## r/india (1M members)

**Title:** `Built an AI job-hunting tool that runs on your laptop. ₹2,999 lifetime. Cheaper than 2 months of LinkedIn Premium.`

**Body:**
```
Friends in the bench-period know — the maths is wild:

LinkedIn Premium: ₹2,599/month = ₹31,000/year
Naukri Profile Boost: ₹1,500-3,000/month
ChatGPT Plus: ₹1,650/month
Notion AI for cover letters: ₹800/month

You can easily burn ₹50,000 a year just on the tools.

I'd been using all of them while job-hunting from Dubai. They all do ~30% of what they promise.

So I wrote one Python tool that does the actual workflow:
1. Scans Naukri / LinkedIn / Indeed / company sites every 30 min
2. Scores each job 0-100 against your résumé using Gemini (free tier covers ~1500/day)
3. Sends a tailored cover letter via your Gmail
4. Tracks every bounce + reply in a local SQLite database

One-time payment, ₹2,999 lifetime. Runs on your laptop. No subscriptions. Your CV never leaves your machine.

This is not a startup pitch. I built it for myself, friends started asking, so I packaged it. 7-day refund if it doesn't work for you. Critique welcome.

jobybots.com
```

**Why this works:** Frames against the EXACT competitor stack Indian job-seekers actually pay for, with real ₹ numbers.

---

## r/saudiarabia (60k members)

**Title:** `Built a tool for Saudi Vision 2030 job hunting. NEOM, Red Sea, PIF, Aramco. Sharing for fellow expats.`

**Body:**
```
Spent 8 years working in MENA. Earlier this year I started quietly looking for the next chapter, on top of a full-time job. Most "AI job tools" are USA-centric and don't have NEOM, Red Sea Global, Roshn, or any PIF portfolio company in their recruiter database.

So I built one that does. Tool searches LinkedIn KSA, Bayt, Naukrigulf for Saudi-relevant roles. Has 42 curated recruiter contacts pre-loaded for the Saudi Vision 2030 ecosystem. Writes Iqama-aware cover letters (handles the "expat from India / Egypt / Philippines" framing automatically).

Specifically targets:
- NEOM (The Line, Trojena, Sindalah)
- Red Sea Global
- Roshn
- Qiddiya
- Aramco
- STC, SNB, Mobily, Zain KSA

Works equally for in-country candidates and overseas applicants.

₹2,999 lifetime (~SAR 130). One-time. Runs on your laptop. 7-day refund. jobybots.com

Mods — if this isn't allowed, please DM and I'll redact, no problem.
```

---

## r/cscareerquestions (1M members) — **technical angle**

**Title:** `How I dropped my cold-email bounce rate from 35% to 5% (writeup + SMTP RCPT probe technique)`

**Body:**
```
TL;DR: Stop guessing recruiter emails from name+domain patterns. Probe them with a partial SMTP transaction before you send.

Context: I'd been quietly job-hunting from Dubai on evenings and weekends, on top of a full-time PM role. Sending ~50 cold emails a session. 35% were bouncing — which not only wastes the attempt but tanks your Gmail sender reputation, which then hurts the 65% that DO land.

The 5-tier email-finder waterfall I ended up with:

1. Cache hit (we've found this person before)
2. Scrape company's careers page for any `mailto:` patterns
3. LinkedIn poster lookup (when the recruiter linked the post)
4. Name + company-domain pattern generation (firstname.lastname@, f.lastname@, etc — 7 patterns)
5. **SMTP RCPT probe** — open a TCP connection to the company's MX server, do EHLO + MAIL FROM, then RCPT TO with the candidate address, read the response code. If you get 550, the address doesn't exist. Drop the connection BEFORE the DATA command — you never actually send anything, so it's deliverability-safe.

The trick is step 5. Most email finders skip it because it's slow (~2 seconds per probe) and a small minority of MX servers either lie (always return 250) or rate-limit you (Google does after ~50/hr).

Cache results aggressively in SQLite — each "is this real?" answer is good for 30 days minimum.

Code lives in `core/finders/smtp_probe.py` in the repo. Happy to walk through any part of it.

Side effect: bounce rate from 35% → 4.7%. Sender reputation recovered in about a week.

(I package this in a tool called JobyBots — but the SMTP RCPT idea is decades old, just under-used. Use it standalone if you want.)
```

**Why this works:** r/cscareerquestions hates marketing posts but rewards technical writeups. The tool link is parenthetical, the value is the technique.

---

## Other subs to try (rotate week-to-week)

| Sub | Members | Angle |
|---|---|---|
| r/IndianStartups | 35k | "Built X in 14 days, lessons learned" |
| r/SideProject | 250k | Generic "Made a thing, here's the screenshot" |
| r/IndieHackers | 35k | Revenue numbers as the lede |
| r/digitalnomad | 2M | "Built this while transitioning roles" angle |
| r/jobs | 1.4M | Generic but huge — keep it personal |
| r/UAE | 80k | Sister to r/dubai, different audience |
| r/Singapore | 800k | If you add SG market this year |
| r/london | 800k | UK-GDPR-safe angle |

---

## Anti-patterns (will get you banned)

- ❌ "Sign up at my link!" anywhere in the post
- ❌ Same post copy-pasted to 5 subs in 1 hour
- ❌ Creating a new Reddit account for the launch (mods check)
- ❌ Asking for upvotes (in DMs, anywhere)
- ❌ Linking to a landing page instead of GitHub / blog post (looks more legit)
- ❌ Using marketing-speak ("revolutionary AI", "10× your job search")
- ❌ Replying with "thanks for the support!" instead of substantive engagement
