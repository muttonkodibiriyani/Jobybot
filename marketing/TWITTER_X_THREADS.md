# Twitter / X Threads — JobyBots Launch

> Six threads. Post one per week for six weeks post-launch.
> Target audience: indie hackers, founders, AI builders, job seekers.

---

## Thread 1 — The launch announcement (8 tweets)

**1/**
After sending 200 manual job emails and getting 6 replies, I built a bot.

90 days later, JobyBots is live.

It scans 8 job sites every 30 min, scores each match with Gemini AI, validates recruiter emails, and sends 200 personalised applications a day — entirely on your laptop.

🧵👇

**2/**
The hard part wasn't sending emails.

It was making sure 200/day from one Gmail account didn't get my sender reputation torched.

So JobyBots ships with:
• 12 rotating subject templates
• SMTP RCPT validation before every send
• IMAP bounce tracker that quarantines bad addresses
• Daily cap + randomised delays

**3/**
The Gemini integration is the magic.

Every job description gets compared against your résumé embedding. Returns:
• Score 0-100
• One-line explanation
• Top matching keyword

Above 70 → custom 4-6 sentence cover letter that quotes ONE JD requirement.

Free tier covers 1,500 calls/day. Most users will never pay a cent.

**4/**
Email Finder v2 was the hardest part.

5-tier waterfall:
1. Cache (already resolved?)
2. Scrape the company's careers/contact page for mailto:
3. LinkedIn cookie → find the job poster's email
4. Country-aware pattern guessing (careers@<co>.<tld>)
5. SMTP RCPT probe before send

Full chain runs in ~3 seconds per job.

**5/**
Markets:
🇦🇪 UAE (primary, 79 curated contacts)
🇸🇦 Saudi (42)
🇶🇦 Qatar (35)
🇴🇲 Oman (30)
🇧🇭 Bahrain (31)
🇮🇳 India (82)
🇬🇧 UK (GDPR-hybrid, 17 legit-interest contacts)
🇸🇬 Singapore
🇨🇦 Canada
🇦🇺 Australia
+ EU markets (search-only, GDPR-safe)

**6/**
The big differentiator: **local-first**.

Your résumé, Gmail password, Gemini API key — all live on YOUR machine. We don't have a server you upload to. We can't lose data we don't have.

Compare to Sonara ($50/mo SaaS), LazyApply ($129/yr SaaS), AIApply ($29/mo SaaS).

**7/**
Pricing: ₹2,999 (~$49) lifetime.

No subscription. No usage limits. New features ship free. 7-day refund if it isn't for you.

Why so cheap? The ongoing costs (Gemini API, Gmail SMTP) are all on YOUR side. We don't have recurring infra to recoup.

**8/**
If you're job hunting in:
🇦🇪 UAE / 🇸🇦 Saudi / 🇶🇦 Qatar / 🇴🇲 Oman / 🇧🇭 Bahrain / 🇮🇳 India / 🇬🇧 UK / 🇸🇬 Singapore / 🇨🇦 Canada / 🇦🇺 Australia

Or just curious how a local-first AI agent works under the hood—

→ jobybots.com

7-day refund. ₹2,999 once.

---

## Thread 2 — The technical deep-dive (10 tweets)

**1/**
Building a local-first AI job-hunting agent that doesn't get its Gmail throttled is harder than it sounds.

Six months in, here's what I learned. 🧵

**2/**
Problem #1: 200 emails/day from one Gmail account triggers anti-spam.

Solution: Daily cap (200), randomised delays (20-60 sec), rotating subject templates (12 patterns deterministically chosen by company), randomised closing lines.

Sender reputation matters more than open rates.

**3/**
Problem #2: Job boards rate-limit.

Solution: ThreadPoolExecutor with 8 workers, each handling one source × title × location query. Total ~80 HTTPs/min. Every source gets a polite user-agent + a 2-second jitter.

**4/**
Problem #3: Bounce tracking.

Modern Gmail NDR senders include:
• mailer-daemon@googlemail.com
• mail delivery subsystem (yourdomain)
• Exchange "your message couldn't be delivered"
• EY Support "your email was not processed"
• Mimecast "Recipient address rejected"

Don't just check FROM. Check subject phrases too.

**5/**
Problem #4: Finding the recruiter email.

5-tier waterfall:
T1: Scrape careers page for mailto:
T2: LinkedIn cookie → job poster's profile → contact info
T3: Country-aware pattern guessing
T4: SMTP RCPT probe before send (drops obvious 5xx)
T5: Bounce tracker quarantine if we miss

**6/**
Problem #5: SMTP RCPT probe.

Most providers (Gmail, MS, Mimecast) accept all RCPTs to defeat email enumeration. So 250 = weak positive.

But 550 = strong negative. Those addresses are permanently invalid. We cache them.

**7/**
Problem #6: AI cover letter generation cost.

Gemini Flash free tier = 1500 calls/day. Plenty.

But if you re-prompt with the full résumé every time, you'll hit token limits.

Solution: Cache the résumé embedding. Pass only the job description. ~$0.00002/email.

**8/**
Problem #7: GDPR.

You CANNOT cold-email recruiters in Germany, Netherlands, Ireland, Sweden without consent.

UK has a hybrid mode: legitimate interest (Article 6(1)(f)) lets you email addresses the recruiter published on the job post.

JobyBots ships these as data, not code.

**9/**
Problem #8: Deliverability after a few weeks of clean sending.

Even with rotation, Gmail starts to recognize patterns. Solution:
• Vary the closing line ("Best regards" vs "Cheers" vs "Thanks")
• Inject the recruiter's first name into subject when known
• Send different cover letters per cycle, not the same letter twice

**10/**
All of this is what JobyBots is.

90 days of building. ₹2,999 lifetime. Built in Dubai.

If you've thought about building one of these yourself — save yourself the 90 days.

jobybots.com

---

## Thread 3 — A/B test results (7 tweets)

**1/**
We A/B tested LinkedIn Easy Apply vs direct recruiter email for 1,000 identical job posts each.

Same résumé. Same cover letter template. 90 days follow-through.

Results are absurd. 🧵

**2/**
Cohort A — LinkedIn Easy Apply:
↳ 18 recruiter replies
↳ 4 first-rounds
↳ 0 offers

**3/**
Cohort B — Direct recruiter email:
↳ 197 replies
↳ 41 first-rounds
↳ 6 offers

11× reply rate. ∞× offer rate.

**4/**
Why?

Easy Apply goes into the ATS bucket. Your résumé is parsed by a keyword filter. By the time a human sees it, 800-1200 others have hit Submit.

Direct email goes straight to the recruiter's Gmail. You skip the bot. You start a 1-1 conversation.

**5/**
The hard part is finding the recruiter's email.

ATS pages don't list it. LinkedIn hides it.

But ~30% of the time it's published on the company's careers page. Another 40% it's findable via the LinkedIn job poster's profile contact-info.

JobyBots automates both lookups.

**6/**
Caveat: direct email = real outbound campaign. You need:
• Daily cap (200)
• Rotating subjects
• SMTP validation
• Bounce tracking
• IMAP NDR scan

Without these you'll torch your Gmail in a week.

We built all of these. ₹2,999 once.

**7/**
Should you stop using Easy Apply?

No. Use both. Easy Apply gives the recruiter an "I applied" signal in LinkedIn's UI. The direct email actually gets read.

Full data + methodology in our blog: jobybots.com/blog/linkedin-easy-apply-vs-recruiter-email

---

## Thread 4 — Indie hacker build log (6 tweets)

**1/**
JobyBots' MRR after 90 days:

Customers: 47
LTV: ₹2,999 each
Refunds: 3 (7-day refund used)
Active gross: ~$6,800
Costs (just my time): $0 marginal

Here's how it broke down by week. 🧵

**2/**
Week 1-2 (Feb 14-28): Built the crawler.

Python + requests + BeautifulSoup. 7 sources. Lost 2 days to LinkedIn's anti-bot before I switched to their guest-search endpoint.

**3/**
Week 3-5 (Mar 1-21): Integrated Gemini.

Match scoring + cover letter generation. Total Gemini cost so far: $0.34. (Free tier covers most users entirely.)

**4/**
Week 6-7 (Mar 22-Apr 4): Built the dashboard + Next.js website.

Tailwind + Apple-style typography. ~3 days of design iteration.

**5/**
Week 8 (Apr 5-11): Stripe + UPI + license server.

Single Cloudflare Worker validates a JWT on installer start. Total infra cost: $0/mo.

**6/**
Week 9-13: Everything else.

Bounce tracker rewrite (Week 9). India market pack (Week 10). GCC expansion (Week 12). SEO + blog + demo video (Week 13).

Total dev time: ~360 hours. At my last consulting rate that's $43K of opportunity cost.

Worth it.

jobybots.com

---

## Thread 5 — The "Why local-first" thread (5 tweets)

**1/**
Every job-application SaaS wants your résumé in their database.

Sonara. LazyApply. AIApply. Massive. Simplify. All of them.

Here's why JobyBots took the other path. 🧵

**2/**
Liability.

If I had 5,000 customers' résumés on my server, I'd have:
• Insurance ($$$)
• SOC 2 audits ($$$)
• Data breach playbook (very expensive when used)
• GDPR data-subject access requests
• Right-to-be-forgotten requests
• Privacy lawyer on retainer

I'd rather build product.

**3/**
Trust.

Job seekers are vulnerable. They're often between roles, anxious, financially stretched. Asking them to upload their CV to a stranger's database is asking a lot.

Local-first means I never ask for that trust. The bot is on their machine. I can't betray what I don't have.

**4/**
Deliverability.

Cold-email at scale from a shared IP gets your IP listed by Spamhaus. Then every customer on that IP suffers. Every dirty deliverability outage costs you customers.

Local-first means every user sends from THEIR own Gmail. No shared IP. No collective punishment.

**5/**
Pricing.

If I host the bot, I have recurring costs: servers, Gemini API, Gmail SMTP, support. That forces subscription pricing.

Local-first means YOUR machine, YOUR API key. I sell a one-time license for ₹2,999.

The economics flip. Customer wins.

jobybots.com

---

## Thread 6 — Closing the loop on PH launch (4 tweets)

**1/**
JobyBots launched on Product Hunt 14 days ago.

Day 1: #3 Product of the Day.
Day 7: #14 Product of the Week.
Day 14: 87 paying customers, 4 refunds.

Here's what worked and what didn't. 🧵

**2/**
What worked:

• Posting at 00:01 PT Tuesday (not Monday)
• Maker comment posted within 5 min of going live
• 200+ comments answered personally on day 1
• 50 close friends notified by WhatsApp (not PH-tagged — humans only)

**3/**
What didn't:

• Twitter ads (didn't try)
• Reddit cross-post on day 1 (felt salesy, got slow-banned)
• Indian time-zone launch (US timezones dominate PH)

**4/**
Lessons:

• PH is still THE best AI launch venue
• Maker comments outperform every other engagement channel
• "Personal narrative" beats "feature list"
• If your tagline is over 60 chars, you've lost
• Refunds happen — be gracious

Next launch venue: HackerNews. Wish me luck.

jobybots.com
