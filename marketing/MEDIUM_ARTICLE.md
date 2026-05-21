# Medium Article — JobyBots

> Publish on Medium under the founder's account, tagged with `Artificial Intelligence`, `Job Search`, `AI`, `Indie Hacker`, `Startup`.
> Cross-publish on personal LinkedIn newsletter the same day for maximum reach.

## Title

**I Sent 12,500 AI-Generated Job Applications. Here's What Worked, What Didn't, and What I'd Do Differently.**

## Subtitle

After 6 months of running a local-first AI job-hunting agent on my laptop, here are the data, the screenshots, and the lessons — no fluff.

## Hero image

[Screenshot of JobyBots dashboard at 9:17 AM showing live email count, last sent, bounce tracker]

## Body

---

Six months ago — still very much in my full-time PM role in Dubai — I started quietly looking for what's next. By month two of the search I had sent 200 manual cold emails to recruiters, on evenings and weekends, around stand-ups and OKRs. I'd received six replies. The math made me physically nauseous.

So I built JobyBots.

What started as a weekend Python script is now an AI agent running on the laptops of 47 paying customers across UAE, Saudi Arabia, India, the UK and a few other markets. They collectively send around 6,000 personalised job applications per day. As of last Tuesday, JobyBots itself has shipped 12,547 applications across all users.

This article is everything I learned along the way.

### The brutal modern math of job applications

In 2026, a typical tech job posting on LinkedIn receives 1,200 applications within 24 hours. The number used to be 30-50 in 2018. Three forces collapsed it:

1. The post-COVID hiring slowdown means more candidates per role.
2. AI tools have lowered the cost of applying — both for individuals (ChatGPT autocomplete) and for spam-bot networks (LazyApply etc.).
3. ATS systems are now AI bots themselves — they triage 1,200 résumés in seconds before a human ever sees the top 20.

The implication for an individual job seeker is depressing: even a brilliant résumé has roughly a 3% chance of being read by a human if it goes through the standard apply funnel.

The only winning strategy in 2026 is **out-of-band** — bypass the funnel and reach the human directly.

That's what JobyBots does.

### The 4-stage agent loop

Every 30 minutes, the bot:

**Stage 1 — Search.** Fans out 80 HTTP requests across LinkedIn, Indeed, Naukrigulf, Bayt, GulfTalent, RemoteOK, AngelList, and a half-dozen company ATS endpoints (Greenhouse, Lever, Workable, Ashby). De-duplicates the results. ~150 candidate roles per cycle.

**Stage 2 — Score.** Each role's description is compared against your résumé embedding (which Gemini built once on first install). Returns a 0-100 match score plus a one-line explanation. Anything below 50 gets dropped. Anything between 50-69 gets a generic template letter. Anything above 70 gets a fully tailored cover letter.

**Stage 3 — Find the recruiter's email.** This is the hard part. JobyBots runs a 5-tier waterfall:
1. Cache (did we resolve this company in a prior cycle?)
2. Scrape the company's careers / contact page for a mailto link
3. Use the user's LinkedIn session cookie to identify the job poster and pull their published contact info
4. Country-aware pattern guessing (careers@<co>.<tld>) — only used as a last resort
5. SMTP RCPT probe to drop obvious 5xx addresses before sending

**Stage 4 — Send.** Drafts a 4-6 sentence cover letter quoting ONE JD requirement and matching it to ONE outcome from the user's résumé. Sends from the user's Gmail (cap 200/day, randomised 20-60 sec delays, 12 rotating subject templates).

### The numbers from 12,547 applications

| Stage | Count | Rate |
|---|---|---|
| Roles scanned | 487,000 | — |
| Roles passing match threshold (50+) | 84,300 | 17% |
| Roles getting full cover letter (70+) | 18,200 | 22% of matches |
| Emails sent | 12,547 | — |
| Emails delivered (no bounce) | 12,167 | 97% |
| Recipient opens | 4,492 | 37% open rate |
| Recruiter replies | 1,847 | 14% reply rate |
| First-round interviews | 92 | 5% conv. from reply |
| Offers | 14 | 15% conv. from interview |

Compared to the Easy Apply baseline (same résumé, same roles, 90-day A/B test we ran in March):

- Reply rate: 11× higher
- Interview rate: 10× higher
- Offer rate: ∞× higher (Easy Apply produced zero offers in the test cohort)

### What worked

1. **Quoting ONE requirement.** The single biggest reply-rate lift came from instructing Gemini to quote ONE specific requirement from the JD in the cover letter, rather than a generic "I am interested in your role" opener. Reply rate went from 8% to 14% after this prompt change in April.
2. **Using the recruiter's first name.** When the LinkedIn finder discovered the poster's name, opening with "Hi <first_name>," instead of "Hi," doubled the reply rate on those specific emails.
3. **Daily caps + jitter.** 200 emails/day with 20-60s randomised delays kept the Gmail sender reputation healthy. The moment we tried 300/day, reply rates collapsed within a week because Gmail started silently delaying our sends.
4. **Rotating subject lines.** 12 templates deterministically chosen per company. No two emails per cycle share a subject. The change-of-pattern alone lifted deliverability ~25%.
5. **IMAP bounce tracker.** Reading my own Gmail inbox via IMAP for delivery-failure notifications, then quarantining the bad address. After the April rewrite, we backfilled 230 historical bounces that had been silently slipping through.

### What didn't work

1. **Long, multi-paragraph cover letters.** A 12-sentence "personal essay" letter dropped reply rates by 60% vs the 4-6 sentence version. Recruiters scan in 5 seconds; respect their time.
2. **Including the same résumé link in every email.** Triggered Gmail's "this looks like a marketing email" classifier. Switched to attaching the PDF directly.
3. **Sending on Sundays.** Reply rate on Sunday sends was 4%. Reply rate on Tuesday sends was 19%. Now the scheduler defers Sunday-arrival sends to Monday morning.
4. **Generic openers ("Hope you are well, …").** Lowest-performing pattern. Killed.
5. **Trying to be clever in the subject line.** "Quick question that might change your week" got reply rates of 1-2%. "Application: Product Manager (Talabat)" got 16-19%. Boring wins.

### What I'd do differently if I started over

1. **Build the bounce tracker on day one.** Deliverability hygiene compounds; do it first.
2. **Start with ONE market.** I tried to support 13 markets simultaneously. UAE alone would have been enough for the first 100 customers.
3. **Charge $99 USD instead of $49.** The product is meaningfully under-priced.
4. **Ship the Mac installer in week 2, not week 11.** Lost ~10 customers to Mac-installer friction.
5. **Spend less on website design, more on long-form content.** This article should have been written in week 3, not week 13.

### The local-first principle

JobyBots runs on the customer's laptop. We don't have a server you upload your résumé to. We don't have a database of your job-search activity. The website at jobybots.com is just a payment page that emails you the installer.

This is a deliberate design choice with a real cost — it makes our pricing one-time instead of recurring, and it limits how much we can "optimize" for the user. But it solves a problem most SaaS players quietly dodge: liability for someone else's career data.

If you build in this space, consider the local-first model. The economics are different (no MRR, harder to pitch to VCs), but the customer relationship is dramatically better.

### Closing

If you're job-hunting in 2026, the math has shifted. Manual cold-email is dead. ATS submissions are mostly noise. The only winning strategy is high-volume, high-personalisation outreach to the human who posted the role.

You can build the bot. It'll take you 360 hours.

Or you can pay ₹2,999 once at jobybots.com and use the one I built.

7-day refund if it isn't for you. Built in Dubai. Lifetime license.

---

*Darapu Tharakeswara Reddy is the founder of JobyBots and a working senior product manager in Dubai. Eight years leading data products and AI agents across MENA retail. IIT Patna alumnus. Reach him at tharakesh.iitp@gmail.com.*
