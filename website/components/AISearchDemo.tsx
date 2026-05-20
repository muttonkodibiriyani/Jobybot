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
  { label: "Scanning LinkedIn, Indeed, Naukri, Bayt…", color: "text-sky-300" },
  { label: "Reading your résumé with Gemini AI…", color: "text-purple-300" },
  { label: "Ranking jobs by match score…", color: "text-amber-300" },
  { label: "Tailoring email + cover letter per role…", color: "text-emerald-300" },
  { label: "Sending validated applications…", color: "text-accent" },
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
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lift backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent" />
          </span>
          <p className="text-xs font-semibold uppercase tracking-wider text-white/70">
            AI search · Live
          </p>
        </div>
        <p className="text-xs text-white/40">Powered by Gemini</p>
      </div>

      {/* Stage ticker */}
      <p className={`mt-4 text-sm font-medium transition-colors duration-500 ${STAGES[stage].color}`}>
        <span className="mr-2 inline-block animate-pulse">●</span>
        {STAGES[stage].label}
      </p>

      {/* Sent + matched counters */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-black/30 p-3">
          <p className="text-xs uppercase tracking-wider text-white/50">Matched</p>
          <p className="mt-1 text-2xl font-bold text-white">{visibleJobs.length}</p>
        </div>
        <div className="rounded-xl bg-black/30 p-3">
          <p className="text-xs uppercase tracking-wider text-white/50">Sent today</p>
          <p className="mt-1 text-2xl font-bold text-accent">{sentCount} / 200</p>
        </div>
      </div>

      {/* Job list with AI explanations */}
      <ul className="mt-5 max-h-[320px] space-y-3 overflow-hidden text-sm">
        {visibleJobs.length === 0 ? (
          <li className="rounded-xl border border-dashed border-white/10 bg-white/5 p-4 text-center text-white/40">
            Waiting for first AI match…
          </li>
        ) : (
          visibleJobs.map((j) => (
            <li
              key={`${j.title}-${j.company}`}
              className="animate-in fade-in slide-in-from-bottom-2 rounded-xl border border-white/10 bg-black/30 p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-white">{j.title}</p>
                  <p className="truncate text-xs text-white/50">
                    {j.company} · {j.location} · <span className="text-white/70">{j.source}</span>
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${
                    j.match >= 85
                      ? "bg-accent/20 text-accent"
                      : "bg-white/10 text-white/80"
                  }`}
                >
                  {j.match}% match
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-white/60">
                <span className="font-semibold text-purple-300">Gemini:</span> {j.reason}
              </p>
            </li>
          ))
        )}
      </ul>

      <p className="mt-4 text-xs text-white/40">
        Demo simulation · Real instance updates every 60 seconds
      </p>
    </div>
  );
}
