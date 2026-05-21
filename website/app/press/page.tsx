import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://jobybots.com";

export const metadata: Metadata = {
  title: "Press kit · JobyBots",
  description:
    "Press kit for JobyBots: founder bio, logos, screenshots, fact sheet, and contact details for journalists, podcasters and partners.",
  alternates: { canonical: `${SITE_URL}/press` },
};

const facts = [
  { label: "Founder", value: "Darapu Tharakeswara Reddy (IIT Patna, ex-Alshaya)" },
  { label: "Founded", value: "February 2026" },
  { label: "Headquarters", value: "Dubai, UAE" },
  { label: "Product", value: "Local-first AI job-hunting agent (Python + Next.js)" },
  { label: "Pricing", value: "₹2,999 (≈$49) lifetime · 7-day refund" },
  { label: "Markets", value: "UAE, Saudi, Qatar, Oman, Bahrain, India, Singapore, UK, Canada, Australia, Germany, Netherlands, Ireland" },
  { label: "Daily cap", value: "200 personalised applications per user per day" },
  { label: "Models", value: "Google Gemini Flash (default), Groq Llama 3.3 (fallback)" },
  { label: "Data policy", value: "Resumes, Gmail credentials and API keys never leave the user's laptop" },
];

const screenshots = [
  { caption: "JobyBots dashboard (auto-refreshes every 15s)", file: "dashboard.png" },
  { caption: "AI search demo on the homepage", file: "demo.png" },
  { caption: "Recruiter discovery audit log", file: "discovery.png" },
];

export default function PressPage() {
  return (
    <section className="mx-auto max-w-page section-pad px-4 sm:px-6 lg:px-8">
      <p className="eyebrow">Press kit</p>
      <h1 className="display-1 mt-3 text-ink">
        Everything a <span className="shimmer-text">journalist</span> needs in one page.
      </h1>
      <p className="lead mt-6 max-w-2xl">
        Hi, I'm Darapu. If you're writing about AI-driven job search, indie
        software, or the post-COVID white-collar hiring market, you can use
        anything on this page without asking — quote freely.
      </p>

      <h2 className="display-2 mt-16 text-ink">Fact sheet</h2>
      <dl className="mt-8 overflow-hidden rounded-3xl border border-surface-divider bg-white shadow-card">
        {facts.map((f, i) => (
          <div
            key={f.label}
            className={`flex flex-col gap-1 px-6 py-4 sm:flex-row sm:gap-8 ${
              i % 2 === 0 ? "bg-white" : "bg-surface-subtle"
            }`}
          >
            <dt className="w-full font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-muted sm:w-48">
              {f.label}
            </dt>
            <dd className="flex-1 text-[15px] text-ink">{f.value}</dd>
          </div>
        ))}
      </dl>

      <h2 className="display-2 mt-16 text-ink">Boilerplate</h2>
      <div className="mt-8 rounded-3xl border border-surface-divider bg-white p-6 shadow-card">
        <p className="text-[15px] leading-relaxed text-ink">
          JobyBots is a local-first AI agent that runs on a user's laptop,
          scans 8 job sites every 30 minutes, scores each match with Gemini
          AI, validates the recruiter's email, and sends a personalised
          cover letter — automating the modern job-application grind while
          keeping the user's résumé, Gmail credentials and API keys
          entirely on-device. Built in Dubai by Darapu Tharakeswara Reddy
          and priced at ₹2,999 lifetime (no subscription).
        </p>
      </div>

      <h2 className="display-2 mt-16 text-ink">Screenshots</h2>
      <p className="lead mt-4 max-w-2xl">
        Hi-res PNGs available on request — email
        <a href="mailto:tharakesh.iitp@gmail.com" className="ml-1 text-accent">
          tharakesh.iitp@gmail.com
        </a>.
      </p>
      <ul className="mt-8 grid gap-4 sm:grid-cols-3">
        {screenshots.map((s) => (
          <li
            key={s.file}
            className="rounded-3xl border border-surface-divider bg-surface-subtle p-6 text-center"
          >
            <div className="aspect-video w-full rounded-xl bg-ink/90 text-white/40 grid place-items-center">
              <span className="font-mono text-xs">screenshot</span>
            </div>
            <p className="mt-3 text-[13px] text-ink-muted">{s.caption}</p>
          </li>
        ))}
      </ul>

      <h2 className="display-2 mt-16 text-ink">Press contact</h2>
      <p className="lead mt-4 max-w-2xl">
        Founder is the press contact (no PR agency).
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
          LinkedIn (DM open)
        </a>
      </div>
    </section>
  );
}
