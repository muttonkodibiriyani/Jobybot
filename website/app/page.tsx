import Link from "next/link";
import { CheckoutButton } from "@/components/CheckoutButton";

const stats = [
  { value: "200", label: "Emails / day cap" },
  { value: "8", label: "Countries built-in" },
  { value: "60m", label: "Default search cycle" },
  { value: "100%", label: "Runs on your PC" },
];

const steps = [
  {
    n: "1",
    title: "Install on your laptop",
    body: "Windows 10+. One installer. Your Gmail App Password stays local in .env — never on our servers.",
  },
  {
    n: "2",
    title: "Jobybot searches every hour",
    body: "LinkedIn, Indeed, Bayt, Naukri Gulf, RemoteOK — matched to your resume and target titles.",
  },
  {
    n: "3",
    title: "Emails recruiters for you",
    body: "Personalized cover letters + your PDF to curated UAE, India, Singapore, EU, UK, Canada contacts.",
  },
  {
    n: "4",
    title: "You apply in one click",
    body: "Live HTML inbox ranks jobs. Open & Apply on LinkedIn Easy Apply in ~30 seconds each.",
  },
];

const markets = ["UAE", "India outbound", "Singapore", "Germany", "Netherlands", "Ireland", "Canada", "UK"];

export default function HomePage() {
  return (
    <>
      <section className="bg-ink text-white">
        <div className="mx-auto max-w-page section-pad lg:flex lg:items-center lg:gap-16">
          <div className="flex-1">
            <p className="eyebrow text-white/60">Job search, automated — on your terms</p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl lg:text-[3.5rem] lg:leading-[1.08]">
              While you sleep, Jobybot finds jobs and emails recruiters.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/75">
              The precision of a top marketplace product — built for job seekers in{" "}
              <strong className="text-white">UAE</strong>, <strong className="text-white">India</strong>,
              and worldwide. No cloud account. No resume upload to us.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <CheckoutButton className="!bg-accent hover:!bg-accent-hover" />
              <Link href="/#how" className="btn-secondary !border-white/20 !bg-transparent !text-white hover:!bg-white/10">
                See how it works
              </Link>
            </div>
            <p className="mt-6 text-sm text-white/50">
              One-time purchase · Installer for Windows · MIT community edition on GitHub
            </p>
          </div>
          <div className="mt-12 flex-1 lg:mt-0">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lift backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-wider text-accent">Live dashboard</p>
              <p className="mt-2 text-2xl font-bold">47 matched jobs ready</p>
              <ul className="mt-6 space-y-4 text-sm">
                <li className="flex justify-between border-b border-white/10 pb-3">
                  <span>Senior Product Manager · Careem</span>
                  <span className="font-bold text-accent">85</span>
                </li>
                <li className="flex justify-between border-b border-white/10 pb-3">
                  <span>Data PM · talabat</span>
                  <span className="font-bold text-accent">82</span>
                </li>
                <li className="flex justify-between pb-1">
                  <span>Business Analyst · ENOC</span>
                  <span className="font-bold text-accent">78</span>
                </li>
              </ul>
              <p className="mt-4 text-xs text-white/50">+ emails sent today with your CV attached</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-surface-border bg-surface-subtle">
        <div className="mx-auto grid max-w-page grid-cols-2 gap-6 section-pad sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-bold text-ink sm:text-4xl">{s.value}</p>
              <p className="mt-1 text-sm text-ink-muted">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how" className="mx-auto max-w-page section-pad">
        <p className="eyebrow">How it works</p>
        <h2 className="h2 mt-2">Four steps. Zero complexity.</h2>
        <p className="lead mt-4 max-w-2xl">
          Designed like the best consumer apps: one clear action per step, no jargon.
        </p>
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {steps.map((s) => (
            <article key={s.n} className="card">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft text-sm font-bold text-accent">
                {s.n}
              </span>
              <h3 className="mt-4 text-xl font-semibold">{s.title}</h3>
              <p className="mt-2 text-ink-muted leading-relaxed">{s.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="markets" className="bg-surface-subtle">
        <div className="mx-auto max-w-page section-pad text-center">
          <p className="eyebrow">Markets</p>
          <h2 className="h2 mt-2">Built for UAE & India — ready for the world</h2>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {markets.map((m) => (
              <span
                key={m}
                className="rounded-full border border-surface-border bg-surface px-5 py-2.5 text-sm font-medium shadow-sm"
              >
                {m}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="mx-auto max-w-page section-pad">
        <h2 className="h2">Questions</h2>
        <dl className="mt-10 space-y-8">
          <div>
            <dt className="font-semibold">Does it auto-apply on LinkedIn?</dt>
            <dd className="mt-2 text-ink-muted">
              It emails recruiters and gives you a ranked inbox to apply manually — safer for your account and compliant with platform rules.
            </dd>
          </div>
          <div>
            <dt className="font-semibold">What are the minimum requirements?</dt>
            <dd className="mt-2 text-ink-muted">
              Windows 10/11, 4GB RAM, internet, Gmail with App Password, and your resume as PDF.
            </dd>
          </div>
          <div>
            <dt className="font-semibold">Is my data safe?</dt>
            <dd className="mt-2 text-ink-muted">
              Everything runs locally. We do not host your Gmail password or CV on our servers.
            </dd>
          </div>
        </dl>
      </section>

      <section className="bg-accent-soft">
        <div className="mx-auto max-w-page section-pad text-center">
          <h2 className="h2">Ready to run your job search on autopilot?</h2>
          <p className="lead mx-auto mt-4 max-w-xl">
            Pay once. Download the installer. Be up and running in 15 minutes.
          </p>
          <div className="mt-8 flex justify-center">
            <CheckoutButton />
          </div>
        </div>
      </section>
    </>
  );
}
