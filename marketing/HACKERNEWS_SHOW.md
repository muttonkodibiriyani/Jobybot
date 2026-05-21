# HackerNews "Show HN" — JobyBots

> **Best time to post**: Tuesday-Thursday, 08:00-10:00 ET.
> **Avoid**: Monday (too much weekend backlog), Friday (low engagement), weekends.

## Title (max 80 chars)

**Show HN: JobyBots – Local-first AI job hunter that emails recruiters for you**

Alternative titles to A/B test:
- Show HN: A local-first AI agent that emails 200 recruiters a day from your laptop
- Show HN: Job-search bot that doesn't upload your résumé to a SaaS
- Show HN: Built an AI agent that emails recruiters — runs entirely on your laptop

## URL

https://jobybots.com

## First comment (post within 30 seconds of submitting)

Hi HN,

Maker here. Brief context: I'm a product manager (ex-Alshaya, IIT Patna) based in Dubai. In February 2026 I quit my job and started looking for the next one. After sending 200 manual cold emails over a month and getting 6 replies, I went home and started building JobyBots.

What it is

JobyBots is a Python CLI + browser dashboard that runs on YOUR laptop. Every 30 minutes it:

1. Scans 8 job sites in parallel — LinkedIn, Indeed, Naukrigulf, Bayt, GulfTalent, RemoteOK, AngelList, and company ATS endpoints (Greenhouse / Lever / Workable / Ashby).
2. Scores each match with Gemini Flash against a one-time résumé embedding (free tier covers ~1500 matches/day).
3. Above a configurable threshold, runs a 5-tier email-finder waterfall: cache → careers-page scrape → LinkedIn job poster lookup → country-aware pattern → SMTP RCPT probe.
4. Generates a 4-6 sentence cover letter quoting ONE JD requirement and matching it to one outcome from your résumé.
5. Sends from your own Gmail (cap 200/day, randomised 20-60s delays, 12 rotating subject templates).
6. Reads your Gmail inbox via IMAP for delivery-failure notifications and quarantines bad addresses.

Why local-first

Every SaaS in this space (Sonara, LazyApply, AIApply, Massive, Simplify) asks you to upload your résumé. I didn't want to be the operator of a database full of strangers' CVs, and I didn't want my customers to trust me with that.

Local-first means: I don't have a server you upload to. The bot is a Python package on YOUR machine. It uses YOUR Gemini API key and YOUR Gmail App Password. The website at jobybots.com is just a Stripe checkout and a license server (a single Cloudflare Worker that validates a JWT).

What I learned

- The bounce tracker was the hardest part. Modern Gmail NDRs use multiple sender patterns and the RCPT regex needed a complete rewrite. A backfill on my own 90-day inbox quarantined 230 historical bounces that had been silently slipping through.
- 200 emails/day with identical subject lines tanks your Gmail sender reputation in a week. The 12-template rotation was the most impactful single deliverability change I shipped.
- The SMTP RCPT probe catches obvious 5xx addresses but is a weak positive — most big providers (Gmail, Microsoft, Mimecast) accept all RCPTs to defeat email enumeration. The 5xx case is still hugely valuable; the 2xx case is just "not yet bounced".
- GDPR / UK PECR are real. The bot has a hybrid mode for the UK that only emails mailboxes the recruiter published on the job post (Article 6(1)(f) legitimate interest).

Stack

Backend: Python 3.11, SQLite, requests, BeautifulSoup, dnspython, smtplib, imaplib, APScheduler.
LLMs: Gemini Flash (default), Groq Llama 3.3 (fallback).
Website: Next.js 15, Tailwind, Vercel, Stripe + UPI, Cloudflare Worker for license JWT.
Total infra cost: $0/mo (every recurring cost is on the customer side).

Pricing

₹2,999 (~$49) lifetime. 7-day refund. No subscription, no upsells, new features ship free.

Happy to dig into any of:
- Email-deliverability hygiene at 200/day from a single Gmail
- The 5-tier email-finder waterfall design
- Why I picked Gemini Flash over GPT-4o for cover letters (cost vs quality bake-off in the blog)
- The UK GDPR hybrid mode design choices
- How I'd structure the next 90 days of growth

—

Reply hints (canned answers for likely questions):

### "Doesn't this violate LinkedIn's ToS?"

Good question. The bot never logs into your LinkedIn account or clicks any UI element. It reads public job listings (same as any browser would) and sends emails via your Gmail. There's an optional "T2 Email Finder" that uses your own li_at session cookie to look up the job poster's profile — that's at the user's discretion and capped at 30 lookups/day to stay below LinkedIn's anti-automation triggers.

### "Why $49 instead of subscription?"

Three reasons. (1) The ongoing costs (Gemini API, Gmail SMTP, your server) are all on YOUR side, so I don't have a recurring cost to recoup. (2) Subscription tools in this space have terrible retention because job searches end in 2-3 months. (3) I personally hate subscriptions and so do most of my customers.

### "How do you handle Gmail's TLS deprecation / spam-filter changes?"

The bot uses smtplib.SMTP over TLS via Google's official SMTP relay (smtp.gmail.com:587) with the user's App Password. Google has signaled they'll keep this interface alive — App Passwords are still the recommended path for headless senders. If they change it, the bot ships an update for free (lifetime license).

### "Why not just use Sonara?"

Sonara is great if you prefer SaaS — every résumé, every cover letter, every reply lives on their servers. JobyBots gives you the same agent loop on your own machine with a SQLite DB you can open in DB Browser. Same loop, your data, one-time payment instead of $50/mo.

### "Open source?"

The bot is closed source today. I'd consider open-sourcing the core agent loop (search → score → tailor) under a non-commercial license while keeping the deliverability hygiene + curated market data behind the paid license. Would love thoughts from this sub on that.

—

Source: jobybots.com
Demo video: https://youtu.be/fwKCITDa2MM
About: jobybots.com/about
