import Link from "next/link";
import { AISearchDemo } from "@/components/AISearchDemo";
import { DashboardLive } from "@/components/DashboardLive";
import { HeroVideo } from "@/components/HeroVideo";
import { PAYMENT, SUPPORT } from "@/lib/config";

const DEMO_VIDEO_ID = "fwKCITDa2MM";

export const metadata = {
  title: "Demo · See JobyBots' AI search live",
  description:
    "Watch the JobyBots AI agent search LinkedIn, Indeed, Naukri and Bayt — score every job against your résumé with Gemini, and email recruiters. Live interactive demo plus install walkthrough.",
  openGraph: {
    title: "JobyBots — 2-minute walkthrough · Watch the AI apply for jobs",
    description:
      "Real screen-recording of the JobyBots AI scanning LinkedIn, scoring matches with Gemini, validating recruiter emails, and sending personalised applications.",
    type: "video.other",
    videos: [
      {
        url: `https://www.youtube.com/embed/${DEMO_VIDEO_ID}`,
        type: "text/html",
        width: 1280,
        height: 720,
      },
    ],
  },
};

const steps = [
  {
    n: "01",
    title: "Pay ₹2,999 with UPI",
    body: "PhonePe / GPay / Paytm — scan our QR. Upload payment screenshot in the form. Owner approves within 30 minutes (24×7).",
  },
  {
    n: "02",
    title: "Get the installer in your email",
    body: "Approval email contains a one-click .zip download. Extract anywhere — Desktop is fine. Total size: ~20 MB.",
  },
  {
    n: "03",
    title: "Run JOBYBOT.bat",
    body: "Double-click. The installer creates a Python virtual environment, installs deps, and asks for your Gemini API key + Gmail App Password.",
  },
  {
    n: "04",
    title: "Drop your résumé in /resume.pdf",
    body: "JobyBots reads it, extracts skills and titles with Gemini, and saves an embedding so every job search runs against your unique profile.",
  },
  {
    n: "05",
    title: "Click 'Start Bot'",
    body: "The dashboard opens in your browser. Every 30 minutes the bot searches, scores, tailors emails, and sends them — all on your laptop.",
  },
  {
    n: "06",
    title: "Open the daily email at 9 AM",
    body: "Top 25 AI-matched jobs with apply links. Click Apply → browser bookmarklet pre-fills the form. You just click Submit.",
  },
];

const aiSteps = [
  {
    title: "1 · Search 8 sources in parallel",
    desc: "LinkedIn, Indeed, Naukri, Bayt, RemoteOK, AngelList, Glassdoor, company career pages. We hit them every 30 min, deduplicate, and feed jobs into the AI pipeline.",
  },
  {
    title: "2 · Read your résumé with Gemini AI",
    desc: "Gemini 1.5 Flash extracts skills, titles, years of experience, industries and keywords from your PDF résumé. Saved as a vector embedding for fast matching.",
  },
  {
    title: "3 · Score every job → 0-100 match",
    desc: "Each job description is compared against your résumé embedding. Gemini returns a match score plus a one-line explanation of WHY it matched.",
  },
  {
    title: "4 · Tailor cover letters per role",
    desc: "Jobs above 70% get a 4-sentence custom cover letter that quotes the JD and references your résumé. Generic-but-good for the 70–80% range.",
  },
  {
    title: "5 · Validate every recruiter email",
    desc: "DNS MX-lookup before sending. Bounced addresses get quarantined. EU markets are GDPR-safe (no email, apply-via-website only).",
  },
  {
    title: "6 · Send + track + retry",
    desc: "Daily cap of 200 emails. Live dashboard logs every send, bounce, and AI score. You see exactly what the bot is doing, in real time.",
  },
];

export default function DemoPage() {
  return (
    <>
      {/* HERO: live AI demo — light theme matching homepage */}
      <section className="relative overflow-hidden mesh-bg">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 right-0 h-[520px] w-[520px] rounded-full opacity-50 blur-3xl"
          style={{
            background:
              "radial-gradient(closest-side, rgba(255,107,0,0.16), transparent)",
          }}
        />
        <div className="relative mx-auto max-w-page section-pad px-4 lg:grid lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-6">
            <span className="pill">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
              Watch · 90 seconds · No fluff
            </span>
            <h1 className="display-1 mt-6 text-ink">
              The AI is searching jobs.
              <br />
              <span className="shimmer-text">Right now.</span>
            </h1>
            <p className="lead mt-7 max-w-xl">
              This is a simulation of what your dashboard does every 30 minutes
              on your laptop. The Gemini AI scans LinkedIn, Indeed, Naukri and
              Bayt, matches jobs to your résumé, and emails recruiters.
            </p>
            <div className="mt-10 flex gap-3">
              <Link href="/buy-india" className="btn-accent">
                Buy with UPI · ₹{PAYMENT.amountInr.toLocaleString("en-IN")}
              </Link>
              <Link href="/dashboard" className="btn-outline">
                See full dashboard
              </Link>
            </div>
          </div>
          <div className="mt-10 lg:col-span-6 lg:mt-0">
            <AISearchDemo />
          </div>
        </div>
      </section>

      {/* Recorded video slot */}
      <section className="border-y border-surface-border bg-surface-subtle">
        <div className="mx-auto max-w-page section-pad px-4">
          <div className="mx-auto max-w-3xl text-center">
            <p className="eyebrow">Recorded walkthrough · 90 sec</p>
            <h2 className="h2 mt-2">Watch the actual install + first apply</h2>
            <p className="lead mt-4">
              From a clean Windows install to the first 50 applications sent —
              real screen recording.
            </p>
          </div>
          <div className="mx-auto mt-10 max-w-3xl">
            <HeroVideo
              id={DEMO_VIDEO_ID}
              title="JobyBots — install walkthrough and first 50 applications"
            />
          </div>
        </div>
      </section>

      {/* AI pipeline explainer */}
      <section className="mx-auto max-w-page section-pad px-4">
        <p className="eyebrow">How the AI works</p>
        <h2 className="h2 mt-2">Six stages. Every 30 minutes. On your machine.</h2>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {aiSteps.map((s, i) => (
            <article key={s.title} className="card">
              <p className="text-xs font-bold uppercase tracking-widest text-accent">
                Stage {i + 1}
              </p>
              <h3 className="mt-2 text-lg font-semibold">{s.title.replace(/^\d+\s·\s/, "")}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{s.desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Full dashboard preview */}
      <section className="border-y border-surface-border bg-surface-subtle">
        <div className="mx-auto max-w-page px-4 py-12 lg:py-16">
          <div className="mx-auto max-w-3xl text-center">
            <p className="eyebrow">After install</p>
            <h2 className="h2 mt-2">This is your dashboard</h2>
            <p className="lead mt-4">
              Opens automatically in your browser. AI activity log on the left,
              ranked jobs with one-click apply on the right.
            </p>
          </div>
          <div className="mt-10">
            <DashboardLive />
          </div>
        </div>
      </section>

      {/* Customer install steps */}
      <section className="mx-auto max-w-page section-pad px-4">
        <p className="eyebrow">For non-technical customers</p>
        <h2 className="h2 mt-2">From payment to first apply · 15 minutes</h2>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {steps.map((s) => (
            <article key={s.n} className="card">
              <p className="text-xs font-bold uppercase tracking-widest text-accent">
                Step {s.n}
              </p>
              <h3 className="mt-2 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{s.body}</p>
            </article>
          ))}
        </div>
        <div className="mt-12 rounded-2xl bg-accent-soft p-6 text-sm">
          <p className="font-semibold">Stuck during install?</p>
          <p className="mt-2 text-ink-muted">
            Email{" "}
            <a className="text-accent underline" href={`mailto:${SUPPORT.email}`}>
              {SUPPORT.email}
            </a>{" "}
            or call/WhatsApp{" "}
            <a className="text-accent underline" href={`tel:${SUPPORT.phone.replace(/\s/g, "")}`}>
              {SUPPORT.phone}
            </a>
            . Founder responds within 1 hour, {SUPPORT.hours}.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-ink text-white">
        <div className="mx-auto max-w-page section-pad px-4 text-center">
          <h2 className="h2 text-white">Stop scrolling job boards. Let the AI work.</h2>
          <p className="lead mx-auto mt-4 max-w-xl text-white/70">
            ₹{PAYMENT.amountInr.toLocaleString("en-IN")} one-time. Lifetime
            license. 7-day refund.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link href="/buy-india" className="btn-primary">
              Buy with UPI · ₹{PAYMENT.amountInr.toLocaleString("en-IN")}
            </Link>
            <Link
              href="/pricing"
              className="btn-secondary !border-white/20 !bg-transparent !text-white hover:!bg-white/10"
            >
              Pay by card ($49)
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
