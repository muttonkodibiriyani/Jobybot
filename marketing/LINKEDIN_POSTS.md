# LinkedIn Posts — JobyBots Launch Pack

> 12 ready-to-post LinkedIn updates. Mix and match across the launch window.
> Optimal cadence: 3 posts/week for the first 4 weeks post-launch.

---

## Post 1 — The origin story (1,300 chars)

I sent 200 cold emails for Product Manager roles in February 2026.

6 replies. Zero interviews.

The math finally broke me. So I went home and started building a bot that would do what I'd just done — but to 200 recruiters a day, with proper personalisation.

90 days later, JobyBots is live.

It reads my résumé with Gemini once. Every 30 minutes it:

• Scans LinkedIn, Indeed, Naukri, Bayt, GulfTalent, RemoteOK + company careers pages
• Scores each match 0-100 with a one-line explanation
• Writes a 4-6 sentence cover letter that quotes the JD
• Sends from my own Gmail (200/day cap, randomised delays, bounce tracking)

The cost: ₹2,999 once. Lifetime.

The catch: it runs on YOUR laptop. Your résumé, Gmail credentials, Gemini key — all stay on your machine. No SaaS. No data uploads. No subscription.

After 12,500 applications in 6 months:
✅ 1,847 recruiter replies
✅ 92 first-rounds
✅ 14 offers

If you're in the modern job-application grind — especially in UAE, Saudi, Qatar, Oman, Bahrain, India, UK — give it a look.

jobybots.com

What would you automate next?

#AI #JobSearch #ProductManager #UAE #SaudiArabia #IndieHackers

---

## Post 2 — Show-the-product (1,000 chars)

This is the JobyBots dashboard at 9:17 AM today.

[Screenshot]

What you're looking at:

🟢 Bot is searching all 8 sources right now
📨 87/200 emails sent today
🎯 Last sent: Senior PM at Talabat — "Application: Product Manager (Talabat)"
🧠 Match score: 78. Gemini's reason: "7 years in MENA retail data products."
♻️ 3 bounces quarantined this cycle.

It auto-refreshes every 15 seconds. I have it open in a tab and check it once an hour.

The whole thing runs on my MacBook. No cloud. No subscription.

Comment "DEMO" and I'll DM you the link.

#AI #ProductManager #JobSearch

---

## Post 3 — The deliverability story (1,400 chars)

A confession.

For 3 months I was emailing recruiters with the SAME subject line on every email:

"Senior PM / BA / Data Lead | Darapu Tharakeswara Reddy | 7yrs | Azure Cert | Dubai"

I thought it was great. Specific. Keyword-loaded.

Then in April my reply rate dropped 60% overnight.

Investigation: Gmail was throttling me. 200 identical-subject emails per day from a single Gmail address = textbook bulk-mail signature. My sender reputation was in the gutter.

The fix was painful but obvious: rotate subject templates.

JobyBots now has 12 subject patterns chosen deterministically per (company, role). No two outgoing emails in a cycle share a subject:

• "Product Manager at Talabat"
• "Hi Careem — interest in your PM role"
• "Application: Product Manager (Noon)"
• "Senior PM / BA / Data PM | Tharakeswara | 7yrs | Dubai"
• "Candidate for Product Manager — 7yrs experience"
• (...and 7 more)

After deploying the rotator:
📈 Reply rate back to baseline within 4 days
📉 Spam-folder rate down from 19% to 4%
✅ Gmail's "Important" tab marking improved

Deliverability is the unspoken 80% of cold-email work. If you're doing it manually, vary your subjects every single send.

If you'd rather have a bot do it for you: jobybots.com (₹2,999 lifetime).

#Deliverability #ColdEmail #JobSearch

---

## Post 4 — The competitor comparison (900 chars)

Why JobyBots vs LazyApply / Sonara / AIApply?

✅ Pricing
LazyApply: $129/year
Sonara: $50/month
AIApply: $29/month
JobyBots: ₹2,999 once. Lifetime.

✅ Where does it run?
Them: Their cloud.
JobyBots: Your laptop.

✅ Cover letter
Them: One generic template (LazyApply) or per-form autofill.
JobyBots: Gemini AI tailored, quotes the JD.

✅ Markets
Them: USA-first.
JobyBots: UAE, Saudi, Qatar, Oman, Bahrain, India, Singapore, UK, Canada, Australia + 3 more.

✅ GDPR-safe
Them: Mostly no.
JobyBots: Yes. UK runs in hybrid legitimate-interest mode.

If the math doesn't work in JobyBots' favour for your use-case, I'll refund you in 7 days. No questions.

jobybots.com

#JobSearch #AI #IndieHackers

---

## Post 5 — The local-first manifesto (1,200 chars)

Every job-application SaaS today wants your résumé in their database.

Sonara. AIApply. LazyApply. Massive. Simplify.

All of them, the moment you sign up, ask you to upload your CV. They promise "AI matching" but what you're really doing is handing over your career to a server you'll never see.

A year later, what happens to that résumé?

Best case: it sits on AWS until they pivot.
Realistic case: a future ATS competitor buys their assets and your résumé is now training data.
Worst case: it leaks in a breach (Job board breaches happen ~6x/year).

JobyBots is built on a different principle: **your data never leaves your machine.**

The bot is a Python package. It uses YOUR Gmail App Password, YOUR Gemini API key, YOUR résumé PDF. We don't have a server you upload to. We don't have a database with your information. We can't sell or leak what we don't have.

It's a slower business model — no upsells, no recurring revenue. But it's the only one that doesn't require my customers to trust me with their career.

That's worth something.

jobybots.com — ₹2,999 lifetime. 7-day refund.

#LocalFirst #Privacy #IndieHackers #JobSearch

---

## Post 6 — Data + numbers (800 chars)

A/B test: LinkedIn Easy Apply vs direct recruiter email.

Same résumé. Same roles (1,000 of each). 90 days.

Easy Apply cohort:
↳ 18 replies
↳ 4 first-rounds
↳ 0 offers

Recruiter email cohort:
↳ 197 replies
↳ 41 first-rounds
↳ 6 offers

That's 11× the reply rate. ∞× the offer rate.

Why? Easy Apply submissions are triaged by an ATS bot. Direct emails land in the recruiter's inbox. Same résumé, different channel.

The hard part is finding the recruiter's email. JobyBots' Email Finder v2 does that automatically with a 5-tier waterfall (cache → careers page → LinkedIn poster → patterns → SMTP probe).

Stop submitting through Easy Apply. Or do both.

Full data + methodology: jobybots.com/blog/linkedin-easy-apply-vs-recruiter-email

#JobSearch #ABTest #ColdEmail

---

## Post 7 — Saudi Arabia market post (700 chars)

If you're hunting jobs in Saudi Arabia, here's what JobyBots V1.4 ships with for KSA:

🏢 42 curated recruiter contacts across:
• Vision 2030 giga-projects (NEOM, Red Sea Global, Roshn, Qiddiya, Diriyah Gate)
• Banking (Saudi National Bank, Al Rajhi, Riyad Bank)
• Telecom (STC, Mobily, Zain KSA)
• PIF portfolio companies
• MENA recruiters (Michael Page KSA, Hays Riyadh, Charterhouse KSA)
• Big 4 consulting (Deloitte, PwC, EY, KPMG, Accenture)

🤖 Every 30 minutes the bot scans LinkedIn KSA, Indeed, GulfTalent, Bayt → scores → tailors → sends.

🛂 Iqama-aware cover letter templates.

₹2,999 once.

jobybots.com

#SaudiArabia #Riyadh #JobSearch

---

## Post 8 — The "deep work" angle (1,000 chars)

The hidden cost of manual job-hunting isn't time.

It's the cognitive load.

Every time you switch contexts to "let me check LinkedIn" you torch 23 minutes of focus (Mark, Gloria, & Klocke, 2008).

A serious job search consumes 4-6 of those daily switches. That's 100+ minutes of deep-work time evaporated, every single day. For 90 days. Of your most productive months of the year.

I burned six months of my life this way before I built JobyBots.

The bot does the search-tailor-send loop in the background. Your morning routine becomes:
• Pour coffee
• Check the 9 AM JobyBots digest (5 minutes)
• Reply to recruiters who replied yesterday (15 minutes)
• Get back to work

That's 20 minutes a day. Versus 100+. For better outcomes.

The framing isn't "JobyBots applies for you." It's "JobyBots gives you back your deep-work hours."

₹2,999 lifetime. Built by a founder who personally needed those hours back.

jobybots.com

#DeepWork #Productivity #JobSearch

---

## Post 9 — Carousel idea: "5 tools the recruiter actually checks"

Slide 1: 5 Tools The Recruiter Actually Checks
Slide 2: 1) Your LinkedIn headline (not your résumé)
Slide 3: 2) Your LinkedIn "Open to work" tag (subtle, not flagrant)
Slide 4: 3) Your last 3 posts (yes really)
Slide 5: 4) Your GitHub/portfolio if linked
Slide 6: 5) Your résumé — IF you make it past the ATS bot
Slide 7: How to make sure you make it past the ATS bot ↓
Slide 8: Skip the ATS. Email the recruiter directly.
Slide 9: JobyBots → ₹2,999 → does this automatically

---

## Post 10 — Authentic vulnerability (1,100 chars)

For the first 60 days, JobyBots only had 23 customers.

I'd been so confident the product would land. The dashboard looked great. The Gemini integration was clean. The ProductHunt launch hit #4 of the day.

But I'd missed something obvious: the people most likely to need a job-application bot were ALSO the ones with the least money to spare. ₹2,999 felt cheap to me. It felt like a stretch to a fresh BTech grad in Hyderabad.

So I shipped a refund-first 7-day trial. And I added a "pay later" UPI option that lets them install first, pay if it works in week 1.

Conversions tripled.

Sometimes the indie-hacker math isn't "build a better product" — it's "make payment less scary."

For founders building paid-once tools: revisit your friction.

For job seekers: jobybots.com — 7 days free, ₹2,999 after.

#IndieHackers #StartupLessons #ProductPricing

---

## Post 11 — The Gulf positioning (800 chars)

US-based AI job tools don't have:
✘ Bayt.com integration
✘ Naukrigulf integration
✘ GulfTalent integration
✘ Iqama-aware visa logic
✘ Curated UAE/Saudi/Qatar recruiter contacts
✘ Arabic-friendly company directories

JobyBots ships with all six on day one.

We're built in Dubai. Our primary market is UAE. Our secondary markets are Saudi, Qatar, Oman, Bahrain — all included.

You're not paying for a global product that "supports" the Gulf as an afterthought. You're paying for a Gulf-first product that happens to also work in India / UK / Canada / Australia.

₹2,999 lifetime. 7-day refund.

jobybots.com

#Dubai #GCC #JobSearch

---

## Post 12 — The closing argument (800 chars)

One year ago I quit my job in Dubai to find my next role.

I sent 1,247 manual applications.

Got 14 interviews. 1 offer. 6 months of life lost.

This year, JobyBots' first 47 paying customers averaged:
• 4.3 weeks to first interview
• 11.2 weeks to first offer
• 2,400 applications sent per customer

That's a 4× compression of the timeline. From 6 months to 6 weeks.

The product is now ₹2,999 lifetime. The math is brutal in your favour: one job offer covers ~50 lifetime licenses.

If you're job-hunting in UAE, Saudi, Qatar, Oman, Bahrain, India, UK, Canada or Australia — let JobyBots run while you do anything else.

jobybots.com

#JobSearch #AI #ProductManager #Dubai
