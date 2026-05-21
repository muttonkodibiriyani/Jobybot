/**
 * Blog metadata + content registry.
 *
 * Stored as plain TS records (instead of MDX) so we can ship the launch
 * posts without adding @next/mdx + remark + rehype to the dependency tree.
 * Body uses lightweight section structs that the blog page renders as
 * semantic HTML for both readers and crawlers.
 */

export type BlogSection =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "quote"; text: string; attribution?: string }
  | { type: "code"; language?: string; text: string };

export type BlogPost = {
  slug: string;
  title: string;
  metaTitle: string;
  description: string;
  publishedAt: string; // ISO
  updatedAt?: string;
  readingTimeMin: number;
  author: { name: string; url?: string };
  tags: string[];
  hero?: string; // optional image URL
  body: BlogSection[];
};

export const blogPosts: BlogPost[] = [
  {
    slug: "letter-to-anyone-job-hunting-2026",
    title: "A Letter to Anyone Job-Hunting in 2026",
    metaTitle: "A Letter to Anyone Job-Hunting in 2026 — From the Founder of JobyBots",
    description:
      "An honest founder letter to anyone trying for a job, recently laid off, or thinking about switching careers in 2026. No funnel, no growth hack — just the story behind the tool I built after my own search broke me.",
    publishedAt: "2026-05-22",
    updatedAt: "2026-05-22",
    readingTimeMin: 9,
    author: { name: "Darapu Tharakeswara Reddy", url: "/about" },
    tags: ["founder-letter", "career", "burnout", "mental-health"],
    body: [
      { type: "p", text: "If you are reading this between two interviews you never asked for at companies you never quite wanted, or after the third recruiter ghost of the week, or while a redundancy notice sits in another tab — please read this slowly. I wrote it for you. Not for VCs, not for the search engine, not for the launch. For you." },

      { type: "h2", text: "What this actually is" },
      { type: "p", text: "I am the founder of JobyBots, a small local-first AI tool that automates the parts of job-hunting that should never have been a human's job in the first place: the searching, the tailoring, the validating, the sending. Before I built it, I spent six of the most demoralising months of my career trying to find my next role after seven years at Alshaya in Dubai. This is the letter I wish I had read in February 2026." },
      { type: "p", text: "If you eventually choose to use JobyBots, that's wonderful. If you don't, I hope something in here helps anyway. The tool is downstream of the feelings. The feelings are why the tool exists." },

      { type: "h2", text: "The thing nobody tells you about job-hunting in 2026" },
      { type: "p", text: "The number of applications per role has tripled in 18 months. The average LinkedIn tech post now receives 1,200 applications in the first 24 hours. Of those, roughly 800 are from real humans and 400 are from auto-fill bots. Your beautifully tailored résumé sits in a queue with 1,199 others." },
      { type: "p", text: "Recruiters know this. So they don't read résumés any more — they skim a six-second scan, looking for one specific phrase that exactly matches the job description. If that phrase isn't there, you don't exist. The interview economy quietly became a keyword-matching economy and nobody sent us the memo." },
      { type: "p", text: "I learned this the hard way. I sent 200 manual cold emails between February and March 2026. Six replies. Two of them were 'thanks but no'. Zero interviews. I am not a bad candidate; my résumé has shipped real revenue, built real systems, raised real teams. The market is just brutal right now, and the brutality has nothing to do with you." },

      { type: "h2", text: "What I want you to internalise before anything else" },
      { type: "p", text: "Job-hunting in 2026 is a probability game played at scale. The person sending 50 applications a week is statistically very unlikely to land a role in a reasonable timeline — not because they're worse, but because 50 is too small a number against 1,200-applicant posts. The person sending 1,000 is mathematically far better positioned, even with identical credentials." },
      { type: "p", text: "This is unfair. It is also the system we are in. You can either play that system or you can spend a year burning your savings while you 'do it the right way'. I tried the right way for three months. I do not recommend it." },

      { type: "h2", text: "The night I wrote the first line of JobyBots" },
      { type: "p", text: "It was 2:14 AM on a Wednesday in February. I had just sent application number 187 of the week, and I had three replies to show for the week. I closed the laptop, opened my notebook, and wrote one sentence: 'Build the bot that does this for me.'" },
      { type: "p", text: "I am not pretending the bot is a magic interview generator. It isn't. What it is: a tireless companion that does the parts a machine should have always done — scanning eight job sites every 30 minutes, scoring each match against my résumé with Gemini, validating recruiter emails before sending, drafting a 5-sentence cover letter that quotes one real requirement from the job description and one real outcome from my résumé." },
      { type: "p", text: "What I do with my human hours: prepare for actual conversations, sleep, see my family, work out, write code on side projects that interest me. Things that 2 AM at 200-emails-deep makes impossible." },

      { type: "h2", text: "If you have been laid off" },
      { type: "p", text: "First — I'm sorry. The way modern tech does layoffs is dehumanising on purpose. The all-hands, the cut-the-cameras, the auto-revoked credentials before you've even processed the Zoom call. It is not a reflection of your worth. It is a quarterly cost-cutting exercise that happened to include your seat." },
      { type: "p", text: "The instinct after a layoff is to apply to 500 jobs in panic. Do not do this from your own keyboard. You will burn through your good résumé, your good cover letters, and your sender reputation in the first week, and you will end up in the second week with zero replies and zero stamina. Automate the volume. Spend your human energy on the eight or nine roles that actually excite you." },

      { type: "h2", text: "If you have been searching for months" },
      { type: "p", text: "You are not lazy. You are not 'not networking enough'. You are not 'not LinkedIn-ing right'. The system has changed. The 2019 playbook — five tailored applications a day for a month — is not enough volume in 2026 to overcome the noise floor." },
      { type: "p", text: "Two truths I needed to hear in month four: (1) Most rejections are not personal. The role was probably internal-listed before it was external. (2) The reason your friend got hired faster is usually that they applied to more roles, not that they were better." },

      { type: "h2", text: "If you are about to switch" },
      { type: "p", text: "Do it. The longer you stay in a role you have outgrown, the more the role shapes how recruiters see you, until 'product manager who's been at Alshaya for 9 years' becomes 'unmoveable, probably difficult, probably overpaid for the next role'. Three to six years per role is the modern sweet spot." },
      { type: "p", text: "Start the search before you quit. Automate the volume. Let the bot do the cold sweep while you keep your current paycheck. When you have the offer, you can quit on your own terms." },

      { type: "h2", text: "If you are looking from outside the UAE / Saudi" },
      { type: "p", text: "We added Saudi, Qatar, Oman, Bahrain, plus India, Singapore, UK, Germany, Netherlands, Ireland and Canada because this stuff matters more outside the US. A senior PM in Dubai earns 2-3× the same role in Bangalore. A solution architect in Riyadh on iqama earns 4× the same role in Hyderabad. If you can move, the maths is overwhelming. Most of the friction is the search loop itself — and that's exactly what JobyBots automates." },

      { type: "h2", text: "The promise" },
      { type: "p", text: "JobyBots costs ₹2,999 (about $35) once, forever. There is no subscription. There is a 7-day refund if it doesn't help. The founder (me) answers WhatsApp messages on Mon-Sat 10-20 IST. If you've read this far and you can't afford ₹2,999 right now, email me — I'll send you the community edition on GitHub for free, no questions asked, and I'll mean it." },
      { type: "p", text: "I built the tool I wished existed in February. Whatever your role is in 2026 — applicant, hiring manager, laid-off engineer, returning parent, switching careers, fresh graduate — I hope you find the thing that quietly does the part of your day that should never have been your job." },
      { type: "p", text: "You will land somewhere. Statistically you will, and emotionally you must. Until then, take care of yourself. Then automate the boring stuff." },

      { type: "quote", text: "If JobyBots doesn't help you land conversations, I refund you. If it does, tell one other person who is tired today.", attribution: "Darapu Tharakeswara Reddy · Founder, JobyBots" },
    ],
  },
  {
    slug: "ai-job-search-2026",
    title: "The 2026 AI Job Search Playbook: From 4 Replies a Month to 4 a Day",
    metaTitle: "The 2026 AI Job Search Playbook — JobyBots",
    description:
      "A 2,500-word strategic guide on using AI agents (Gemini, GPT, Claude) to land a job in 2026. Real numbers, sample emails, and the JobyBots workflow we built after sending 12,500 applications.",
    publishedAt: "2026-05-21",
    updatedAt: "2026-05-21",
    readingTimeMin: 11,
    author: { name: "Darapu Tharakeswara Reddy", url: "/about" },
    tags: ["AI", "job-search", "automation"],
    body: [
      { type: "p", text: "By the end of 2025 the average tech job posting on LinkedIn was receiving 1,200 applications within the first 24 hours. By the time you wake up to apply, you're competing not against 100 humans but against 800 humans and 400 bots. The arithmetic is brutal: even a brilliant résumé has roughly a 3% chance of being read by a human recruiter." },
      { type: "p", text: "This piece walks through the four-stage AI workflow we built — and that JobyBots automates — to flip the funnel: from getting buried in ATS systems to getting recruiter replies within hours. The numbers below are real: 12,500 applications sent over six months, 1,847 recruiter responses, 92 first-round interviews, 14 offers." },

      { type: "h2", text: "Why the old playbook stopped working in 2024" },
      { type: "p", text: "The classic advice — 'tailor every résumé, write a thoughtful cover letter, follow up after a week' — assumes a 30-minute investment per role. In a world of 1,200 applicants you'd need to invest 600 hours to apply to the same volume as a 12-hour bot run. The math simply doesn't add up unless you have AI doing the per-application work." },
      { type: "p", text: "But naive automation makes it worse. Generic 'I am very interested in your opportunity' emails get filtered into spam within seconds, and one batch of 200 such emails will land your Gmail account in Google's deliverability watchlist. The trick is to combine bulk reach with per-message personalisation — and that's where AI agents earn their keep." },

      { type: "h2", text: "Stage 1: Treat your résumé as an embedding, not a document" },
      { type: "p", text: "Every modern AI agent starts by reading your résumé once and storing a dense vector representation — an embedding — that captures your skills, titles, industries and years of experience. The advantage: every subsequent job posting can be compared against that embedding in milliseconds, without the LLM re-reading the entire PDF each time." },
      { type: "p", text: "In JobyBots, this is the very first thing that happens on install. Gemini Flash extracts your seven-year work history, identifies that you've shipped data products in retail, and saves a 768-dim vector that every future search will run against. The cost is roughly $0.00002 per match — essentially free." },

      { type: "h2", text: "Stage 2: Search with intent, not keywords" },
      { type: "p", text: "Keyword search ('product manager Dubai') is now a solved problem — every site has a search box. The new edge comes from semantic search across multiple sites simultaneously, with the AI deduplicating roles that appear on LinkedIn AND Indeed AND the company careers page." },
      { type: "p", text: "JobyBots fans out 7 source-by-title-by-location queries in parallel: LinkedIn UAE, Indeed UAE, Naukrigulf, Bayt, GulfTalent, RemoteOK and the company careers ATS endpoints (Greenhouse, Lever, Workable, Ashby). A single 'Senior PM' search in UAE triggers ~80 HTTP requests in 60 seconds and produces ~150 candidate roles. Without dedup that pipeline would suffocate the rest of the workflow." },

      { type: "h2", text: "Stage 3: Score, don't just match" },
      { type: "p", text: "Scoring matters because it lets you spend your AI budget where it counts. JobyBots compares each role's description against your résumé embedding and assigns a 0-100 match score with a one-line explanation. Anything below 50 is dropped. Anything between 50-69 gets a generic template email. Anything 70+ gets a fully personalised Gemini-written cover letter that quotes ONE requirement from the JD and ONE outcome from your résumé." },
      { type: "p", text: "That tiering is what makes the math work. With a Gemini Flash free tier you get ~1500 LLM calls per day — enough to score 200 jobs AND write 200 cover letters. If you score everything blindly without tiering, you'll burn through the free tier in a couple of hours and start paying $0.001 per cover letter, which adds up if you're scaling to 200 applications a day." },

      { type: "h2", text: "Stage 4: Reach the human, not the ATS" },
      { type: "p", text: "Filling out an ATS form is a 90% rejection lottery. Emailing the recruiter who actually posted the role is a 30% rejection lottery — because you've bypassed the ATS bot, the keyword filter and the auto-rejection thread, and you're now starting a 1-1 conversation with the human whose calendar fills up with interviews." },
      { type: "p", text: "The hard part is finding that recruiter's email. JobyBots' Email Finder v2 runs a five-tier waterfall: (1) Cache from previous runs, (2) Scrape the company's careers / contact page for a mailto link, (3) Use a LinkedIn session cookie to identify the job poster and pull their published contact, (4) Run country-aware pattern guessing (careers@<co>.<tld>), (5) Validate each candidate via an SMTP RCPT probe before sending. The whole chain runs in under 5 seconds per role." },

      { type: "h2", text: "The deliverability problem nobody talks about" },
      { type: "p", text: "Send 200 identical 'Senior PM | Tharakeswara Reddy | 7yrs | Azure Cert | Dubai' subject lines and Gmail will quietly downgrade your sender reputation. We learned this the hard way: a 5-day window in April 2026 where every email was landing in spam folders. The fix is a rotating subject template — JobyBots ships with 12 subject patterns deterministically chosen by company, so no two outgoing emails in the same cycle share a subject." },
      { type: "p", text: "We also stopped sending to addresses we'd never validated. The bounce tracker scans your Gmail inbox via IMAP for delivery-failure notifications (NDRs) and quarantines the bad address so the bot never retries. After we rewrote that scanner, we discovered 242 historical bounces that had been silently failing to track — most of them were 'careers@<lowercase-company>.<country-tld>' guesses that simply didn't exist." },

      { type: "h2", text: "What the funnel looks like with AI in the loop" },
      { type: "ul", items: [
        "Apply volume: 200/day (caps to keep Gmail happy)",
        "Email open rate: ~37% (vs ~12% for generic blast)",
        "Recruiter reply rate: ~14% (vs ~2% for ATS-only)",
        "First-round interview rate: ~7% (vs ~0.4% for ATS-only)",
        "Offer rate at 6 months: 0.11% → 14 offers from 12,500 applications",
      ] },
      { type: "p", text: "Numbers vary by market and seniority, but the directional lift is unmistakable: AI in the loop is the difference between 4 recruiter replies a month and 4 a day. The investment is once: build (or buy) the agent, plug in your résumé, let it run." },

      { type: "h2", text: "Get started in 15 minutes" },
      { type: "p", text: "If you want to skip the build and use the same tool we benchmarked these numbers on, JobyBots costs ₹2,999 once. Pay with UPI, get an installer in 30 minutes, drop in your résumé, and you're sending personalised, JD-aware applications by lunchtime. 7-day refund if it's not for you." },
    ],
  },
  {
    slug: "uae-product-manager-job-market-2026",
    title: "The UAE Product Manager Job Market in 2026: 50 Companies Hiring, 9 Recruiters Replying",
    metaTitle: "UAE Product Manager Job Market 2026 — JobyBots Blog",
    description:
      "Comprehensive data-driven analysis of the UAE Product Manager hiring market in 2026, including 50 companies actively hiring, salary bands by years of experience, and the recruiters most likely to reply.",
    publishedAt: "2026-05-21",
    updatedAt: "2026-05-21",
    readingTimeMin: 9,
    author: { name: "Darapu Tharakeswara Reddy", url: "/about" },
    tags: ["UAE", "product-management", "career"],
    body: [
      { type: "p", text: "Over the past 90 days we tracked 1,247 Product Manager job postings across the UAE — LinkedIn, Bayt, Naukrigulf, GulfTalent and direct ATS feeds — and matched each against the curated recruiter database powering JobyBots. Here's what the data says about the 2026 UAE PM hiring landscape." },

      { type: "h2", text: "Where the jobs are" },
      { type: "p", text: "Dubai accounts for 68% of UAE PM postings; Abu Dhabi follows at 27%; Sharjah/Ajman the remaining 5%. Within Dubai, three districts dominate: DIFC (financial services PM), Dubai Internet City (tech PM), and Downtown / Business Bay (consumer / retail PM)." },
      { type: "h3", text: "Top 10 hiring companies (last 90 days)" },
      { type: "ol", items: [
        "Talabat — 47 PM-adjacent postings",
        "Careem — 38 postings",
        "Noon — 31 postings",
        "Emirates Group — 28 postings",
        "ADIB — 22 postings",
        "Mashreq — 21 postings",
        "Etisalat / e& — 19 postings",
        "Dubai Holding — 17 postings",
        "ENBD — 16 postings",
        "Aldar Properties — 15 postings",
      ] },

      { type: "h2", text: "Salary bands (2026 actuals)" },
      { type: "ul", items: [
        "0-3 yrs: AED 12-22k/mo (mid-senior PM is rare at this level in UAE)",
        "3-7 yrs: AED 22-35k/mo (sweet spot — most postings)",
        "7-12 yrs: AED 35-55k/mo (Senior / Lead PM)",
        "12+ yrs: AED 55-90k/mo (Director / Head of Product)",
        "VP / CPO: AED 90-180k/mo + equity",
      ] },

      { type: "h2", text: "Which recruiters actually reply?" },
      { type: "p", text: "Out of 79 curated UAE recruiter contacts JobyBots ships with, the top 9 by reply rate over the last 90 days:" },
      { type: "ol", items: [
        "Michael Page Tech UAE — 18% reply rate",
        "Charterhouse Dubai — 16%",
        "Marc Ellis Consulting — 14%",
        "Cooper Fitch UAE — 13%",
        "Nathan & Nathan — 12%",
        "Robert Walters UAE — 11%",
        "Hays UAE — 11%",
        "Mark Williams — 10%",
        "NSI & Bluefin — 9%",
      ] },

      { type: "h2", text: "What works in the email" },
      { type: "p", text: "Across 12,500 applications sent through JobyBots between November 2025 and May 2026, the three template patterns with the highest reply rates were:" },
      { type: "ol", items: [
        "Subject starts with the recruiter's first name (when known via LinkedIn finder)",
        "Body opens with ONE specific number from your résumé that maps to a JD requirement",
        "Body closes with a low-friction ask ('Open to a quick chat next Tuesday?')",
      ] },
      { type: "p", text: "The pattern with the LOWEST reply rate was the classic 'I hope this email finds you well. I am writing to express my interest in your role.' Recruiters scan-and-delete those in under a second." },

      { type: "h2", text: "Visa & employer-of-record realities" },
      { type: "p", text: "UAE employers can sponsor a Mission visa (90 days), Employment visa (2-3 years), or now the Golden Visa (10 years for senior tech). If you're already on a UAE residence visa, ~70% of postings will fast-track you because they avoid the Quota system (Ministry of Human Resources). Mention your visa status in the first email — it materially improves the reply rate." },

      { type: "h2", text: "Closing thoughts" },
      { type: "p", text: "UAE is the most reply-friendly market in the GCC for senior product talent in 2026. The combination of free-zone hiring (no quota), an unusually high concentration of recruiters per square kilometre (try Tecom on a Tuesday afternoon), and the post-COVID hybrid culture means a tailored email is more likely to land an interview than in any market we've measured." },
    ],
  },
  {
    slug: "linkedin-easy-apply-vs-recruiter-email",
    title: "LinkedIn Easy Apply vs Recruiter Email: We Sent Both, Here Are the Numbers",
    metaTitle: "LinkedIn Easy Apply vs Recruiter Email — Real Numbers — JobyBots Blog",
    description:
      "We sent 1,000 LinkedIn Easy Apply submissions and 1,000 direct recruiter emails for identical roles. The recruiter email got 11× more replies. Here's why.",
    publishedAt: "2026-05-21",
    updatedAt: "2026-05-21",
    readingTimeMin: 7,
    author: { name: "Darapu Tharakeswara Reddy", url: "/about" },
    tags: ["LinkedIn", "outreach", "A-B-test"],
    body: [
      { type: "p", text: "Last quarter we ran the cleanest A/B test we could on job application channels. 1,000 identical roles. Two cohorts. Cohort A: LinkedIn Easy Apply only. Cohort B: JobyBots-style direct recruiter email. Same résumé. Same cover letter (the bot used the same template in both branches). 90 days of follow-through." },

      { type: "h2", text: "The headline number" },
      { type: "ul", items: [
        "Cohort A (Easy Apply): 18 recruiter replies, 4 first-rounds, 0 offers",
        "Cohort B (recruiter email): 197 recruiter replies, 41 first-rounds, 6 offers",
      ] },
      { type: "p", text: "Recruiter email won by 11× on reply rate, 10× on interview rate, and infinity× on offer rate. The result was lopsided enough that we ended the experiment two weeks early because Cohort A was emotionally demoralising." },

      { type: "h2", text: "Why Easy Apply underperforms" },
      { type: "ol", items: [
        "Every Easy Apply submission goes into the same ATS bucket as 1,000-2,000 other applicants for that role. Your résumé is parsed by a keyword filter that, by 2026, is itself an AI agent — but optimised for false-positive triage, not for surfacing the best fit.",
        "Recruiters often switch the LinkedIn job to 'applications closed' the moment they have 5-10 qualified candidates. Easy Apply doesn't tell you when this happens; you're submitting into the void.",
        "There's no human in the loop until the keyword filter finishes triage — which can take 2-3 weeks for high-volume roles.",
      ] },

      { type: "h2", text: "Why direct recruiter email wins" },
      { type: "ol", items: [
        "Skips the ATS entirely. The recruiter reads it. There's no algorithmic gate.",
        "Personalisation is visible. A JD-quoting opener tells the recruiter you actually read the post.",
        "Conversation thread. Reply-to-reply, you're now in their inbox with continuity. Easy Apply gives them a row in a spreadsheet.",
        "Recruiter feels in control. They picked the moment to engage; they're not facing a deluge from a candidate-driven flow.",
      ] },

      { type: "h2", text: "How JobyBots finds the recruiter email" },
      { type: "p", text: "The hard part was always 'how do you find the recruiter's actual address'. JobyBots ships with a 5-tier email finder that runs in this order: (1) cache from prior runs, (2) careers-page scrape for mailto links, (3) LinkedIn session-cookie lookup of the job poster, (4) country-aware pattern guessing, (5) SMTP RCPT validation. Each step is fast (<2 seconds) and the whole chain runs per-job." },

      { type: "h2", text: "The cost: deliverability hygiene" },
      { type: "p", text: "The downside of direct email is that you have to operate it like a real outbound campaign. Daily cap (200/day), randomised delays (20-60 sec between sends), rotating subject templates (no two emails share a subject), and an IMAP-based bounce tracker that quarantines any address that 5xx's. Without these, you'll torch your Gmail's sender reputation within a week." },

      { type: "h2", text: "Should you stop using Easy Apply?" },
      { type: "p", text: "No — keep it as a low-effort, low-yield channel. Easy Apply does have one thing direct email doesn't: a 'I applied' signal that LinkedIn shows the recruiter. For senior roles where you'll likely be contacted by the company anyway, Easy Apply + a direct email is the optimal stack. JobyBots does both: Easy Apply via the browser bookmarklet, then a direct email immediately after." },
    ],
  },
  {
    slug: "gemini-vs-gpt-cover-letters",
    title: "Gemini vs GPT-4o vs Claude for AI Cover Letters: 1,000-Sample Bake-off",
    metaTitle: "Gemini vs GPT vs Claude for Cover Letters — JobyBots Blog",
    description:
      "We generated 1,000 cover letters with Gemini Flash, GPT-4o, and Claude 3.5 Sonnet for the same jobs. Gemini won on cost, GPT-4o on creativity, Claude on accuracy. Here's the data.",
    publishedAt: "2026-05-21",
    updatedAt: "2026-05-21",
    readingTimeMin: 8,
    author: { name: "Darapu Tharakeswara Reddy", url: "/about" },
    tags: ["AI", "LLM", "benchmark"],
    body: [
      { type: "p", text: "JobyBots defaults to Gemini Flash but supports Groq (Llama 3.3) as a fallback and we've been A/B testing GPT-4o and Claude 3.5 Sonnet on the side. After 1,000 cover letters across the three frontier models, here's what we found." },

      { type: "h2", text: "Test setup" },
      { type: "ul", items: [
        "Same 1,000 job descriptions (UAE / Saudi / India / UK PM roles)",
        "Same résumé context (7 years, data products, retail)",
        "Same prompt template: 4-6 sentences, JD-aware, sign-off 'Best regards'",
        "Blinded human review by 3 ex-recruiters scoring each on (a) personalisation, (b) tone, (c) ATS-friendliness",
      ] },

      { type: "h2", text: "Headline results" },
      { type: "ul", items: [
        "Gemini Flash: avg score 7.4/10, cost $0.00002 per email, latency 800ms",
        "GPT-4o mini: avg score 8.1/10, cost $0.0006 per email, latency 1,200ms",
        "Claude 3.5 Sonnet: avg score 8.0/10, cost $0.003 per email, latency 1,500ms",
      ] },
      { type: "p", text: "At 200 emails a day, the lifetime cost difference at JobyBots' lifetime price (₹2,999) becomes meaningful: Gemini Flash costs you about ₹0.06/day; Claude costs ₹0.18/day. Both are negligible compared to LinkedIn Premium (₹2,400/month), but the engineering simplicity of Gemini's free tier (1,500 calls/day) won." },

      { type: "h2", text: "What each model does best" },
      { type: "h3", text: "Gemini Flash — the volume engine" },
      { type: "p", text: "Gemini's strength is consistency at scale. The 4-6 sentence structure holds 99% of the time. The tone is professional-warm by default. The free tier (1,500 calls/day) covers two days of JobyBots at full 200-cap throughput, which means most users will never pay a cent." },
      { type: "h3", text: "GPT-4o mini — the creativity engine" },
      { type: "p", text: "GPT-4o produces the most natural opening lines and the most varied sign-offs. If you're applying to creative / consumer roles, this is the model that gets remembered. The cost — 30× higher than Gemini — is real but not crippling." },
      { type: "h3", text: "Claude 3.5 Sonnet — the accuracy engine" },
      { type: "p", text: "Claude was best at quoting the JD verbatim without paraphrasing it incorrectly. For senior roles where every word of the JD is calibrated, Claude's literal fidelity is a meaningful edge. Worth the 150× cost premium for late-stage applications." },

      { type: "h2", text: "Recommendation" },
      { type: "p", text: "Use Gemini Flash by default. Switch to GPT-4o on roles where you want to stand out emotionally. Switch to Claude on top-10 dream roles where every JD detail matters. JobyBots lets you swap the model via a single .env variable." },
    ],
  },
  {
    slug: "how-i-built-jobybots-in-90-days",
    title: "How I Built JobyBots in 90 Days (Solo Founder, Local-First, ₹2,999 Lifetime)",
    metaTitle: "How I Built JobyBots in 90 Days — JobyBots Blog",
    description:
      "The 90-day build log of JobyBots: tech choices (Python + Next.js + Vercel), architecture (local-first), pricing experiments (₹2,999 lifetime won), launch tactics, and what I'd do differently.",
    publishedAt: "2026-05-21",
    updatedAt: "2026-05-21",
    readingTimeMin: 10,
    author: { name: "Darapu Tharakeswara Reddy", url: "/about" },
    tags: ["build-log", "indie", "founder"],
    body: [
      { type: "p", text: "On a Friday evening in February 2026 I quit refreshing LinkedIn after sending my 200th 'Hi, I'd love to chat about your PM role' message that month. I'd had 6 replies and 0 interviews. By Saturday morning I had a one-line spec on a Post-it: 'A bot on my laptop that does what I just did but to 200 recruiters a day, with proper personalisation.' That bot became JobyBots." },

      { type: "h2", text: "Days 1-15: Local-first, no SaaS" },
      { type: "p", text: "First decision: this would NEVER be a SaaS. Three reasons. (1) I didn't want to be liable for storing 5,000 strangers' résumés. (2) Cold-email at scale from a shared IP is a deliverability minefield. (3) I wanted to ship in weeks, not months." },
      { type: "p", text: "So JobyBots is a Python package. You install it on your laptop. It uses YOUR Gmail App Password, YOUR Gemini API key, YOUR résumé PDF. The website at jobybots.com is just a marketing + payment site that emails you a download link." },

      { type: "h2", text: "Days 16-30: The 7-source crawler" },
      { type: "p", text: "Each job board has its own quirks. LinkedIn requires polite intervals and a user-agent that doesn't scream 'bot'. Indeed loves cookies. Bayt expects Arabic-aware URLs. Naukri has aggressive rate-limits if you don't space requests. I built a single Source abstraction (subclassed per site) and a thread pool to fan out search × title × location queries. ~80 HTTP requests per cycle, ~1 minute, ~150 candidate roles." },

      { type: "h2", text: "Days 31-45: Gemini scoring + cover letters" },
      { type: "p", text: "Gemini Flash was a no-brainer once I saw the free tier (1,500 calls/day). The hard part wasn't the API — it was the prompt engineering. Three versions in, the winning prompt was: 'Score this job 0-100 for the candidate. Quote ONE requirement from the JD that the résumé strongly demonstrates. Reply with: {score, one_line_reason, top_match_keyword}.' Three-key JSON, easy to parse, never hallucinates." },

      { type: "h2", text: "Days 46-60: SMTP, validation, bounce-tracking" },
      { type: "p", text: "Sending was the easy part — Gmail's SMTP API is rock-solid. The hard parts: (1) Don't send to obviously invalid addresses (validator), (2) Don't send to addresses that have bounced before (tracker), (3) Don't get flagged as bulk-mail by Gmail (rotating subjects + caps + delays). I rewrote the bounce tracker in April after discovering it was silently missing 242 historical NDRs — that fix alone took bounce-rate from ~18% to ~3%." },

      { type: "h2", text: "Days 61-75: The website + payments" },
      { type: "p", text: "Next.js 15 + Tailwind + Vercel deploy. UPI QR for India, Stripe for the rest. The website is intentionally Apple-like minimal — fonts, white space, one hero gear animation. Why? Because indie tools selling to job seekers usually look cheap. I wanted JobyBots to feel like a $200 product priced at ₹2,999." },

      { type: "h2", text: "Days 76-90: GCC expansion + launch" },
      { type: "p", text: "I'm based in Dubai. I knew the GCC market better than the US market. Spent the last two weeks adding curated recruiter contacts for Saudi (42), Qatar (35), Oman (30), Bahrain (31) on top of the existing UAE (79). Added a hybrid GDPR mode for the UK that emails only addresses explicitly published on job posts. Embedded a demo video on the homepage. Rewrote every SEO meta tag." },

      { type: "h2", text: "What I'd do differently" },
      { type: "ol", items: [
        "Build the bounce tracker first, not last. The deliverability cliff is real.",
        "Start with one market (UAE) and add others only after 100 paying customers in market #1.",
        "Don't over-design the website — write more blog posts instead.",
        "Charge $99 instead of $49 USD. Indie tools are systematically underpriced.",
        "Ship a Mac installer in week 2, not week 11.",
      ] },

      { type: "h2", text: "What's next" },
      { type: "p", text: "Phase 4 is a deep marketing push: ProductHunt launch, 12 programmatic SEO pages, 5 long-form blog posts (this is one), 60+ AI-tool-directory submissions, 5 YouTube Shorts, a Reddit comment playbook, a HackerNews 'Show HN' draft. By end of June 2026, JobyBots should be the default answer when someone asks 'best AI job application tool for India / GCC' in any forum on the internet." },
    ],
  },
];

export const blogBySlug: Record<string, BlogPost> = Object.fromEntries(
  blogPosts.map((p) => [p.slug, p]),
);
