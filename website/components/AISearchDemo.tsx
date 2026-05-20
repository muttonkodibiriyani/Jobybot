"use client";
import { useEffect, useState } from "react";

type Job = {
  title: string;
  company: string;
  location: string;
  source: string;
  match: number;
  applyUrl?: string;
  reason: string;
};

const STAGES = [
  { label: "Scanning LinkedIn, Indeed, Naukri, Bayt…", color: "text-sky-600" },
  { label: "Reading your résumé with Gemini AI…",     color: "text-purple-600" },
  { label: "Ranking jobs by match score…",            color: "text-amber-600" },
  { label: "Tailoring email + cover letter per role…", color: "text-emerald-600" },
  { label: "Sending validated applications…",         color: "text-accent" },
] as const;

const JOBS: Job[] = [
  {
    title: "Senior Product Manager",
    company: "Careem",
    location: "Dubai, UAE",
    source: "LinkedIn",
    match: 92,
    reason: "Matches your 'mobility + payments' resume keywords. Active recruiter on profile.",
  },
  {
    title: "Data Product Manager",
    company: "talabat",
    location: "Riyadh, KSA",
    source: "Indeed",
    match: 88,
    reason: "Resume mentions Snowflake + Mixpanel. Role asks for both. Posted 4 hrs ago.",
  },
  {
    title: "AI Product Lead",
    company: "Razorpay",
    location: "Bengaluru, IN",
    source: "Naukri",
    match: 85,
    reason: "Strong LLM background match. Tailored cover letter highlights your Gemini work.",
  },
  {
    title: "Senior PM, Fraud",
    company: "PayPal",
    location: "Singapore",
    source: "LinkedIn",
    match: 81,
    reason: "Risk + fraud PM with payments background — your last role is a near-direct fit.",
  },
  {
    title: "Business Analyst — Strategy",
    company: "ENOC",
    location: "Dubai, UAE",
    source: "Bayt",
    match: 78,
    reason: "Energy + strategy ops. Generic CV is sent. Recruiter email verified via MX lookup.",
  },
];

export function AISearchDemo() {
  const [stage, setStage] = useState(0);
  const [visibleJobs, setVisibleJobs] = useState<Job[]>([]);
  const [sentCount, setSentCount] = useState(0);

  useEffect(() => {
    let idx = 0;
    let jobIdx = 0;

    const tick = () => {
      // advance stage every 2 seconds
      idx = (idx + 1) % STAGES.length;
      setStage(idx);

      // reveal one more job each cycle (until all shown), then loop
      if (idx === 2 || idx === 3) {
        if (jobIdx < JOBS.length) {
          setVisibleJobs(JOBS.slice(0, jobIdx + 1));
          jobIdx += 1;
        }
      }

      // sending stage — tick the sent counter
      if (idx === 4) {
        setSentCount((c) => (c >= 200 ? 0 : c + Math.floor(Math.random() * 4) + 2));
      }

      // restart full cycle once we've shown everything
      if (idx === 0 && jobIdx >= JOBS.length) {
        jobIdx = 0;
        setVisibleJobs([]);
      }
    };

    const id = window.setInterval(tick, 2000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="rounded-3xl border border-surface-divider bg-white p-6 shadow-card backdrop-blur-sm sm:p-7">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent" />
          </span>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-muted">
            AI search · Live
          </p>
        </div>
        <p className="font-mono text-[11px] uppercase tracking-wider text-ink-hint">
          Powered by Gemini
        </p>
      </div>

      {/* Stage ticker */}
      <p className={`mt-5 text-[15px] font-semibold transition-colors duration-500 ${STAGES[stage].color}`}>
        <span className="mr-2 inline-block animate-pulse">●</span>
        {STAGES[stage].label}
      </p>

      {/* Sent + matched counters */}
      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-surface-subtle p-3.5">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted">Matched</p>
          <p className="mt-1 font-display text-2xl font-bold text-ink">{visibleJobs.length}</p>
        </div>
        <div className="rounded-2xl bg-accent-soft p-3.5">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent">Sent today</p>
          <p className="mt-1 font-display text-2xl font-bold text-accent">{sentCount} / 200</p>
        </div>
      </div>

      {/* Job list with AI explanations */}
      <ul className="mt-5 max-h-[300px] space-y-2.5 overflow-hidden text-sm">
        {visibleJobs.length === 0 ? (
          <li className="rounded-2xl border border-dashed border-surface-divider bg-surface-subtle p-4 text-center text-sm text-ink-hint">
            Waiting for first AI match…
          </li>
        ) : (
          visibleJobs.map((j) => (
            <li
              key={`${j.title}-${j.company}`}
              className="animate-fade-up rounded-2xl border border-surface-divider bg-white p-3.5 shadow-xs transition-shadow duration-200 hover:shadow-card"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink">{j.title}</p>
                  <p className="truncate text-xs text-ink-muted">
                    {j.company} · {j.location} · <span className="font-medium text-ink">{j.source}</span>
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    j.match >= 85
                      ? "bg-accent-soft text-accent"
                      : "bg-surface-subtle text-ink-muted"
                  }`}
                >
                  {j.match}% match
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-ink-muted">
                <span className="font-semibold text-purple-700">Gemini:</span> {j.reason}
              </p>
            </li>
          ))
        )}
      </ul>

      <p className="mt-4 font-mono text-[10px] uppercase tracking-wider text-ink-hint">
        Demo simulation · Real instance updates every 60 seconds
      </p>
    </div>
  );
}
