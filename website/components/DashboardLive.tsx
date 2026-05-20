"use client";
import { useEffect, useState } from "react";

type LogLine = {
  t: string;
  level: "info" | "ok" | "warn" | "ai";
  msg: string;
};

type JobRow = {
  title: string;
  company: string;
  location: string;
  source: string;
  match: number;
  reason: string;
  applyUrl: string;
  status: "new" | "applied" | "emailed" | "saved";
};

const SEED_LOGS: LogLine[] = [
  { t: "09:00:02", level: "info", msg: "Cycle started · 8 sources, 12 markets" },
  { t: "09:00:05", level: "info", msg: "LinkedIn: 47 listings discovered" },
  { t: "09:00:08", level: "info", msg: "Indeed: 31 listings discovered" },
  { t: "09:00:11", level: "info", msg: "Naukri: 28 listings discovered" },
  { t: "09:00:13", level: "info", msg: "Bayt: 14 listings discovered" },
  { t: "09:00:14", level: "ai", msg: "Gemini · loading résumé embeddings…" },
  { t: "09:00:18", level: "ai", msg: "Gemini · scoring 120 jobs against your profile…" },
  { t: "09:00:23", level: "ok", msg: "47 jobs scored ≥ 70% match" },
  { t: "09:00:24", level: "ai", msg: "Gemini · drafting tailored cover letters…" },
  { t: "09:00:31", level: "info", msg: "MX-validating 47 recruiter emails…" },
  { t: "09:00:35", level: "warn", msg: "2 invalid recruiter emails quarantined" },
  { t: "09:00:36", level: "ok", msg: "Sending 45 personalized emails (rate-limited)" },
  { t: "09:00:42", level: "ok", msg: "12 emails sent · 0 bounces detected" },
];

const JOBS: JobRow[] = [
  {
    title: "Senior Product Manager · Mobility",
    company: "Careem",
    location: "Dubai, UAE",
    source: "LinkedIn",
    match: 92,
    reason: "Mobility + payments fit; recruiter active in last 24h; Easy Apply enabled.",
    applyUrl: "https://www.linkedin.com/jobs/view/3987654321",
    status: "new",
  },
  {
    title: "Data Product Manager",
    company: "talabat",
    location: "Riyadh, KSA",
    source: "Indeed",
    match: 88,
    reason: "Snowflake + Mixpanel keywords match; growth-PM track listed in your résumé.",
    applyUrl: "https://www.indeed.com/viewjob?jk=abcd1234",
    status: "new",
  },
  {
    title: "AI Product Lead",
    company: "Razorpay",
    location: "Bengaluru, IN",
    source: "Naukri",
    match: 85,
    reason: "LLM/embedding background; tailored cover-letter highlights your Gemini work.",
    applyUrl: "https://www.naukri.com/job-listings-1234567",
    status: "emailed",
  },
  {
    title: "Senior PM, Fraud & Risk",
    company: "PayPal",
    location: "Singapore",
    source: "LinkedIn",
    match: 81,
    reason: "Risk + payments PM, direct fit to your last role at Adyen.",
    applyUrl: "https://www.linkedin.com/jobs/view/3987654322",
    status: "new",
  },
  {
    title: "Strategy Business Analyst",
    company: "ENOC",
    location: "Dubai, UAE",
    source: "Bayt",
    match: 78,
    reason: "Energy + strategy ops fit; generic-but-strong CV variant sent.",
    applyUrl: "https://www.bayt.com/en/uae/jobs/strategy-business-analyst-1234567/",
    status: "emailed",
  },
  {
    title: "Growth PM, India",
    company: "Swiggy",
    location: "Bengaluru, IN",
    source: "LinkedIn",
    match: 76,
    reason: "Marketplace + growth experience; recruiter email validated.",
    applyUrl: "https://www.linkedin.com/jobs/view/3987654323",
    status: "saved",
  },
  {
    title: "Senior PM, Wallet",
    company: "Paytm",
    location: "Noida, IN",
    source: "Naukri",
    match: 74,
    reason: "Fintech wallet experience match; UPI knowledge bonus.",
    applyUrl: "https://www.naukri.com/job-listings-1234568",
    status: "applied",
  },
];

export function DashboardLive() {
  const [tick, setTick] = useState(0);
  const [sentToday, setSentToday] = useState(127);
  const [matchedToday, setMatchedToday] = useState(47);
  const [showLogs, setShowLogs] = useState<LogLine[]>(SEED_LOGS.slice(0, 6));

  useEffect(() => {
    const id = window.setInterval(() => {
      setTick((t) => t + 1);
      setSentToday((s) => (s < 200 ? s + Math.floor(Math.random() * 3) + 1 : s));
      if (Math.random() < 0.4) setMatchedToday((m) => m + 1);
      setShowLogs((prev) => {
        const next = SEED_LOGS[(prev.length) % SEED_LOGS.length];
        const updated = [...prev, { ...next, t: new Date().toLocaleTimeString() }];
        return updated.length > 10 ? updated.slice(-10) : updated;
      });
    }, 1800);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="overflow-hidden rounded-3xl border border-surface-border bg-surface shadow-lift">
      {/* Window chrome */}
      <div className="flex items-center gap-2 border-b border-surface-border bg-surface-subtle px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        <div className="ml-3 flex-1 truncate rounded-md bg-surface px-3 py-1 text-xs text-ink-muted">
          localhost:8080/dashboard.html · JobyBots
        </div>
        <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
          ● LIVE
        </span>
      </div>

      <div className="grid lg:grid-cols-12">
        {/* Left: KPIs + AI log */}
        <div className="border-r border-surface-border bg-surface-subtle p-6 lg:col-span-4">
          <p className="eyebrow">Today</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Kpi label="Matched" value={String(matchedToday)} accent />
            <Kpi label="Sent" value={`${sentToday}/200`} />
            <Kpi label="Bounces" value="0" />
            <Kpi label="Sources" value="8" />
          </div>

          <p className="eyebrow mt-8">AI Activity</p>
          <div className="mt-3 h-[280px] overflow-hidden rounded-xl bg-ink p-3 font-mono text-[11px] leading-relaxed text-white/80">
            {showLogs.map((l, i) => (
              <p key={`${i}-${l.t}`} className="whitespace-nowrap">
                <span className="text-white/40">{l.t} </span>
                <span
                  className={
                    l.level === "ok"
                      ? "text-emerald-300"
                      : l.level === "warn"
                        ? "text-amber-300"
                        : l.level === "ai"
                          ? "text-purple-300"
                          : "text-sky-300"
                  }
                >
                  {l.level === "ai" ? "✨ " : l.level === "ok" ? "✓ " : l.level === "warn" ? "⚠ " : "· "}
                </span>
                <span className="text-white">{l.msg}</span>
              </p>
            ))}
          </div>
          <p className="mt-2 text-[10px] text-ink-muted">tick #{tick} · auto-refresh 1.8s</p>
        </div>

        {/* Right: ranked jobs */}
        <div className="p-6 lg:col-span-8">
          <div className="flex items-center justify-between">
            <p className="eyebrow">AI-ranked jobs · today</p>
            <p className="text-xs text-ink-muted">Click Apply to open in browser</p>
          </div>

          <ul className="mt-3 divide-y divide-surface-border">
            {JOBS.map((j) => (
              <li key={j.title} className="py-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{j.title}</p>
                    <p className="truncate text-xs text-ink-muted">
                      {j.company} · {j.location} ·{" "}
                      <span className="font-semibold text-ink">{j.source}</span>
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      j.match >= 85
                        ? "bg-accent-soft text-accent"
                        : "bg-surface-subtle text-ink-muted"
                    }`}
                  >
                    {j.match}%
                  </span>
                  <StatusPill status={j.status} />
                  <a
                    href={j.applyUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 rounded-lg bg-ink px-3 py-1.5 text-xs font-semibold text-white hover:bg-ink/90"
                  >
                    Apply →
                  </a>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">
                  <span className="font-semibold text-purple-700">Gemini:</span> {j.reason}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-surface-border bg-surface p-3">
      <p className="text-[10px] uppercase tracking-wider text-ink-muted">{label}</p>
      <p
        className={`mt-1 text-2xl font-bold ${accent ? "text-accent" : "text-ink"}`}
      >
        {value}
      </p>
    </div>
  );
}

function StatusPill({ status }: { status: JobRow["status"] }) {
  const map: Record<JobRow["status"], { label: string; cls: string }> = {
    new: { label: "New", cls: "bg-sky-50 text-sky-700 border-sky-100" },
    emailed: { label: "Emailed", cls: "bg-emerald-50 text-emerald-700 border-emerald-100" },
    applied: { label: "Applied", cls: "bg-purple-50 text-purple-700 border-purple-100" },
    saved: { label: "Saved", cls: "bg-amber-50 text-amber-700 border-amber-100" },
  };
  const m = map[status];
  return (
    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${m.cls}`}>
      {m.label}
    </span>
  );
}
