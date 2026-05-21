import type { Metadata } from "next";
import Link from "next/link";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://jobybots.com";

export const metadata: Metadata = {
  title: "About · The story of JobyBots",
  description:
    "JobyBots is built by Darapu Tharakeswara Reddy, a Dubai-based product manager who was tired of the job search grind. Here's the story, the principles, and why it's local-first.",
  alternates: { canonical: `${SITE_URL}/about` },
};

const founderLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Darapu Tharakeswara Reddy",
  jobTitle: "Founder · JobyBots",
  url: SITE_URL,
  image: `${SITE_URL}/jobybots-logo.png`,
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
  { date: "Feb 2026", body: "Quit refreshing LinkedIn after 200 manual cold emails returned 6 replies. Spent the weekend writing the first lines of JobyBots in Python." },
  { date: "Mar 2026", body: "Shipped the 7-source job crawler (LinkedIn, Indeed, Naukrigulf, Bayt, GulfTalent, RemoteOK, company careers ATS). Plugged in Gemini Flash for résumé matching." },
  { date: "Apr 2026", body: "Discovered the bounce tracker was silently failing on modern Gmail NDRs. Rewrote it; quarantined 242 dead addresses; bounce rate dropped from 18% to 3%." },
  { date: "May 2026", body: "Expanded into Saudi Arabia, Qatar, Oman, Bahrain (full primary markets), plus a UK GDPR-safe hybrid mode. Embedded the demo video. Launched the SEO + content + ProductHunt push." },
];

const principles = [
  {
    title: "Local-first, no SaaS",
    body: "Your résumé, Gmail App Password, and Gemini key live in a folder on your machine. We don't run a server that knows you. We can't lose data we don't have.",
  },
  {
    title: "Honest deliverability",
    body: "Daily caps, rotating subjects, SMTP RCPT validation, IMAP bounce tracking. We refuse to torch a customer's Gmail reputation for an extra 5% reply rate.",
  },
  {
    title: "Pay once, own forever",
    body: "₹2,999 lifetime. No upsells, no usage limits, no recurring charges. If we add a feature, you get it for free.",
  },
  {
    title: "Real humans",
    body: "Email or WhatsApp the founder directly during Mon-Sat, 10:00-20:00 IST. No bots, no tickets, no AI chat.",
  },
];

export default function AboutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(founderLd) }}
      />

      <section className="mx-auto max-w-page section-pad px-4 sm:px-6 lg:px-8">
        <p className="eyebrow">About</p>
        <h1 className="display-1 mt-3 text-ink">
          Built in <span className="shimmer-text">Dubai</span>, on a laptop, because LinkedIn became unbearable.
        </h1>
        <p className="lead mt-6 max-w-3xl">
          I'm Darapu Tharakeswara Reddy. I spent seven years at Alshaya
          shipping data products and AI agents across MENA retail before
          quitting to find my next role. Like everyone else, I hit the
          modern job-search reality wall: 1,200 applicants per LinkedIn
          post, 3% chance of a human reading my résumé.
        </p>
        <p className="lead mt-5 max-w-3xl">
          JobyBots is the tool I wished existed during that grind: an
          AI agent on my own machine that reads my résumé, scans LinkedIn
          and 7 other sites every 30 minutes, scores every match with
          Gemini, validates recruiter emails, and sends personalised
          outreach — all without uploading a single byte of my data to
          someone else's cloud.
        </p>
      </section>

      <section className="border-y border-surface-divider bg-surface-subtle">
        <div className="mx-auto max-w-page section-pad px-4 sm:px-6 lg:px-8">
          <h2 className="display-2 text-ink">Principles</h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {principles.map((p) => (
              <article key={p.title} className="card">
                <h3 className="font-display text-xl font-semibold text-ink">{p.title}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">{p.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-page section-pad px-4 sm:px-6 lg:px-8">
        <h2 className="display-2 text-ink">Build log</h2>
        <ol className="mt-12 space-y-6 border-l-2 border-accent/30 pl-6">
          {milestones.map((m) => (
            <li key={m.date} className="relative">
              <span aria-hidden className="absolute -left-[31px] top-1.5 h-3 w-3 rounded-full bg-accent" />
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-muted">
                {m.date}
              </p>
              <p className="mt-2 text-[16px] leading-relaxed text-ink">{m.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-page section-pad px-4 sm:px-6 lg:px-8">
        <h2 className="display-2 text-ink">Get in touch</h2>
        <p className="lead mt-4 max-w-2xl">
          Press inquiries, partnership ideas, or just a sanity-check on
          the product — drop a line.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href="mailto:tharakesh.iitp@gmail.com" className="btn-accent">
            tharakesh.iitp@gmail.com
          </a>
          <a
            href="https://linkedin.com/in/darapu-tharakeswara-reddy-b9347748"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline"
          >
            LinkedIn
          </a>
          <Link href="/faq" className="btn-ghost">Read the FAQ</Link>
        </div>
      </section>
    </>
  );
}
