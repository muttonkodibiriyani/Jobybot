import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { MotionFade, MotionMagnet, MotionParallax } from "@/components/MotionFade";
import { FounderHero } from "@/components/FounderHero";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://jobybots.com";

export const metadata: Metadata = {
  title: "About JobyBots · Founder story by Darapu Tharakeswara Reddy",
  description:
    "I'm a working product manager in Dubai. Over the last year, between sprints and stand-ups, I quietly tested the waters. 200 cold emails. 6 replies. So I built the AI agent I wished existed. This is the honest story, the principles, and a love-letter to anyone job-hunting in 2026.",
  alternates: { canonical: `${SITE_URL}/about` },
  openGraph: {
    title: "Why JobyBots exists — a founder letter",
    description:
      "An honest story from a working product manager in Dubai about job-search burnout, the moment a tool was born, and the principles that keep it human.",
    url: `${SITE_URL}/about`,
    type: "profile",
    images: [
      {
        url: `${SITE_URL}/founder-tharakesh.jpg`,
        width: 768,
        height: 1024,
        alt: "Darapu Tharakeswara Reddy — founder of JobyBots",
      },
    ],
  },
};

const founderLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Darapu Tharakeswara Reddy",
  jobTitle: "Founder · JobyBots",
  url: SITE_URL,
  image: `${SITE_URL}/founder-tharakesh.jpg`,
  worksFor: { "@type": "Organization", name: "JobyBots" },
  alumniOf: { "@type": "CollegeOrUniversity", name: "IIT Patna" },
  knowsAbout: [
    "Product management",
    "Data products",
    "AI agents",
    "MENA retail",
    "Azure data engineering",
  ],
  sameAs: ["https://linkedin.com/in/darapu-tharakeswara-reddy-b9347748"],
};

const milestones = [
  {
    date: "Feb 2026",
    title: "The night I gave up doing it manually",
    body: "Two hundred cold emails over two months, sent on weekends and stolen hours between sprints. Six replies. Zero interviews. It was 2:14 AM on a Wednesday in Dubai and I closed the laptop knowing the problem wasn't my résumé, my targets, or my cover letters. The whole manual loop was the problem.",
  },
  {
    date: "Mar 2026",
    title: "The first 47 lines of code",
    body: "I opened a terminal after my day job, wrote a tiny Python script that scraped LinkedIn, scored each match against my résumé with Gemini, and emailed the recruiter who posted it. By Saturday it had quietly sent 38 personalised applications while I slept. I got 4 replies the next morning.",
  },
  {
    date: "Apr 2026",
    title: "The day I shipped it for strangers",
    body: "A friend asked, 'can I have it too?'. Then his friend asked. Then a stranger on LinkedIn DM'd me. Late nights for two weekends and I rewrote it as a local-first app — Gmail SMTP, address validation, bounce tracking. People started paying ₹2,999 for it without me running a single ad.",
  },
  {
    date: "May 2026",
    title: "GCC expansion + zero-bounce overhaul",
    body: "Rewrote the bounce tracker to catch modern Gmail NDRs. Added career-page scraping. Wired in SMTP RCPT probes so we never knowingly send to a dead address. Quarantined 246 historical bad addresses. Built market packs for Saudi, Qatar, Oman, Bahrain, UK. The tool I needed in February is now the tool anyone in MENA, India and the UK can use.",
  },
];

const principles = [
  {
    icon: "□",
    title: "Local-first, no SaaS",
    body: "Your résumé, your Gmail App Password, your Gemini key — they live in a folder on your machine. I don't run a server that knows you. I can't leak data I don't have.",
  },
  {
    icon: "○",
    title: "Honest deliverability",
    body: "Daily caps, rotating subjects, SMTP RCPT validation, IMAP bounce tracking. I refuse to torch a customer's Gmail reputation for an extra 5% reply rate.",
  },
  {
    icon: "△",
    title: "Pay once, own forever",
    body: "₹2,999 lifetime. No upsells, no usage limits, no recurring charges. If I add a feature, you get it for free. Forever.",
  },
  {
    icon: "✦",
    title: "Real humans",
    body: "Email or WhatsApp me directly, Mon-Sat 10:00-20:00 IST. No bots, no tickets, no AI chat. The founder reads every message.",
  },
];

const dedications = [
  "Anyone who has refreshed LinkedIn for the seventeenth time today.",
  "Anyone whose cousin's cousin keeps asking if you have a job yet.",
  "Anyone who has rewritten the same cover letter so many times it stopped meaning anything.",
  "Anyone laid off in a single Zoom call last quarter.",
  "Anyone switching countries with a visa countdown in the corner of their screen.",
  "Anyone working a full-time job and quietly looking for the next one in the margins of the day.",
];

export default function AboutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(founderLd) }}
      />

      {/* HERO — Material-3 Expressive 3D tilt card + typewriter + spotlight */}
      <FounderHero />

      {/* THE PROMISE: 6 dedications */}
      <section id="dedications" className="bg-ink text-white scroll-mt-24">
        <div className="mx-auto max-w-page section-pad px-4 sm:px-6 lg:px-8">
          <Reveal>
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">
              This is dedicated to
            </p>
          </Reveal>
          <Reveal delay={1}>
            <h2 className="display-2 mt-4 max-w-4xl text-white">
              Anyone trying. Anyone tired. Anyone starting over.
            </h2>
          </Reveal>
          <ul className="mt-12 grid gap-4 sm:grid-cols-2">
            {dedications.map((d, i) => (
              <Reveal
                key={d}
                as="li"
                delay={Math.min(6, (i + 1)) as 1 | 2 | 3 | 4 | 5 | 6}
                className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur"
              >
                <span aria-hidden className="mt-1 text-accent">→</span>
                <span className="text-[15px] leading-relaxed text-white">{d}</span>
              </Reveal>
            ))}
          </ul>
          <Reveal delay={4}>
            <p className="mt-12 max-w-3xl text-[17px] leading-relaxed text-white/85">
              I have been some version of every one of those people in the last
              12 months. I'm still in a full-time role. The search you read
              about above happened in evenings, on weekends, on flights, in the
              quiet half-hour before stand-up. JobyBots is the agent I built so
              I could keep my day-job energy for the day-job, and let a machine
              do the parts of the search that machines should have done all
              along — the searching, the tailoring, the validating, the
              sending — so the candidate can spend their human hours preparing
              for actual conversations.
            </p>
          </Reveal>
        </div>
      </section>

      {/* PRINCIPLES with animated icons */}
      <section className="bg-surface-subtle">
        <div className="mx-auto max-w-page section-pad px-4 sm:px-6 lg:px-8">
          <Reveal>
            <h2 className="display-2 text-ink">Four principles I refuse to break</h2>
          </Reveal>
          <div className="mt-14 grid gap-6 md:grid-cols-2">
            {principles.map((p, i) => (
              <Reveal
                key={p.title}
                delay={Math.min(4, i + 1) as 1 | 2 | 3 | 4}
                as="article"
                className="card flex flex-col gap-4"
              >
                <span
                  aria-hidden
                  className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 font-display text-2xl text-accent"
                >
                  {p.icon}
                </span>
                <h3 className="font-display text-xl font-semibold text-ink">
                  {p.title}
                </h3>
                <p className="text-[15px] leading-relaxed text-slate-700">
                  {p.body}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* BUILD LOG with animated timeline */}
      <section className="mx-auto max-w-page section-pad px-4 sm:px-6 lg:px-8">
        <Reveal>
          <h2 className="display-2 text-ink">How it actually got built</h2>
        </Reveal>
        <Reveal delay={1}>
          <p className="lead mt-5 max-w-2xl">
            No 18-month-stealth-mode story. Four months from "this should
            exist" to a tool 47 strangers paid for.
          </p>
        </Reveal>

        <ol className="mt-14 relative space-y-12 pl-8 sm:pl-12 before:absolute before:left-2 sm:before:left-3 before:top-2 before:bottom-2 before:w-px before:bg-gradient-to-b before:from-accent before:via-accent/40 before:to-transparent">
          {milestones.map((m, i) => (
            <Reveal
              key={m.date}
              as="li"
              delay={Math.min(4, i + 1) as 1 | 2 | 3 | 4}
              className="relative"
            >
              <span
                aria-hidden
                className="absolute -left-[36px] sm:-left-[42px] top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white shadow-lift"
              >
                {i + 1}
              </span>
              <p className="font-mono text-[12px] font-semibold uppercase tracking-[0.22em] text-accent">
                {m.date}
              </p>
              <h3 className="mt-2 font-display text-2xl font-semibold text-ink">
                {m.title}
              </h3>
              <p className="mt-3 max-w-2xl text-[16px] leading-relaxed text-slate-700">
                {m.body}
              </p>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* PROMISE CARD */}
      <section className="mx-auto max-w-page px-4 sm:px-6 lg:px-8 pb-24 lg:pb-32">
        <Reveal>
          <div className="rounded-3xl bg-gradient-to-br from-accent to-accent/70 p-10 sm:p-14 text-white shadow-lift">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-white/80">
              The promise
            </p>
            <h2 className="mt-4 display-2 text-white max-w-3xl">
              If JobyBots doesn't help you land conversations, I refund you.
              If it does, tell one other person who is tired today.
            </h2>
            <p className="mt-6 max-w-2xl text-[17px] leading-relaxed text-white/90">
              7-day refund, no questions asked. WhatsApp the founder.
              ₹2,999 is the price of two dinners in Dubai. Your time hunting
              is worth more.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <MotionMagnet>
                <Link
                  href="/buy-india"
                  aria-label="Buy JobyBots Pro lifetime license for 2,999 rupees"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 text-[15px] font-semibold text-ink shadow-card transition-all hover:shadow-lift"
                >
                  Get JobyBots Pro — ₹2,999 lifetime →
                </Link>
              </MotionMagnet>
              <MotionMagnet>
                <Link
                  href="/demo"
                  aria-label="Watch a 2 minute video demo of JobyBots"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/40 px-7 py-3.5 text-[15px] font-semibold text-white transition-all hover:bg-white/10"
                >
                  Watch the 2-minute demo
                </Link>
              </MotionMagnet>
            </div>
          </div>
        </Reveal>
      </section>

      {/* CONTACT */}
      <section className="bg-surface-subtle">
        <div className="mx-auto max-w-page section-pad px-4 sm:px-6 lg:px-8">
          <Reveal>
            <h2 className="display-2 text-ink">Reach the founder directly</h2>
          </Reveal>
          <Reveal delay={1}>
            <p className="lead mt-5 max-w-2xl text-slate-700">
              Press inquiries, partnership ideas, brutal product feedback,
              or a sanity-check before you buy — I read every email.
            </p>
          </Reveal>
          <Reveal delay={2}>
            <div className="mt-10 flex flex-wrap gap-3">
              <a
                href="mailto:tharakesh.iitp@gmail.com"
                aria-label="Email the founder Darapu Tharakeswara Reddy"
                className="btn-accent"
              >
                Email the founder
              </a>
              <a
                href="https://linkedin.com/in/darapu-tharakeswara-reddy-b9347748"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Connect with the founder on LinkedIn"
                className="btn-outline"
              >
                Connect on LinkedIn
              </a>
              <Link
                href="/faq"
                aria-label="Read the JobyBots frequently asked questions"
                className="btn-ghost"
              >
                Read the full FAQ
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
