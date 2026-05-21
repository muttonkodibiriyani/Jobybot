/**
 * Programmatic SEO landing pages.
 *
 * Each entry below renders as `/<slug>` via `app/(seo)/[slug]/page.tsx`.
 * The dataset is intentionally hand-curated so every page tells a slightly
 * different story; this is what lets search engines treat them as
 * standalone answers instead of duplicate content.
 */

export type ComparisonRow = {
  feature: string;
  competitor: string;
  jobybots: string;
};

export type FaqItem = {
  q: string;
  a: string;
};

export type SeoPage = {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  heroBlurb: string;
  keyAnswer: string;
  competitorName: string;
  competitorPrice: string;
  jobybotsPrice: string;
  intent:
    | "alternative"
    | "use-case"
    | "platform"
    | "geography";
  bullets: string[];
  comparison: ComparisonRow[];
  faq: FaqItem[];
  cta: string;
};

const SHARED_FAQ: FaqItem[] = [
  {
    q: "Is JobyBots safe to use on LinkedIn?",
    a: "Yes. JobyBots does not log into your LinkedIn account or click any apply buttons on your behalf. It scrapes public job listings, scores them with Gemini, and writes you a personalised cover letter you can send manually or via the included Gmail integration. There's no automation against LinkedIn's UI that would violate their ToS.",
  },
  {
    q: "Do you upload my résumé to a server?",
    a: "No. JobyBots is a local-first Python app. Your résumé, Gmail App Password, and Gemini API key live in a folder on your own machine. The website only handles purchase + license verification.",
  },
  {
    q: "What happens if it sends to a bad email address?",
    a: "JobyBots includes a bounce tracker that reads delivery-failure notifications from your Gmail inbox via IMAP. Every bad address is quarantined and never retried — and your live dashboard shows the running count.",
  },
  {
    q: "Can I cancel anytime?",
    a: "JobyBots is a one-time purchase — there's nothing to cancel. We offer a 7-day, no-questions-asked refund if it isn't right for you.",
  },
];

export const seoPages: SeoPage[] = [
  {
    slug: "lazyapply-alternative",
    title: "LazyApply alternative",
    metaTitle: "The Best LazyApply Alternative in 2026 — JobyBots",
    metaDescription:
      "Looking for a LazyApply alternative? JobyBots is a one-time-purchase AI agent that scans LinkedIn, Indeed, Naukri & Bayt, scores every match with Gemini, and emails recruiters from your laptop. ₹2,999 lifetime vs LazyApply's $129/year.",
    h1: "JobyBots is the LazyApply alternative built for India + the Gulf.",
    heroBlurb:
      "LazyApply still pings every job indiscriminately and bills you forever. JobyBots reads your résumé with Gemini, scores 0–100 with an explanation, validates every recruiter address with SMTP, and respects daily caps so Gmail doesn't ban you. One-time payment. Your data never leaves your machine.",
    keyAnswer:
      "JobyBots is the most popular LazyApply alternative for 2026 because it (1) costs ₹2,999 once instead of $129 every year, (2) writes a personalised cover letter for every match above 70% using Gemini AI, and (3) runs entirely on your laptop with no résumé uploads.",
    competitorName: "LazyApply",
    competitorPrice: "$129/year",
    jobybotsPrice: "₹2,999 one-time",
    intent: "alternative",
    bullets: [
      "Personalised cover letter per role (LazyApply uses one generic template).",
      "Daily email cap + bounce tracker keeps Gmail happy.",
      "GDPR-safe market routing — UK / Germany / Ireland are auto-treated as 'apply via official site only'.",
      "Local-first: no résumé uploads to a SaaS dashboard.",
      "Built for India + GCC + UK candidates with English/Hindi/Telugu support.",
    ],
    comparison: [
      { feature: "Pricing model",        competitor: "$129 every year",     jobybots: "₹2,999 once, lifetime" },
      { feature: "Résumé scoring",       competitor: "Keyword match",       jobybots: "Gemini AI 0-100 score" },
      { feature: "Cover letter",         competitor: "1 generic template",  jobybots: "Tailored per JD" },
      { feature: "Recruiter email send", competitor: "Not included",        jobybots: "Built-in (SMTP)" },
      { feature: "Bounce tracking",      competitor: "No",                  jobybots: "Yes (IMAP)" },
      { feature: "GDPR aware",           competitor: "No",                  jobybots: "Yes" },
      { feature: "Runs locally",         competitor: "No — cloud",          jobybots: "Yes — your laptop" },
      { feature: "Markets covered",      competitor: "USA-first",           jobybots: "UAE, Saudi, Qatar, Oman, Bahrain, UK, India, Singapore, Canada, Australia +3" },
    ],
    faq: SHARED_FAQ,
    cta: "Switch from LazyApply",
  },
  {
    slug: "sonara-alternative",
    title: "Sonara alternative",
    metaTitle: "Sonara Alternative for 2026 — JobyBots",
    metaDescription:
      "Need a Sonara replacement that's local-first and cheaper? JobyBots tailors every cover letter with Gemini, sends from your Gmail, and never uploads your résumé. ₹2,999 lifetime.",
    h1: "JobyBots — the Sonara alternative for people who want their data on their own machine.",
    heroBlurb:
      "Sonara is great if you love SaaS subscriptions. JobyBots is great if you'd rather pay once, run the bot on your own laptop, and watch every step of what it sends — with full audit logs of every recruiter email.",
    keyAnswer:
      "JobyBots replaces Sonara at 1/15th of the recurring cost while being more transparent: every search, score, and email is logged to a local SQLite database you control.",
    competitorName: "Sonara",
    competitorPrice: "$50/month",
    jobybotsPrice: "₹2,999 one-time",
    intent: "alternative",
    bullets: [
      "Pay once, use for life.",
      "Local SQLite DB — every email, score, bounce is yours.",
      "Bring-your-own Gemini key, free tier covers ~1500 emails/day.",
      "Audit log of every recruiter address attempted.",
    ],
    comparison: [
      { feature: "Pricing",              competitor: "$50/month subscription", jobybots: "₹2,999 once" },
      { feature: "Where does it run?",   competitor: "Their cloud",            jobybots: "Your laptop" },
      { feature: "Data ownership",       competitor: "Stored on Sonara servers", jobybots: "You own the SQLite file" },
      { feature: "AI scoring",           competitor: "Internal model",         jobybots: "Gemini 1.5 Flash" },
      { feature: "Cover letter",         competitor: "Auto-fill apply forms",  jobybots: "Custom email + apply form" },
      { feature: "Bounce tracker",       competitor: "Not exposed",            jobybots: "Live dashboard tile" },
    ],
    faq: SHARED_FAQ,
    cta: "Replace Sonara",
  },
  {
    slug: "aiapply-alternative",
    title: "AIApply alternative",
    metaTitle: "AIApply Alternative — JobyBots (₹2,999 lifetime)",
    metaDescription:
      "Tired of AIApply's subscription? JobyBots is a one-time-purchase AI agent with Gemini scoring, SMTP-validated emails, and GDPR-safe market routing. India + GCC focused.",
    h1: "AIApply has subscriptions. JobyBots has a one-time payment.",
    heroBlurb:
      "AIApply targets a US Easy-Apply audience. JobyBots is purpose-built for the India + Gulf + UK + Europe corridor — with GDPR-aware market gating, Arabic-friendly company directories, and full visibility into every recruiter email you send.",
    keyAnswer:
      "JobyBots beats AIApply by (1) being a one-time purchase, (2) using Gemini AI instead of a fixed model, and (3) carrying curated recruiter contacts for UAE, Saudi Arabia, Qatar, Oman, Bahrain, India, Singapore and the UK.",
    competitorName: "AIApply",
    competitorPrice: "$29/month",
    jobybotsPrice: "₹2,999 one-time",
    intent: "alternative",
    bullets: [
      "GDPR mode: never cold-emails recruiters in EU markets.",
      "Curated contacts for 13 markets including the entire GCC.",
      "Email finder v2 with 5-tier waterfall (cache → careers page → LinkedIn → patterns → SMTP probe).",
      "Live dashboard auto-refreshes every 15 seconds.",
    ],
    comparison: [
      { feature: "Pricing",            competitor: "$29/month",        jobybots: "₹2,999 once" },
      { feature: "GCC market support", competitor: "No",               jobybots: "UAE/Saudi/Qatar/Oman/Bahrain primary" },
      { feature: "Cover letter AI",    competitor: "GPT-3.5",          jobybots: "Gemini Flash + Groq fallback" },
      { feature: "Email finder",       competitor: "Public databases", jobybots: "Careers-page scrape + LinkedIn poster + SMTP probe" },
    ],
    faq: SHARED_FAQ,
    cta: "Try the AIApply alternative",
  },
  {
    slug: "massive-ai-alternative",
    title: "Massive.ai alternative",
    metaTitle: "Massive.ai Alternative — JobyBots",
    metaDescription:
      "JobyBots is the indie alternative to Massive.ai for autonomous job application — runs on your laptop with Gemini, ₹2,999 lifetime, supports UAE + Saudi + UK + India.",
    h1: "Massive.ai is great. JobyBots is great AND yours.",
    heroBlurb:
      "Massive.ai is a beautiful SaaS bot but every résumé, every cover letter and every reply lives on their cloud. JobyBots gives you the same agent loop entirely on your laptop — with a SQLite database you can open in DB Browser any time.",
    keyAnswer:
      "JobyBots reproduces Massive.ai's autonomous apply loop locally, paired with the GCC and India market packs that Massive doesn't ship out of the box.",
    competitorName: "Massive.ai",
    competitorPrice: "$45/month",
    jobybotsPrice: "₹2,999 one-time",
    intent: "alternative",
    bullets: [
      "Same agent loop — local execution.",
      "GCC + India built-in.",
      "Gemini cover letters that quote the JD.",
      "Founder available via WhatsApp.",
    ],
    comparison: [
      { feature: "Execution",         competitor: "Their cloud",     jobybots: "Your laptop" },
      { feature: "Cost",              competitor: "$45/mo",          jobybots: "₹2,999 once" },
      { feature: "Markets",           competitor: "USA/EU",          jobybots: "UAE/Saudi/Qatar/Oman/Bahrain/UK/India/SG/CA/AU" },
      { feature: "Founder access",    competitor: "Email tickets",   jobybots: "WhatsApp the founder directly" },
    ],
    faq: SHARED_FAQ,
    cta: "See JobyBots vs Massive.ai",
  },
  {
    slug: "simplify-jobs-alternative",
    title: "Simplify Jobs alternative",
    metaTitle: "Simplify Jobs Alternative for Recruiter Outreach — JobyBots",
    metaDescription:
      "Simplify Jobs fills forms, JobyBots emails recruiters directly. Run on your laptop, send from your Gmail, track bounces — ₹2,999 lifetime.",
    h1: "Simplify Jobs autofills forms. JobyBots reaches recruiters.",
    heroBlurb:
      "Simplify is wonderful for cutting clicks. JobyBots is wonderful for actually getting replies — because the moment a job is scored above 70 it drafts a tailored email and ships it from your Gmail.",
    keyAnswer:
      "JobyBots is the recruiter-outreach companion to Simplify Jobs. Many of our users keep both: Simplify for filling forms, JobyBots for following up with the recruiter who posted the role.",
    competitorName: "Simplify Jobs",
    competitorPrice: "Free + Pro tier",
    jobybotsPrice: "₹2,999 one-time",
    intent: "use-case",
    bullets: [
      "Recruiter discovery via Email Finder v2.",
      "Direct outreach, not just form-fill.",
      "Bounce dashboard.",
      "Daily cap to stay under Gmail's radar.",
    ],
    comparison: [
      { feature: "Primary value",      competitor: "Autofill forms",       jobybots: "Email recruiters directly" },
      { feature: "Email engine",       competitor: "None",                 jobybots: "Gmail SMTP, 200/day cap" },
      { feature: "Bounce handling",    competitor: "N/A",                  jobybots: "IMAP NDR scanner" },
    ],
    faq: SHARED_FAQ,
    cta: "Pair JobyBots with Simplify",
  },
  {
    slug: "linkedin-auto-apply-ai",
    title: "LinkedIn auto apply AI (safe edition)",
    metaTitle: "LinkedIn Auto Apply AI That Won't Get You Banned — JobyBots",
    metaDescription:
      "Most LinkedIn auto-apply tools risk a ban. JobyBots reads public listings, scores them with Gemini, and emails the recruiter who posted the role — your account never logs in to apply.",
    h1: "LinkedIn auto apply AI that doesn't touch your account.",
    heroBlurb:
      "Tools that click the LinkedIn apply button for you violate LinkedIn's ToS and trigger 'unusual activity' suspensions. JobyBots takes a different path: it reads the public listing, identifies the recruiter (Email Finder v2), and emails them directly from your Gmail.",
    keyAnswer:
      "JobyBots is a LinkedIn auto apply alternative that's ban-safe because it never logs into your LinkedIn account or clicks any UI element — it only reads public job listings and emails recruiters from your Gmail.",
    competitorName: "Generic auto-apply Chrome extensions",
    competitorPrice: "$25-50/mo",
    jobybotsPrice: "₹2,999 one-time",
    intent: "use-case",
    bullets: [
      "Never logs into LinkedIn.",
      "Reads public listings only.",
      "Emails recruiters via your Gmail.",
      "Includes a Chrome bookmarklet to autofill external apply pages.",
    ],
    comparison: [
      { feature: "Touches LinkedIn UI?",  competitor: "Yes (risky)",      jobybots: "No" },
      { feature: "Account safety",        competitor: "Bans reported",    jobybots: "ToS-aligned" },
      { feature: "Outreach channel",      competitor: "Easy Apply form",  jobybots: "Recruiter email" },
    ],
    faq: SHARED_FAQ,
    cta: "Try the safe LinkedIn auto-apply",
  },
  {
    slug: "workday-auto-apply",
    title: "Workday auto apply (the smart way)",
    metaTitle: "Workday Auto Apply — JobyBots",
    metaDescription:
      "Workday's apply flow is notoriously slow. JobyBots cuts the chase: it identifies the recruiter behind the Workday req and emails them directly — you skip the 20-minute form.",
    h1: "Skip the 20-minute Workday form. Email the recruiter directly.",
    heroBlurb:
      "Every Workday req lists a contact. JobyBots' Email Finder v2 extracts that contact from the company's own careers page, validates it via SMTP, and lets you reach out before 200 other applicants have hit Submit.",
    keyAnswer:
      "JobyBots locates the recruiter behind every Workday req and emails them directly — bypassing the 20-minute apply form entirely.",
    competitorName: "Manual Workday application",
    competitorPrice: "20+ minutes per role",
    jobybotsPrice: "30 seconds per role",
    intent: "use-case",
    bullets: [
      "Recruiter discovery from Workday req pages.",
      "Auto cover letter referencing the JD.",
      "Daily 9 AM digest with apply links.",
    ],
    comparison: [
      { feature: "Time per application",  competitor: "20 minutes",   jobybots: "30 seconds" },
      { feature: "Result rate",           competitor: "Lost in ATS",  jobybots: "Recruiter inbox" },
    ],
    faq: SHARED_FAQ,
    cta: "Cut your Workday time 40×",
  },
  {
    slug: "ai-cover-letter-generator",
    title: "AI cover letter generator (free with JobyBots)",
    metaTitle: "AI Cover Letter Generator (Free with JobyBots)",
    metaDescription:
      "Stop pasting your résumé into ChatGPT. JobyBots auto-generates a tailored, JD-specific cover letter for every job above 70% match — free with the ₹2,999 license.",
    h1: "AI cover letter for every role, generated and sent automatically.",
    heroBlurb:
      "Generic 'Sir/Madam, I am very interested...' letters belong in 2019. JobyBots produces a 4-6 sentence, JD-aware cover letter — quoting the requirement that fits your résumé — for every role above your match threshold.",
    keyAnswer:
      "JobyBots includes an AI cover letter generator powered by Gemini that produces a tailored 4-6 sentence email for every job above 70% match — and sends it automatically.",
    competitorName: "Generic ChatGPT prompts",
    competitorPrice: "Free but manual",
    jobybotsPrice: "₹2,999 one-time + automatic",
    intent: "use-case",
    bullets: [
      "Quotes one specific JD requirement.",
      "References a concrete outcome from your résumé.",
      "Opens with the recruiter's first name when known.",
      "Closes with a low-friction ask ('Open to a quick chat?').",
    ],
    comparison: [
      { feature: "Speed",          competitor: "5 min per role",   jobybots: "Instant + sent" },
      { feature: "Personalised",   competitor: "If you prompt well", jobybots: "Always" },
    ],
    faq: SHARED_FAQ,
    cta: "Generate cover letters in seconds",
  },
  {
    slug: "uae-job-search-automation",
    title: "UAE job search automation",
    metaTitle: "UAE Job Search Automation — JobyBots",
    metaDescription:
      "JobyBots is the UAE job search bot built by a Dubai-based product manager. Targets Bayt, Naukrigulf, GulfTalent, LinkedIn UAE every 30 min and emails recruiters.",
    h1: "The UAE job search bot built in Dubai, for Dubai.",
    heroBlurb:
      "We live here. Our primary market is UAE. Our curated contacts list has 79 verified recruiter mailboxes in the Emirates. Our sources include the GCC-native job boards (Bayt, Naukrigulf, GulfTalent) that overseas tools simply don't scan.",
    keyAnswer:
      "JobyBots is the most popular UAE job search automation because its primary market is UAE — covering Bayt, Naukrigulf, GulfTalent and LinkedIn UAE every 30 minutes with a 79-recruiter curated contact list.",
    competitorName: "Generic global job bots",
    competitorPrice: "Various",
    jobybotsPrice: "₹2,999 one-time",
    intent: "geography",
    bullets: [
      "Built and operated in Dubai.",
      "79 verified UAE recruiter contacts curated in the database.",
      "Bayt, Naukrigulf, GulfTalent + LinkedIn UAE coverage.",
      "Arabic-friendly company directory.",
    ],
    comparison: [
      { feature: "GCC sources",     competitor: "LinkedIn only",        jobybots: "Bayt, Naukrigulf, GulfTalent, LinkedIn" },
      { feature: "Recruiter list",  competitor: "Generic",              jobybots: "79 curated UAE contacts" },
    ],
    faq: SHARED_FAQ,
    cta: "Get JobyBots for UAE",
  },
  {
    slug: "saudi-arabia-job-bot",
    title: "Saudi Arabia job application bot",
    metaTitle: "Saudi Arabia Job Application Bot — JobyBots",
    metaDescription:
      "JobyBots targets NEOM, PIF portfolio companies, STC, SNB, Aramco recruiters every 30 minutes with personalised emails — perfect for Saudi Vision 2030 candidates.",
    h1: "Saudi Vision 2030 hiring? JobyBots is on it.",
    heroBlurb:
      "We curate recruiters for NEOM, Red Sea Global, Roshn, Qiddiya, Aramco, STC, Saudi National Bank and the giga-projects driving Saudi Vision 2030. The bot emails them with personalised cover letters quoting the JD.",
    keyAnswer:
      "JobyBots is a Saudi Arabia job application bot that targets 42 curated recruiter contacts across NEOM, PIF portfolio, banking and consulting — sending personalised emails every 30 minutes.",
    competitorName: "Generic global job bots",
    competitorPrice: "Various",
    jobybotsPrice: "₹2,999 one-time",
    intent: "geography",
    bullets: [
      "42 verified Saudi recruiter contacts at launch.",
      "Vision 2030 giga-project focus (NEOM, Red Sea, Roshn, Qiddiya).",
      "Iqama-friendly cover letter templates.",
    ],
    comparison: [
      { feature: "Saudi-specific recruiters", competitor: "0",         jobybots: "42 curated" },
      { feature: "NEOM coverage",             competitor: "No",        jobybots: "Yes" },
    ],
    faq: SHARED_FAQ,
    cta: "Get JobyBots for Saudi",
  },
  {
    slug: "qatar-job-application-ai",
    title: "Qatar job application AI",
    metaTitle: "Qatar Job Application AI — JobyBots",
    metaDescription:
      "Targeting Qatar's post-World-Cup digital transformation? JobyBots emails 35 curated Doha recruiters with Gemini cover letters every 30 min — ₹2,999 lifetime.",
    h1: "Qatar's digital transformation, on automation.",
    heroBlurb:
      "QatarEnergy, Ooredoo, QNB, Qatar Foundation and the Q-Digital / Tasmu portfolio are hiring across product, data and digital. JobyBots reaches them with personalised emails for less than a single LinkedIn Premium subscription.",
    keyAnswer:
      "JobyBots is a Qatar job application AI with 35 curated Doha recruiter contacts spanning QatarEnergy, Ooredoo, QNB and the digital transformation portfolio.",
    competitorName: "Generic global job bots",
    competitorPrice: "Various",
    jobybotsPrice: "₹2,999 one-time",
    intent: "geography",
    bullets: [
      "35 curated Qatar recruiter contacts.",
      "QatarEnergy + Ooredoo + QNB focus.",
      "Q-Digital / Tasmu digital-transformation coverage.",
    ],
    comparison: [
      { feature: "Qatar recruiter list",   competitor: "Sparse",   jobybots: "35 curated" },
    ],
    faq: SHARED_FAQ,
    cta: "Get JobyBots for Qatar",
  },
  {
    slug: "uk-job-search-bot",
    title: "UK job search bot (GDPR-safe)",
    metaTitle: "UK Job Search Bot — GDPR-Safe (JobyBots)",
    metaDescription:
      "Most cold-email bots violate UK PECR. JobyBots is UK GDPR-safe — it only emails recruiters who publish their address on the job post (legitimate interest).",
    h1: "A UK job search bot that respects PECR + UK GDPR.",
    heroBlurb:
      "We don't blast UK recruiters. JobyBots routes UK searches through a hybrid mode that only emails mailboxes the recruiter themselves published on the job posting — a defensible Article 6(1)(f) legitimate-interest basis. 17 curated, public-facing UK recruiter contacts at launch.",
    keyAnswer:
      "JobyBots is a UK GDPR-safe job search bot: it uses a 'legitimate-interest contacts' mode for the UK that only emails mailboxes the recruiter published on the job post.",
    competitorName: "Generic cold-email job bots",
    competitorPrice: "Various",
    jobybotsPrice: "₹2,999 one-time",
    intent: "geography",
    bullets: [
      "Article 6(1)(f) legitimate-interest mode for UK.",
      "17 curated, publicly-published UK recruiter mailboxes.",
      "Search runs in every UK city; outreach is gated.",
    ],
    comparison: [
      { feature: "GDPR safety",   competitor: "Often violates",   jobybots: "Legitimate-interest mode" },
      { feature: "UK contacts",   competitor: "Generic",          jobybots: "17 publicly-published" },
    ],
    faq: SHARED_FAQ,
    cta: "Get JobyBots for the UK",
  },
];

export const seoBySlug: Record<string, SeoPage> = Object.fromEntries(
  seoPages.map((p) => [p.slug, p]),
);
