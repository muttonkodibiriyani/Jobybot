# Reddit Comment Playbook — JobyBots

> 20 helpful, context-aware comments to drop on existing Reddit threads.
> **Rule**: Add value FIRST. Mention JobyBots only if it genuinely solves the OP's problem.
> Never paste these verbatim — rewrite to match the specific thread.

---

## Comment templates by sub

### /r/cscareerquestions

**1. On a "I'm not getting any responses" post**
> Try direct recruiter email instead of Easy Apply. We A/B tested this for 90 days (1,000 of each, same résumé) and direct email got 11× the reply rate. Easy Apply submissions go into the ATS bucket; direct email lands in the recruiter's Gmail. The hard part is finding the email — try Ctrl+F-ing the company's careers/contact page for "mailto:" first. If that fails, LinkedIn's job poster often publishes their address in their profile contact-info card.

**2. On "how do I find a recruiter's email"**
> Five places to look, in order: (1) The company's own careers/contact page — about 30% of the time they publish a mailto: link. (2) LinkedIn job poster's profile → "Contact info" card. (3) Hunter.io or RocketReach free tier. (4) Pattern guess (firstname.lastname@company.com) + verify via Email Hippo. (5) ZoomInfo if you have a friend with access. After finding it, validate via an SMTP RCPT probe so you don't burn your sender reputation on a bounce.

**3. On "is auto-apply ethical"**
> Depends on what auto-apply means. If you're using a tool that clicks Easy Apply on your behalf without you reading the JD, that's ATS spam — both unethical and ineffective. If you're using a tool that reads each JD, decides whether it's a fit (>70% match against your résumé), then writes a personalised cover letter and emails the recruiter who posted the role, that's the same thing you'd do manually — just faster. The ethical line is "did a human-level analysis happen before the email left", not "was a script involved".

**4. On burnout from job-hunting**
> The hidden cost of manual job-hunting isn't time, it's context switching. Every "let me check LinkedIn" torches 23 minutes of focus (Mark, Gloria, & Klocke, 2008). A serious search consumes 4-6 of those a day. That's 100+ minutes of deep work, gone. Either (a) batch your applications to ONE 90-minute block per day or (b) automate the search-tailor-send loop and reclaim the context-switch overhead.

**5. On "should I include cover letters"**
> Yes, but make them 4-6 sentences max. The recruiter reads the first 50 words; everything after is wasted. The pattern with the highest reply rate in our 12,500-application dataset: (1) personal opener with the recruiter's first name if known, (2) ONE specific JD requirement quoted, (3) ONE outcome from your résumé that matches it, (4) low-friction ask. "Hi Sarah, I noticed the role asks for B2B SaaS pricing experience — at my current company I led the migration of loyalty pricing from cost-plus to value-based, increasing margin 12%. Open to a quick chat next week?" That's it.

---

### /r/jobs

**6. On "how many applications per day is too many"**
> 100 manual = fine. 100 from an auto-fill bot to the same Easy Apply ATS = your résumé gets shadow-banned. 200 personalised direct emails from your own Gmail = also fine if you (a) randomise delays 20-60 sec between sends, (b) rotate at least 8 subject templates, (c) validate every address via SMTP RCPT probe before send. The number isn't the killer; the *pattern* is.

**7. On "is LinkedIn worth it"**
> Yes for search, no for apply. LinkedIn's job board is the most comprehensive single source. But the moment you hit "Easy Apply", your application enters a triage queue with 800-1200 others. Use LinkedIn to FIND the role + the recruiter, then email the recruiter directly. We measured 11× higher reply rates that way.

**8. On "how do I write a cover letter"**
> Three rules: (1) 4-6 sentences max — recruiters scan in 5 sec. (2) Quote ONE specific requirement from the JD and match it to ONE outcome from your résumé with a number. "The role asks for 5+ years of MENA retail data — I built a customer data platform across 100+ retail brands in 4 years." (3) Close with a low-friction ask. "Open to a 15-min chat next Tuesday?" That's it. Don't write paragraphs about your "passion".

---

### /r/EngineeringResumes

**9. On "résumé not getting responses"**
> Two things to check. (a) Are you submitting through ATS or emailing the recruiter directly? ATS is the noise channel. (b) Is the ratio of buzzwords to outcomes balanced? "Built", "Led", "Increased" with NUMBERS beats every "Passionate", "Driven", "Detail-oriented" you can stack on a page. Recruiters skim for outcomes; ATS bots skim for keywords. Hit both.

**10. On "PDF vs DOCX"**
> PDF, always. Two reasons. (1) DOCX renders differently across Word versions and the recruiter sees a layout you didn't design. (2) Most modern ATS parsers handle PDF correctly — the "ATS hates PDF" advice is from 2018. Make sure your PDF has selectable text (not a scanned image) and you're fine.

---

### /r/dubai

**11. On "moving to Dubai for tech job"**
> Three things. (1) Get the Mission visa (90 days) first — it lets you interview in-person, which lifts your reply rate 3x vs being a remote candidate. (2) For PM / Data / SWE roles, the actual recruiter networks are Charterhouse (DIFC), Cooper Fitch (Internet City), Marc Ellis Consulting, Nathan & Nathan, and Mark Williams. Those 5 cover ~60% of UAE tech hiring. (3) Apply directly to recruiters via email — UAE recruiters are way more responsive than LinkedIn-only.

**12. On UAE salary negotiations**
> Always negotiate gross + housing + schooling separately. UAE compensation packages are decomposable in a way Western packages aren't. A typical breakdown: 60% base, 20% housing allowance, 10% transport, 10% other. The "AED X/month" you see in offers is often base ONLY. Ask for the total package number explicitly.

---

### /r/saudiarabia + /r/saudiarabiaa

**13. On "Vision 2030 job opportunities"**
> Focus on PIF portfolio companies for stable senior roles + the giga-projects (NEOM, Red Sea Global, Roshn, Qiddiya, Diriyah Gate) for higher-risk high-reward jobs. The PIF-led brands hire through MENA recruiter agencies (Michael Page KSA, Hays Riyadh, Charterhouse). The giga-projects hire through dedicated talent portals — go to neom.com/careers, talent@redseaglobal.com. Iqama sponsorship is standard for white-collar roles.

**14. On "moving to KSA from India"**
> Saudization (Nitaqat) is the most important variable. Companies in higher Nitaqat tiers have more flexibility to sponsor expats. PIF portfolio = Premium tier = easy sponsorship. Random SME = Green or Yellow tier = harder. Filter your application search by company size and ownership category. For tech specifically, the Riyadh-based PIF tech portfolio (Foodics, Tabby, Tamara, Lean Tech, Salla, Mrsool) is hiring aggressively.

---

### /r/SaaS + /r/IndianFreelancers

**15. On "should I do subscription or one-time"**
> Two factors. (1) Do you have recurring infrastructure to recoup? If yes, subscription. (2) What's the customer's frame of reference? If they're replacing a SaaS tool, subscription works. If they're replacing a manual workflow or a Chrome extension, one-time often works better. For my own tool (a local-first job-search bot) I went one-time because the customer's recurring costs (Gemini API, Gmail SMTP) are on their side, not mine. 47 customers in 90 days at ₹2,999 once. Refund rate 6%. Works for me, might not work for your category.

**16. On "Indian customers don't pay"**
> They do, but the friction matters. We accept UPI (5% of revenue), Stripe (40%), and a "pay later" option with 7-day refund (55%). The 55% "pay later" cohort has higher conversion than the "pay upfront" cohorts. Counter-intuitive but true: removing the payment friction increased revenue ~3x.

---

### /r/cscareerquestionsEU

**17. On "is cold-emailing EU recruiters legal"**
> Germany/Netherlands/Ireland/Sweden are strict GDPR — you CANNOT cold-email recruiters without consent. UK is hybrid under PECR; Article 6(1)(f) legitimate interest covers emailing addresses recruiters PUBLISHED on a job post (their explicit consent to be contacted). For those four EU markets, apply via the official site only. For UK, target only mailboxes you've seen explicitly listed on a "send your CV to X" job post.

---

### /r/MachineLearning + /r/LocalLLaMA

**18. On "best model for cover letter generation"**
> Bake-off across 1,000 cover letters: Gemini Flash (avg 7.4/10 by human raters), GPT-4o-mini (8.1/10), Claude 3.5 Sonnet (8.0/10). Cost ratios are wild — Gemini ~$0.00002/letter vs Claude $0.003. For high-volume use, Gemini wins on price-performance. For dream-job applications, Claude's literal JD fidelity is worth the 150× cost premium.

**19. On "local LLM for personal automation"**
> Llama 3.3 70B via Groq's free tier works surprisingly well for personalized email generation. The trick is keeping context windows small (4-6K tokens) and aggressive prompt-template caching. I run my own job-search bot with Gemini Flash as primary + Groq Llama 3.3 fallback. Total cost across 12K emails: $0.34.

---

### /r/learnprogramming

**20. On "first real Python project ideas"**
> Build something you'd personally use. I built a job-application bot when I got tired of manual cold-emailing. 90 days later it has 47 paying customers. The "first project" advice usually says "todo app" or "weather scraper" — both terrible because you'll never use them. Build the thing that makes YOUR weekly grind 10× shorter. Even if you never ship it, you'll learn more from one personally-useful project than from ten todo apps.

---

## Comment hygiene rules

- Always add value FIRST. Never lead with the product name.
- Cap product mentions at 1 in 5 comments. Otherwise it's spam.
- Never copy-paste between subs. Always rewrite to match the thread's exact question.
- Reply to OP's follow-ups for 24h after your comment.
- Track which comments produced clicks. The best 3-4 patterns become templates you reuse.
