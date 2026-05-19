type Cell = string | true | false;

const rows: { feature: string; us: Cell; sonara: Cell; lazyapply: Cell; aiapply: Cell }[] = [
  { feature: "Pricing model",                us: "₹2,999 one-time · lifetime", sonara: "$80 / month", lazyapply: "$99 / yr", aiapply: "$25 / month" },
  { feature: "Where does it run?",           us: "100% on your laptop",           sonara: "Their cloud",         lazyapply: "Their cloud",  aiapply: "Their cloud" },
  { feature: "Need to give cloud access to your LinkedIn?", us: false,             sonara: true,                 lazyapply: true,           aiapply: true },
  { feature: "Email validation + bounce tracking", us: true,                       sonara: false,                lazyapply: false,          aiapply: false },
  { feature: "GDPR-safe mode (EU)",          us: true,                              sonara: false,                lazyapply: false,          aiapply: false },
  { feature: "Recruiter email outreach",     us: "200/day · MX-validated",        sonara: false,                lazyapply: false,          aiapply: false },
  { feature: "LinkedIn Easy Apply pre-fill (you click Submit)", us: true,         sonara: "Auto-submit (risk)", lazyapply: "Auto-submit (risk)", aiapply: "Auto-submit (risk)" },
  { feature: "Indeed + Bayt + Naukri + Workday support", us: true,                sonara: "LinkedIn only",      lazyapply: true,           aiapply: "Limited" },
  { feature: "Built-in dashboard + run log", us: true,                              sonara: true,                 lazyapply: false,          aiapply: true },
  { feature: "Markets curated",              us: "India, UAE, SG, UK, EU, CA, AU", sonara: "US, UK",             lazyapply: "US",           aiapply: "US, UK" },
  { feature: "Your data leaves your machine?", us: false,                          sonara: true,                 lazyapply: true,           aiapply: true },
  { feature: "Refund policy",                us: "7-day full refund",             sonara: "Pro-rata",           lazyapply: "30 days",      aiapply: "14 days" },
  { feature: "Support email + phone",        us: true,                              sonara: "Email",              lazyapply: "Email",        aiapply: "Email" },
];

function CellView({ v }: { v: Cell }) {
  if (v === true) return <span className="font-bold text-success">Yes</span>;
  if (v === false) return <span className="text-ink-muted">No</span>;
  return <span>{v}</span>;
}

export function ComparisonTable() {
  return (
    <div className="overflow-x-auto rounded-2xl border border-surface-border bg-surface">
      <table className="w-full min-w-[760px] text-sm">
        <thead className="bg-ink text-white">
          <tr>
            <th className="px-4 py-4 text-left font-semibold">Feature</th>
            <th className="px-4 py-4 text-left font-semibold text-accent">JobyBots</th>
            <th className="px-4 py-4 text-left font-semibold text-white/70">Sonara</th>
            <th className="px-4 py-4 text-left font-semibold text-white/70">LazyApply</th>
            <th className="px-4 py-4 text-left font-semibold text-white/70">AIApply</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-surface-border">
              <td className="px-4 py-3.5 font-medium">{r.feature}</td>
              <td className="px-4 py-3.5 bg-accent/5"><CellView v={r.us} /></td>
              <td className="px-4 py-3.5 text-ink-muted"><CellView v={r.sonara} /></td>
              <td className="px-4 py-3.5 text-ink-muted"><CellView v={r.lazyapply} /></td>
              <td className="px-4 py-3.5 text-ink-muted"><CellView v={r.aiapply} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
