# Reddit Posts — JobyBots Launch Pack

> **CRITICAL**: Reddit hates self-promotion. Every post must be **genuinely useful to the subreddit** with the link as supplementary.
> Use NEW accounts only after they have 30+ days of activity in unrelated subs (karma farming guide below).
> Never post the same content to >2 subs in one week.

---

## /r/cscareerquestions (3.4M)

### Title
**[Tools] I built a local-first AI agent that emails recruiters for me — am I crazy or is this the future?**

### Body
Throwaway because I'm still job-hunting and don't want my main account associated.

Spent Feb 2026 sending 200 manual cold emails for product roles. 6 replies. The cost-benefit was demoralising.

I'm a software dev so I built a bot. 90 days later, it's stable enough to share. Want to start a discussion about whether others in this sub are using similar tools.

What the bot does:
- Scans LinkedIn + Indeed + Naukri + Bayt + GulfTalent + RemoteOK + company careers ATS every 30 min
- Uses Gemini Flash (free tier) to score each match against my résumé
- Auto-writes a 4-6 sentence cover letter that quotes the JD
- Validates the recruiter's email via SMTP RCPT probe
- Sends from my own Gmail (200/day cap)
- Tracks bounces via IMAP and quarantines bad addresses

Everything runs on my laptop. No SaaS, no résumé upload. The website (jobybots.com) is literally just a payment page that emails you the installer.

Genuine questions for the sub:
1. Has anyone else built a similar agent loop? What did you learn?
2. Are recruiters wise to this yet? (My reply rate is ~14% — still 11× higher than Easy Apply.)
3. What's the etiquette ceiling? 50/day? 100? 200?

Not posting the link in the body — it's in my profile if you want it. Mostly here to compare notes.

---

## /r/EngineeringResumes (180K)

### Title
**Has anyone here used direct recruiter email instead of Easy Apply? Real numbers below.**

### Body
Did a 90-day A/B test. 1,000 LinkedIn Easy Apply submissions vs 1,000 direct recruiter emails for the same roles. Same résumé both cohorts.

Cohort A (Easy Apply): 18 recruiter replies, 4 first-rounds, 0 offers
Cohort B (Recruiter email): 197 replies, 41 first-rounds, 6 offers

Reply rate jumped 11×. Offer rate from 0 to 6.

The hard part is finding the recruiter's email. Two methods worked best:
1. Company's own careers/contact page — about 30% of the time they publish a mailto:
2. LinkedIn job posters often have their email in their profile contact-info card

What's been your reply rate from each channel? Curious if the gap is consistent across role types.

I wrote the methodology + full data here in case useful: [jobybots.com/blog/linkedin-easy-apply-vs-recruiter-email]

---

## /r/jobs (2.0M)

### Title
**Tips: 12 rotating email subject templates to stop Gmail from throttling you**

### Body
Found out the hard way that if you cold-email 50+ recruiters per day with the same subject line, Gmail starts marking your sends as bulk-mail and tanks your sender reputation.

Here are the 12 subject patterns I now rotate between — pick the one that fits the role you're applying for:

1. `<Role> at <Company>` (e.g., "Product Manager at Talabat")
2. `<Role> role — <Your Name>` 
3. `Application: <Role> (<Company>)`
4. `<Role> | <Name> | <Years>yrs | <City>`
5. `<Name> — <Years>yrs in <Role>`
6. `Hi <Company> — interest in your <Role> role`
7. `Quick note re: <Role> opportunities at <Company>`
8. `Re: <Role> (<City>-based candidate)`
9. `Candidate for <Role> — <Years>yrs experience`
10. `Open to <Role> positions — <City>`
11. `Interested in <Role> at <Company>`
12. `<Name> — applying for <Role> at <Company>`

Bonus: include the recruiter's first name in the subject when you know it. Reply rates roughly double.

I automate this with a tool I built (jobybots.com) but the principle works manually too.

---

## /r/SaaS (500K)

### Title
**[Show & Tell] Local-first AI agent that does what Sonara / LazyApply do — but for ₹2,999 lifetime**

### Body
Built a competitor to the AI-job-application SaaS players over the past 90 days. Different model:

- ONE-time payment instead of subscription
- Runs on the user's laptop instead of my cloud
- Uses the user's Gemini API key (free tier covers most usage)
- I don't store résumés, Gmail credentials, or any user data on a server

Tech stack: Python crawler, SQLite, Next.js + Vercel marketing site, Cloudflare Worker for license validation.

90-day numbers:
- 47 paying customers
- 3 refunds (7-day refund used)
- Gross: ~$6,800
- Infra cost: $0/mo (no servers, all customer-side)
- Total dev time: ~360 hours

Happy to answer questions about the local-first approach, GDPR routing for the UK / EU markets, or the email-deliverability work (rotating subjects, SMTP RCPT probe, IMAP bounce tracker).

jobybots.com

---

## /r/IndianFreelancers (40K)

### Title
**Built a one-time-purchase tool (₹2,999 lifetime, no subscription) — first 47 customers, what I learned**

### Body
Indie hacker post. Built JobyBots (AI job-application bot, local-first). Made it ₹2,999 lifetime instead of subscription for three reasons:

1. **Indian customers HATE subscriptions.** I learned this from interviews with 20+ candidates in Bangalore + Hyderabad. ₹500/mo feels expensive. ₹2,999 once feels like a fair deal.

2. **No recurring infra cost.** The bot runs on the user's laptop. They pay their own Gemini API + Gmail. I have no servers. So I don't need recurring revenue to recoup recurring costs.

3. **Easier UPI payment.** One UPI QR scan, one ₹2,999 transfer. No autopay friction. No card declines. Approvals in ≤30 min.

47 customers in 90 days. Refund rate 6.4%. Most refunds are people who couldn't get past the install step (Mac users — I've since added Mac install docs).

Numbers + lessons in detail at jobybots.com/blog/how-i-built-jobybots-in-90-days

Anyone else building one-time-purchase tools for the Indian market? Curious to compare conversion / refund rates.

---

## /r/dubai (250K)

### Title
**Built a job-search tool in Dubai for Dubai — looking for UAE candidates to test it**

### Body
Dubai-based PM here, currently in a full-time role (8 years in MENA retail data + AI). Spent 2 months quietly looking for my next role manually — on top of the day job — before snapping and building a bot.

The tool (JobyBots) is now in beta with 47 paying users, mostly UAE + Saudi. Looking for 5 more UAE candidates willing to use it for a month and give honest feedback.

What's UAE-specific:
- Bayt + Naukrigulf + GulfTalent integration (not just LinkedIn)
- 79 curated recruiter contacts across UAE (Michael Page Tech UAE, Charterhouse Dubai, Cooper Fitch, Marc Ellis, Nathan & Nathan, Mark Williams, NSI & Bluefin, plus 72 more)
- Arabic-friendly company directories
- UAE Resident Visa-aware cover letters

₹2,999 lifetime (~AED 130). 7-day refund.

DM if interested. Will set up a 15-min onboarding call if you've never used a job-search bot before.

(Mods: not affiliated marketing, this is the builder's own first post about it on this sub. Will delete if rule-breaking.)

---

## /r/saudiarabia (200K)

### Title
**AI job-search tool with 42 curated KSA recruiters — Vision 2030 hiring made easier**

### Body
Built an AI job-application bot specifically aware of the Saudi market. Sharing in case useful for anyone hunting roles here.

What it ships with for KSA:
- 42 curated recruiter contacts across Vision 2030 giga-projects (NEOM, Red Sea, Roshn, Qiddiya, Diriyah Gate, PIF portfolio)
- Banking (SNB, Al Rajhi, STC, Saudia, Almarai)
- MENA recruiters (Michael Page KSA, Hays Riyadh, Charterhouse, Kingston Stanley)
- Big 4 + consulting (Deloitte, PwC, EY, KPMG, McKinsey, BCG, Bain KSA)

Every 30 min the bot scans LinkedIn KSA + Indeed + GulfTalent + Bayt → scores against your résumé using Gemini AI → tailors a cover letter → emails the recruiter from your own Gmail.

Runs locally on Windows / Mac. No résumé upload. ₹2,999 lifetime (~SAR 130). 7-day refund.

jobybots.com

(Posting this from the founder account, happy to answer questions.)

---

## /r/cscareerquestionsEU (100K) — UK GDPR-safe post

### Title
**Built a UK-compliant job-application bot (Article 6(1)(f) legitimate interest mode)**

### Body
Most cold-email job tools violate UK PECR. I spent a week designing a hybrid mode for the UK that I think is defensible under Article 6(1)(f) — legitimate interests.

The rule: the bot only emails mailboxes that the recruiter THEMSELVES published on a job post as the "apply to" address. Those are public, opt-in mailboxes by design.

We ship 17 curated UK recruiter mailboxes that meet this criterion (Reed applyjobs@, Hays UK enquiries@, Michael Page applications@, Robert Half rhuk.applications@, etc.).

For the general `contacts` array we do NOT email UK addresses — the bot routes search through LinkedIn UK but doesn't auto-blast.

Is this watertight? I don't claim that. But it's a meaningful improvement over tools that just spam every UK address they find.

Curious what others on this sub think of the GDPR posture. Open to suggestions for tightening it further.

(Tool: jobybots.com. Posting transparently as the founder.)

---

## Posting cadence + safety rules

- Max 1 post per sub per 30 days.
- Always answer comments within 4 hours for first 24h after post.
- Never link the website in the post body — only in profile + replies.
- Never use the same headline twice.
- Never copy-paste body across multiple subs.
- If a post is removed, ask the mods why politely. Don't repost.
- If a sub is welcoming, write a long-form follow-up after 14 days adding more value.
