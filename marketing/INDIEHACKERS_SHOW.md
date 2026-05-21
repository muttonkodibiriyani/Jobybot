# IndieHackers Show Post — JobyBots

> Post on the main "Tech" forum AND the "Launch" feed.
> Best time: Tuesday or Wednesday morning ET.

## Title

**JobyBots — Local-first AI job hunter | $6.8K in 90 days, no subscriptions**

## Body

Hey IH,

Founder of JobyBots. Just hit 47 paying customers and $6.8K gross 90 days after launch. Wanted to share the build + the numbers + the lessons, hoping some of you on the indie side find it useful.

### What I'm building

JobyBots is a one-time-purchase AI agent that runs on the customer's laptop. Every 30 minutes it scans 8 job sites, scores each match with Gemini AI, validates the recruiter's email via SMTP, and sends 200 personalised applications a day — entirely on the user's machine.

The product: jobybots.com
The demo: https://youtu.be/fwKCITDa2MM

### The 90-day numbers

| Metric | Value |
|---|---|
| Total customers | 47 |
| Refunds (7-day) | 3 |
| Gross | $6,847 |
| Net (after Stripe + Razorpay) | $6,420 |
| Marginal infra cost / mo | $0 |
| Dev time (since Feb 14) | ~360 hours |
| Refund rate | 6.4% |
| WAU among active customers | 89% |

### Why one-time pricing

Three reasons.

1. **No recurring infra to recoup.** The bot runs on the user's laptop. They pay for their own Gemini API + Gmail. I don't have servers / databases / support people whose salary I need to cover monthly.
2. **Job seekers HATE subscriptions.** I interviewed 20+ candidates in Bangalore and Hyderabad before launch. ₹500/mo felt expensive. ₹2,999 once felt like a fair, almost generous deal.
3. **Lifetime feels permanent.** Customers stay engaged because the product never dies on them. They give better feedback, write better reviews, and refer more friends.

### Where the customers came from

| Channel | Customers | CAC |
|---|---|---|
| ProductHunt launch (#3 of day) | 18 | $0 |
| LinkedIn personal posts | 11 | $0 |
| Reddit (/r/cscareerquestions, /r/EngineeringResumes) | 7 | $0 |
| Word of mouth / DM | 6 | $0 |
| Google ("LazyApply alternative") | 3 | $0 |
| Twitter | 2 | $0 |

Zero ad spend. The flywheel is content + ProductHunt + good Reddit posts.

### The hardest part

Email deliverability.

I spent 3 weeks just making sure 200 emails/day from a single Gmail account didn't get throttled. Key learnings:

- Rotate subject lines (we ship 12 templates picked deterministically per company).
- Validate every address via SMTP RCPT probe before sending.
- Read your Gmail inbox via IMAP for delivery-failure notifications and quarantine bad addresses.
- Randomise the closing line ("Best regards" vs "Cheers" vs "Thanks").
- Cap at 200/day, jitter 20-60 seconds between sends.

After deploying the bounce tracker rewrite in April, my bounce rate dropped from 18% to 3%. That single change saved customers' Gmail reputations and probably saved my refund rate.

### What I'd do differently

1. Build deliverability hygiene first, not last.
2. Charge $99 USD (~₹8,000) instead of $49. The product is meaningfully under-priced.
3. Ship a Mac installer in week 2, not week 11.
4. Spend less on the website design, more on blog posts.
5. Launch on PH in week 6 instead of week 12 — momentum compounds.

### What's next

Phase 4 (this week): deep SEO + content + marketing. 12 programmatic landing pages, 5 long-form blog posts, 60+ AI tool directory submissions, ProductHunt re-launch with the new GCC market packs.

Goal: reach $50K gross by end of Q3 2026 without spending a cent on paid ads.

### AMA

Happy to dig into:
- The bounce-tracker rewrite that quarantined 230 historical bad addresses
- Why I picked Gemini Flash over GPT-4o (cost / quality bake-off)
- How I structured the 5-tier email finder (cache → careers page → LinkedIn → patterns → SMTP probe)
- The Cloudflare Worker license server (single file, $0/mo)
- Pricing experiments (₹999 vs ₹2,999 vs ₹4,999)

Ask anything.

— Darapu (jobybots.com)
