"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import JSZip from "jszip";

/**
 * Customer portal — post-login.
 *
 * Three jobs:
 *   1. Configure (5-step inline wizard, client-side state).
 *   2. Generate + download a personalised "JobyBots-personal.zip"
 *      containing the customer's .env, install scripts (BAT + .command),
 *      and a 1-page README. The ZIP is assembled entirely in the browser
 *      using JSZip. Credentials never reach our servers.
 *   3. Educate them about what to do after (open dashboard, watch replies).
 *
 * Architecture note:
 *   The downloaded ZIP doesn't contain the full Python bot — it contains a
 *   small bootstrap that fetches the latest JobyBots repo from GitHub when
 *   first run. This keeps the download ~30 KB, always-current, and avoids
 *   us shipping a frozen binary that gets stale.
 */

type FormState = {
  name: string;
  email: string;
  phone: string;
  linkedin: string;
  location: string;
  visa: string;
  notice: string;
  summary: string;
  gmail: string;
  appPassword: string;
  geminiKey: string;
  groqKey: string;
  titles: string;
  primaryMarket: string;
  secondaryMarkets: string;
  linkedinCookie: string;
  dailyCap: number;
};

function defaults(email: string): FormState {
  return {
    name: "",
    email,
    phone: "",
    linkedin: "",
    location: "Dubai, UAE",
    visa: "UAE Resident Visa",
    notice: "1 month",
    summary: "",
    gmail: email,
    appPassword: "",
    geminiKey: "",
    groqKey: "",
    titles:
      "Product Manager,Senior Product Manager,Data Product Manager,AI Product Manager",
    primaryMarket: "UAE",
    secondaryMarkets: "Saudi,Qatar,Oman,Bahrain,India,UK",
    linkedinCookie: "",
    dailyCap: 200,
  };
}

const STEPS = [
  { id: 1, label: "Identity",   help: "Name & contact" },
  { id: 2, label: "Gmail",      help: "App password" },
  { id: 3, label: "AI key",     help: "Free Gemini" },
  { id: 4, label: "Targeting",  help: "Roles + markets" },
  { id: 5, label: "Optional",   help: "LinkedIn cookie" },
  { id: 6, label: "Download",   help: "Your ZIP" },
] as const;

export function PortalDashboard({ email }: { email: string }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(defaults(email));
  const [showSecrets, setShowSecrets] = useState(false);
  const [zipStatus, setZipStatus] = useState<
    "idle" | "building" | "ready" | "error"
  >("idle");
  const [zipError, setZipError] = useState<string | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  const envFile = useMemo(() => buildEnv(form), [form]);
  const validation = validateStep(step, form);

  const ready =
    !!form.name &&
    !!form.email &&
    !!form.gmail &&
    !!form.appPassword &&
    !!form.geminiKey;

  async function buildAndDownloadZip() {
    setZipStatus("building");
    setZipError(null);
    try {
      const zip = new JSZip();
      const stamp = new Date().toISOString().slice(0, 10);
      const safeName = form.name
        .replace(/[^a-zA-Z0-9_-]+/g, "_")
        .replace(/^_+|_+$/g, "") || "user";

      // 1. Their .env
      zip.file(".env", envFile);

      // 2. Bootstrap launchers
      zip.file("INSTALL-WINDOWS.bat", windowsBootstrap());
      const macInstall = zip.file("INSTALL-MAC.command", macBootstrap());
      // We can't actually chmod inside JSZip in browser, but Mac honours
      // shebangs + macOS lets you right-click→Open the first time anyway.
      // The README explains.

      // 3. README
      zip.file("README.txt", readmeContent(form, stamp));

      // 4. Quick-start cheatsheet
      zip.file("HOW_TO_RUN.txt", howToRun());

      const blob = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 },
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `JobyBots-Personal-${safeName}-${stamp}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      // Don't immediately revoke — Safari needs a moment.
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      setZipStatus("ready");
    } catch (err) {
      setZipError(err instanceof Error ? err.message : "Unknown error");
      setZipStatus("error");
    }
  }

  async function logout() {
    try {
      await fetch("/api/license/validate", {
        method: "DELETE",
        credentials: "same-origin",
      });
    } catch {
      /* ignore */
    } finally {
      window.location.href = "/login";
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-cream via-white to-white">
      {/* Top bar */}
      <header className="border-b border-surface-divider bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-6 py-4">
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-accent to-[#FF8C3A] text-sm font-extrabold text-white"
            >
              J
            </span>
            <div>
              <p className="text-xs font-mono uppercase tracking-[0.18em] text-slate-500">
                Portal
              </p>
              <p className="text-sm font-semibold text-ink">
                {email}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard-guide"
              className="hidden sm:inline-flex rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Dashboard guide
            </Link>
            <Link
              href="/security"
              className="hidden sm:inline-flex rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Security
            </Link>
            <button
              type="button"
              onClick={logout}
              className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Hero strip */}
      <section className="mx-auto max-w-6xl px-6 pt-10 pb-2">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-strong">
          Customer portal · Local-first · No SaaS
        </p>
        <h1 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-ink">
          Build your personalised JobyBots ZIP in 2 minutes.
        </h1>
        <p className="mt-4 max-w-3xl text-base text-slate-700 leading-relaxed">
          Fill the wizard. Your{" "}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">.env</code>{" "}
          is generated <strong>in your browser</strong>, bundled with the
          install scripts, and downloaded as a single ZIP you can double-click.{" "}
          <Link href="/security" className="text-accent-strong underline">
            Why is this safe?
          </Link>
        </p>
        <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
          <span aria-hidden>●</span>
          Open DevTools → Network. You'll see zero outgoing requests when you click Download.
        </div>
      </section>

      {/* Progress chips */}
      <section className="mx-auto max-w-6xl px-6 py-4">
        <ol className="flex items-center gap-2 overflow-x-auto pb-2" aria-label="Setup progress">
          {STEPS.map((s) => {
            const done = step > s.id;
            const current = step === s.id;
            return (
              <li key={s.id} className="flex-1 min-w-[92px]">
                <button
                  type="button"
                  onClick={() => setStep(s.id)}
                  className={`block w-full rounded-xl border px-3 py-2 text-left transition ${
                    current
                      ? "border-accent bg-accent/10"
                      : done
                      ? "border-emerald-300 bg-emerald-50"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <span className="block text-[10px] font-mono uppercase tracking-[0.18em] text-slate-500">
                    Step {s.id}{done ? " ✓" : ""}
                  </span>
                  <span className="mt-0.5 block text-xs font-semibold text-ink">
                    {s.label}
                  </span>
                  <span className="block text-[11px] text-slate-500">{s.help}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </section>

      {/* Form card */}
      <section className="mx-auto max-w-6xl px-6 pb-12">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl shadow-slate-900/5 lg:col-span-2">
            {step === 1 && <IdentityStep form={form} update={update} />}
            {step === 2 && (
              <GmailStep
                form={form}
                update={update}
                showSecrets={showSecrets}
                setShowSecrets={setShowSecrets}
              />
            )}
            {step === 3 && (
              <AiStep
                form={form}
                update={update}
                showSecrets={showSecrets}
                setShowSecrets={setShowSecrets}
              />
            )}
            {step === 4 && <TargetingStep form={form} update={update} />}
            {step === 5 && <OptionalStep form={form} update={update} />}
            {step === 6 && (
              <DownloadStep
                form={form}
                envFile={envFile}
                ready={ready}
                zipStatus={zipStatus}
                zipError={zipError}
                onDownload={buildAndDownloadZip}
              />
            )}

            {/* Nav */}
            <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-6">
              <button
                type="button"
                onClick={() => setStep((s) => Math.max(1, s - 1))}
                disabled={step === 1}
                className="rounded-full px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-40"
              >
                ← Back
              </button>
              <div className="flex items-center gap-3">
                {validation.message && (
                  <span
                    className={`text-xs font-medium ${
                      validation.ok ? "text-emerald-700" : "text-amber-700"
                    }`}
                  >
                    {validation.message}
                  </span>
                )}
                {step < 6 ? (
                  <button
                    type="button"
                    onClick={() => setStep((s) => Math.min(6, s + 1))}
                    className="rounded-full bg-ink px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-ink-soft"
                  >
                    Next →
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          {/* Sidebar: live checklist */}
          <aside className="lg:col-span-1 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-mono uppercase tracking-[0.18em] text-slate-500">
                Required to download
              </p>
              <ul className="mt-3 space-y-2 text-sm">
                <ChecklistItem ok={!!form.name} text="Full name" />
                <ChecklistItem ok={!!form.email} text="Personal email" />
                <ChecklistItem ok={!!form.gmail} text="Gmail address" />
                <ChecklistItem
                  ok={form.appPassword.replace(/\s/g, "").length >= 16}
                  text="Gmail App Password (16 chars)"
                />
                <ChecklistItem
                  ok={form.geminiKey.startsWith("AIza")}
                  text="Gemini API key"
                />
              </ul>
              <p className="mt-4 text-xs text-slate-500">
                Optional fields (LinkedIn cookie, Groq fallback, custom
                targeting) live in steps 4 and 5.
              </p>
            </div>

            <div className="rounded-2xl bg-ink p-5 text-white">
              <p className="text-xs font-mono uppercase tracking-[0.18em] text-white/70">
                What you'll get
              </p>
              <ul className="mt-3 space-y-2 text-sm text-white/90">
                <li>↳ <strong>JobyBots-Personal-*.zip</strong></li>
                <li className="ml-3 text-white/75">
                  Contains <code className="text-xs text-white/90">.env</code> + 2
                  install scripts + README. ~30 KB.
                </li>
                <li>↳ Auto-fetches the latest JobyBots from GitHub on first
                  run, so your code never goes stale.</li>
                <li>↳ Works on Windows + macOS (Intel + Apple Silicon).</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-cream p-5">
              <p className="text-xs font-mono uppercase tracking-[0.18em] text-accent-strong">
                Need help?
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">
                Stuck on the App Password or Gemini key? Each step has an
                in-line cheat sheet with direct links. Still stuck?{" "}
                <a
                  href="mailto:tharakesh.iitp@gmail.com"
                  className="text-accent-strong underline"
                >
                  Email the founder
                </a>{" "}
                — usually responds within 2 hours.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

/* ─── Reusable field wrapper ────────────────────────────────────────────── */
function Field({
  label,
  hint,
  required,
  children,
  className = "",
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-sm font-semibold text-ink">
        {label} {required ? <span className="text-accent">*</span> : null}
      </span>
      <span className="mt-1.5 block">{children}</span>
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

function ChecklistItem({ ok, text }: { ok: boolean; text: string }) {
  return (
    <li className="flex items-start gap-2 text-slate-700">
      <span
        aria-hidden
        className={`mt-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${
          ok ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"
        }`}
      >
        {ok ? "✓" : "○"}
      </span>
      <span className={ok ? "text-slate-800" : ""}>{text}</span>
    </li>
  );
}

/* ─── Step components (lean, the heavy versions live in /setup) ─────────── */
function IdentityStep({
  form,
  update,
}: {
  form: FormState;
  update: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
}) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-ink">Tell us who you are</h2>
      <p className="mt-2 text-sm text-slate-600">
        These details are written into your cover letters.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field label="Full name" required>
          <input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Your full name" className="input" />
        </Field>
        <Field label="Personal email" required>
          <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} className="input" />
        </Field>
        <Field label="Phone (with country code)">
          <input value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+971501234567" className="input" />
        </Field>
        <Field label="LinkedIn URL">
          <input value={form.linkedin} onChange={(e) => update("linkedin", e.target.value)} placeholder="https://linkedin.com/in/..." className="input" />
        </Field>
        <Field label="Location"><input value={form.location} onChange={(e) => update("location", e.target.value)} className="input" /></Field>
        <Field label="Visa / right to work"><input value={form.visa} onChange={(e) => update("visa", e.target.value)} className="input" /></Field>
        <Field label="Notice period"><input value={form.notice} onChange={(e) => update("notice", e.target.value)} className="input" /></Field>
      </div>
      <Field className="mt-4" label="One-line summary" hint="Two sentences. Goes into every cover letter.">
        <textarea value={form.summary} onChange={(e) => update("summary", e.target.value)} rows={3} placeholder="8+ years building data products and AI agents in MENA retail. Azure-certified, IIT alum, Dubai-based, available in 1 month." className="input" />
      </Field>
    </div>
  );
}

function GmailStep({
  form,
  update,
  showSecrets,
  setShowSecrets,
}: {
  form: FormState;
  update: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  showSecrets: boolean;
  setShowSecrets: (v: boolean) => void;
}) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-ink">Gmail App Password</h2>
      <p className="mt-2 text-sm text-slate-600">
        Emails are sent <em>from</em> your Gmail so replies land in <em>your</em> inbox.
      </p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label="Gmail address" required>
          <input type="email" value={form.gmail} onChange={(e) => update("gmail", e.target.value)} className="input" />
        </Field>
        <Field label="16-digit App Password" required hint='Looks like "xxxx xxxx xxxx xxxx"'>
          <input type={showSecrets ? "text" : "password"} value={form.appPassword} onChange={(e) => update("appPassword", e.target.value)} className="input" autoComplete="off" spellCheck={false} placeholder="xxxx xxxx xxxx xxxx" />
        </Field>
      </div>
      <label className="mt-3 inline-flex items-center gap-2 text-xs text-slate-600">
        <input type="checkbox" checked={showSecrets} onChange={(e) => setShowSecrets(e.target.checked)} className="rounded border-slate-300" />
        Show secrets (this screen only)
      </label>
      <div className="mt-7 rounded-2xl bg-cream p-5 ring-1 ring-amber-100">
        <h3 className="text-sm font-bold text-ink">Where to get a free App Password (90 sec)</h3>
        <ol className="mt-3 ml-5 list-decimal space-y-1.5 text-sm text-slate-700">
          <li>Enable 2-Step Verification on{" "}
            <a href="https://myaccount.google.com/security" target="_blank" rel="noopener noreferrer" className="text-accent-strong underline">myaccount.google.com/security</a>.</li>
          <li>Open{" "}
            <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="text-accent-strong underline">myaccount.google.com/apppasswords</a>.</li>
          <li>Name it <em>JobyBots</em> → click <strong>Create</strong>.</li>
          <li>Copy the 16 letters Google shows. Paste above.</li>
        </ol>
      </div>
    </div>
  );
}

function AiStep({
  form,
  update,
  showSecrets,
  setShowSecrets,
}: {
  form: FormState;
  update: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  showSecrets: boolean;
  setShowSecrets: (v: boolean) => void;
}) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-ink">Free AI key (Gemini)</h2>
      <p className="mt-2 text-sm text-slate-600">
        1,500 free calls per day. Scores every job and writes every cover letter.
      </p>
      <div className="mt-5 grid gap-4">
        <Field label="Gemini API key" required>
          <input type={showSecrets ? "text" : "password"} value={form.geminiKey} onChange={(e) => update("geminiKey", e.target.value)} placeholder="AIzaSy…" className="input font-mono" autoComplete="off" spellCheck={false} />
        </Field>
        <Field label="Groq API key (optional fallback, also free)" hint="Used only if Gemini's daily limit is reached.">
          <input type={showSecrets ? "text" : "password"} value={form.groqKey} onChange={(e) => update("groqKey", e.target.value)} placeholder="gsk_…" className="input font-mono" autoComplete="off" spellCheck={false} />
        </Field>
      </div>
      <label className="mt-3 inline-flex items-center gap-2 text-xs text-slate-600">
        <input type="checkbox" checked={showSecrets} onChange={(e) => setShowSecrets(e.target.checked)} className="rounded border-slate-300" />
        Show keys (this screen only)
      </label>
      <div className="mt-7 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-cream p-5 ring-1 ring-amber-100">
          <h3 className="text-sm font-bold text-ink">Get a free Gemini key</h3>
          <ol className="mt-3 ml-5 list-decimal space-y-1 text-sm text-slate-700">
            <li>Open <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-accent-strong underline">aistudio.google.com/apikey</a>.</li>
            <li>Sign in with Google.</li>
            <li>Click <strong>Create API key</strong>.</li>
            <li>Copy and paste above. No card needed.</li>
          </ol>
        </div>
        <div className="rounded-2xl bg-cream p-5 ring-1 ring-amber-100">
          <h3 className="text-sm font-bold text-ink">Get a free Groq key</h3>
          <ol className="mt-3 ml-5 list-decimal space-y-1 text-sm text-slate-700">
            <li>Open <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="text-accent-strong underline">console.groq.com/keys</a>.</li>
            <li>Sign up free (Google or GitHub).</li>
            <li>Click <strong>Create API Key</strong> → name "JobyBots".</li>
            <li>Copy and paste above.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

function TargetingStep({
  form,
  update,
}: {
  form: FormState;
  update: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
}) {
  const all = ["Saudi","Qatar","Oman","Bahrain","India","Singapore","Australia","Canada","UK","Germany","Netherlands","Ireland","Sweden"];
  const selected = new Set(form.secondaryMarkets.split(",").map((s) => s.trim()).filter(Boolean));
  function toggle(m: string) {
    const next = new Set(selected);
    if (next.has(m)) next.delete(m); else next.add(m);
    update("secondaryMarkets", Array.from(next).join(","));
  }
  return (
    <div>
      <h2 className="text-2xl font-bold text-ink">What roles? Where?</h2>
      <p className="mt-2 text-sm text-slate-600">Drives the search. Edit any time in <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">.env</code>.</p>
      <Field className="mt-6" label="Target job titles (comma-separated)" required hint="Add 4–10 variations.">
        <textarea value={form.titles} onChange={(e) => update("titles", e.target.value)} rows={3} className="input" />
      </Field>
      <Field className="mt-4" label="Primary market">
        <select value={form.primaryMarket} onChange={(e) => update("primaryMarket", e.target.value)} className="input">
          {["UAE","Saudi","Qatar","Oman","Bahrain","India","UK"].map((m) => <option key={m}>{m}</option>)}
        </select>
      </Field>
      <div className="mt-6">
        <p className="text-sm font-semibold text-ink">Secondary markets</p>
        <p className="mt-1 text-xs text-slate-500">Search runs everywhere; email blast respects GDPR-strict markets.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {all.map((m) => {
            const on = selected.has(m);
            return (
              <button key={m} type="button" onClick={() => toggle(m)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  on ? "border-accent bg-accent text-white" : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
                }`}>
                {m}
              </button>
            );
          })}
        </div>
      </div>
      <Field className="mt-6" label="Daily email cap" hint="200 is the safe Gmail limit. Lower if Google flags you.">
        <input type="number" min={20} max={500} value={form.dailyCap} onChange={(e) => update("dailyCap", Number(e.target.value) || 200)} className="input" />
      </Field>
    </div>
  );
}

function OptionalStep({
  form,
  update,
}: {
  form: FormState;
  update: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
}) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-ink">
        LinkedIn cookie <span className="text-slate-400">(optional, ~4× reply rate)</span>
      </h2>
      <p className="mt-2 text-sm text-slate-600">
        Without this, JobyBots still works on Bayt, Naukrigulf, GulfTalent,
        Indeed and 40+ career pages. With it, JobyBots emails the actual
        recruiter who posted each LinkedIn job.
      </p>
      <Field className="mt-6" label="li_at cookie value" hint="~200 random chars. We never see it.">
        <textarea value={form.linkedinCookie} onChange={(e) => update("linkedinCookie", e.target.value)} rows={3} placeholder="AQEDA…" className="input font-mono text-xs" autoComplete="off" spellCheck={false} />
      </Field>
      <div className="mt-6 rounded-2xl bg-cream p-5 ring-1 ring-amber-100">
        <h3 className="text-sm font-bold text-ink">How to copy your LinkedIn cookie (60 sec)</h3>
        <ol className="mt-3 ml-5 list-decimal space-y-1.5 text-sm text-slate-700">
          <li>Sign in to <a href="https://www.linkedin.com" target="_blank" rel="noopener noreferrer" className="text-accent-strong underline">linkedin.com</a> in Chrome / Edge.</li>
          <li>Press <kbd className="kbd">F12</kbd> → click <strong>Application</strong>.</li>
          <li><strong>Storage → Cookies → https://www.linkedin.com</strong>.</li>
          <li>Find <code>li_at</code> → double-click Value → <kbd className="kbd">Ctrl+C</kbd>.</li>
          <li>Paste above.</li>
        </ol>
      </div>
      <p className="mt-6 text-xs text-slate-500">
        You can skip this and add it later by editing <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">.env</code>.
      </p>
    </div>
  );
}

function DownloadStep({
  envFile,
  ready,
  zipStatus,
  zipError,
  onDownload,
}: {
  form: FormState;
  envFile: string;
  ready: boolean;
  zipStatus: "idle" | "building" | "ready" | "error";
  zipError: string | null;
  onDownload: () => void;
}) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-ink">Your personalised ZIP is ready</h2>
      <p className="mt-2 text-sm text-slate-600">
        One click. The ZIP contains your <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">.env</code>,
        Windows + macOS install scripts, and a 1-page README. The bot itself
        downloads from GitHub on first run so you always get the latest.
      </p>

      {/* .env preview */}
      <div className="mt-6 rounded-2xl bg-ink p-1">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
          <span className="text-xs font-mono text-white/60">your .env · preview</span>
          <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-emerald-300">● Local-only</span>
        </div>
        <pre className="max-h-72 overflow-auto p-4 text-xs font-mono leading-relaxed text-emerald-200">
{envFile.split("\n").slice(0, 22).join("\n")}
{envFile.split("\n").length > 22 ? "\n…" : ""}
        </pre>
      </div>

      {/* Download */}
      <div className="mt-7 grid gap-4 sm:grid-cols-3">
        <button
          type="button"
          onClick={onDownload}
          disabled={!ready || zipStatus === "building"}
          className={`rounded-2xl px-5 py-4 text-center text-sm font-semibold text-white shadow-sm transition ${
            ready && zipStatus !== "building"
              ? "bg-accent hover:bg-accent-strong"
              : "bg-slate-300 cursor-not-allowed"
          }`}
        >
          {zipStatus === "building" ? "Building ZIP…" :
            zipStatus === "ready"   ? "✓ Downloaded — click for another" :
            "↓ Download personalised ZIP"}
        </button>
        <Link
          href="/install"
          className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-center text-sm font-semibold text-ink transition hover:bg-slate-50"
        >
          See install walkthrough →
        </Link>
        <Link
          href="/dashboard-guide"
          className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-center text-sm font-semibold text-ink transition hover:bg-slate-50"
        >
          See dashboard preview →
        </Link>
      </div>

      {!ready && (
        <p className="mt-3 text-xs text-amber-700">
          Fill the required fields (steps 1–3) to unlock the download. The
          checklist on the right shows what's pending.
        </p>
      )}
      {zipError && (
        <p className="mt-3 text-xs text-red-700">
          Couldn't build ZIP: {zipError}. Email tharakesh.iitp@gmail.com if this persists.
        </p>
      )}

      {/* Next steps */}
      <div className="mt-10 rounded-2xl bg-emerald-50 p-6 ring-1 ring-emerald-200">
        <h3 className="text-sm font-bold text-emerald-900">After download — 3 steps</h3>
        <ol className="mt-3 ml-5 list-decimal space-y-2 text-sm text-emerald-900">
          <li>
            Unzip <code>JobyBots-Personal-*.zip</code> to your <strong>Desktop</strong>.
          </li>
          <li>
            Drop your <code>resume.pdf</code> into the same folder.
          </li>
          <li>
            <strong>Windows:</strong> double-click <code>INSTALL-WINDOWS.bat</code>.<br />
            <strong>Mac:</strong> right-click <code>INSTALL-MAC.command</code> → Open.
          </li>
        </ol>
        <p className="mt-3 text-xs text-emerald-800">
          The bootstrap will fetch the latest JobyBots from GitHub and wire
          everything up. First run takes ~3 minutes.
        </p>
      </div>
    </div>
  );
}

/* ─── Validation ────────────────────────────────────────────────────────── */
function validateStep(step: number, f: FormState): { ok: boolean; message: string } {
  if (step === 1) {
    if (!f.name) return { ok: false, message: "Name is required" };
    if (!f.email) return { ok: false, message: "Email is required" };
    return { ok: true, message: "Looks good" };
  }
  if (step === 2) {
    if (!f.gmail) return { ok: false, message: "Gmail address required" };
    if (!f.appPassword) return { ok: false, message: "App Password required" };
    if (f.appPassword.replace(/\s/g, "").length < 16)
      return { ok: false, message: "App Password should be 16 chars" };
    return { ok: true, message: "Gmail looks valid" };
  }
  if (step === 3) {
    if (!f.geminiKey) return { ok: false, message: "Gemini key required (free)" };
    if (!f.geminiKey.startsWith("AIza"))
      return { ok: false, message: "Gemini keys start with AIza…" };
    return { ok: true, message: "AI ready" };
  }
  if (step === 4) {
    if (!f.titles) return { ok: false, message: "Add at least one role" };
    return { ok: true, message: "Targeting set" };
  }
  if (step === 5) return { ok: true, message: "Optional — skip if unsure" };
  return { ok: true, message: "" };
}

/* ─── .env builder ──────────────────────────────────────────────────────── */
function buildEnv(f: FormState): string {
  const esc = (v: string) => `"${v.replace(/"/g, '\\"').replace(/\n/g, " ")}"`;
  const cleanPwd = f.appPassword.replace(/\s/g, "");
  const cookie = f.linkedinCookie.replace(/\n/g, "").trim();
  return `# ─── Generated by https://jobybots.com/portal ────────────────────
# Built ${new Date().toISOString()}
# This file is on YOUR machine. Never commit it. Never share it.
# Your credentials never reached our servers — assembled in your browser.

# ─── REQUIRED: Identity ──────────────────────────────────────────
USER_NAME=${esc(f.name)}
USER_EMAIL=${f.email}
USER_PHONE=${f.phone}
USER_LINKEDIN=${f.linkedin}
USER_LOCATION=${esc(f.location)}
USER_VISA=${esc(f.visa)}
USER_NOTICE=${esc(f.notice)}
RESUME_PATH=./resume.pdf
USER_SUMMARY=${esc(f.summary || "Open to roles that match the title list below.")}

# ─── REQUIRED: Gmail SMTP ────────────────────────────────────────
GMAIL_ADDRESS=${f.gmail}
GMAIL_APP_PASSWORD=${cleanPwd}

# ─── Target roles ────────────────────────────────────────────────
TARGET_TITLES=${esc(f.titles)}

# ─── Markets ─────────────────────────────────────────────────────
PRIMARY_MARKET=${f.primaryMarket}
SECONDARY_MARKETS=${esc(f.secondaryMarkets)}

# ─── Rate limits ─────────────────────────────────────────────────
DAILY_EMAIL_CAP=${f.dailyCap}
HOURLY_JOB_LIMIT=20
MATCH_THRESHOLD=50
RUN_INTERVAL_MINUTES=30
MIN_DELAY_SEC=30
MAX_DELAY_SEC=120

# ─── Sources ─────────────────────────────────────────────────────
ENABLE_LINKEDIN_SEARCH=true
ENABLE_INDEED=true
ENABLE_NAUKRIGULF=true
ENABLE_BAYT=true
ENABLE_GULFTALENT=true
ENABLE_REMOTEOK=true
ENABLE_COMPANY_CAREERS=true

# ─── Follow-ups ──────────────────────────────────────────────────
ENABLE_FOLLOWUP=true
FOLLOWUP_DAYS=7

# ─── AI providers (free tier) ────────────────────────────────────
GEMINI_API_KEY=${f.geminiKey}
GEMINI_MODEL=gemini-flash-latest
GROQ_API_KEY=${f.groqKey}
GROQ_MODEL=llama-3.3-70b-versatile
AI_ENABLED=true
AI_MIN_MATCH=60

# ─── Email finder ────────────────────────────────────────────────
EMAIL_FINDER_TIER=${cookie ? "t2" : "t1"}
SMTP_PROBE_ENABLED=true
LINKEDIN_COOKIE=${cookie}
LINKEDIN_FINDER_DAILY_CAP=30

# ─── Misc ────────────────────────────────────────────────────────
DAILY_SUMMARY_HOUR=9
LOG_LEVEL=INFO
`;
}

/* ─── Bootstrap script generators ───────────────────────────────────────── */
function windowsBootstrap(): string {
  return `@echo off
setlocal EnableDelayedExpansion
title JobyBots installer (Windows)
color 0A
cls
echo.
echo  =======================================================
echo   JOBYBOTS - Windows installer (personalised)
echo   This will:
echo     1. Download the latest JobyBots from GitHub
echo     2. Copy your .env into the JobyBot folder
echo     3. Run the standard setup (Python + deps + health check)
echo  =======================================================
echo.

REM Where to install
set "INSTALL_DIR=%~dp0JobyBot"
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"

REM Fetch latest main branch zip
set "ZIP_URL=https://codeload.github.com/muttonkodibiriyani/Jobybot/zip/refs/heads/main"
set "ZIP_FILE=%~dp0jobybot-main.zip"

echo Downloading latest JobyBots from GitHub...
powershell -Command "& {try { Invoke-WebRequest -Uri '%ZIP_URL%' -OutFile '%ZIP_FILE%' -UseBasicParsing } catch { Write-Host $_; exit 1 }}"
if errorlevel 1 (
  echo.
  echo ERROR: Could not download. Check your internet connection.
  pause
  exit /b 1
)

echo Extracting...
powershell -Command "Expand-Archive -Force -Path '%ZIP_FILE%' -DestinationPath '%~dp0_temp'"
if errorlevel 1 (
  echo ERROR: Could not extract. Make sure PowerShell is available.
  pause
  exit /b 1
)

REM Move the inner folder contents to INSTALL_DIR
xcopy /E /I /Y "%~dp0_temp\\Jobybot-main\\*" "%INSTALL_DIR%\\" >nul
rmdir /S /Q "%~dp0_temp"
del "%ZIP_FILE%"

REM Copy our personalised .env
copy /Y "%~dp0.env" "%INSTALL_DIR%\\.env" >nul
echo Your .env has been copied into %INSTALL_DIR%

REM Hand off to the standard setup
echo.
echo Handing off to SETUP_FOR_FRIENDS.bat ...
cd /d "%INSTALL_DIR%"
call SETUP_FOR_FRIENDS.bat

endlocal
`;
}

function macBootstrap(): string {
  return `#!/usr/bin/env bash
# JobyBots installer (macOS — personalised)
set -e

YEL='\\033[1;33m'
GRN='\\033[0;32m'
CYN='\\033[0;36m'
RED='\\033[0;31m'
NC='\\033[0m'

SCRIPT_DIR="$( cd "$( dirname "\${BASH_SOURCE[0]}" )" && pwd )"
INSTALL_DIR="$SCRIPT_DIR/JobyBot"

clear
printf "\${YEL}\\n"
printf "  =======================================================\\n"
printf "   JOBYBOTS - macOS installer (personalised)\\n"
printf "   This will:\\n"
printf "     1. Download the latest JobyBots from GitHub\\n"
printf "     2. Copy your .env into the JobyBot folder\\n"
printf "     3. Run the standard setup (Python + deps + health check)\\n"
printf "  =======================================================\\n"
printf "\${NC}\\n"

# Fetch latest main branch tarball
ZIP_URL="https://codeload.github.com/muttonkodibiriyani/Jobybot/zip/refs/heads/main"
ZIP_FILE="$SCRIPT_DIR/jobybot-main.zip"

printf "\${CYN}Downloading JobyBots...\${NC}\\n"
if ! curl -L -o "$ZIP_FILE" "$ZIP_URL"; then
  printf "\${RED}ERROR: download failed.\${NC} Check your internet.\\n"
  read -rp "Press ENTER to exit..."
  exit 1
fi

printf "\${CYN}Extracting...\${NC}\\n"
TMP_DIR="$SCRIPT_DIR/_temp"
mkdir -p "$TMP_DIR"
unzip -q -o "$ZIP_FILE" -d "$TMP_DIR"
mkdir -p "$INSTALL_DIR"
cp -R "$TMP_DIR"/Jobybot-main/. "$INSTALL_DIR/"
rm -rf "$TMP_DIR" "$ZIP_FILE"

cp -f "$SCRIPT_DIR/.env" "$INSTALL_DIR/.env"
chmod 600 "$INSTALL_DIR/.env" || true
printf "\${GRN}[OK]\${NC} Your .env has been copied into $INSTALL_DIR\\n"

# Make the mac/*.command scripts executable
chmod +x "$INSTALL_DIR/mac"/*.command 2>/dev/null || true

printf "\\n\${CYN}Handing off to mac/Setup.command...\${NC}\\n"
cd "$INSTALL_DIR"
bash mac/Setup.command
`;
}

function readmeContent(f: FormState, stamp: string): string {
  return `JOBYBOTS - PERSONAL INSTALLER
=============================
Built for: ${f.name || "(name not set)"}
Email:     ${f.email}
Date:      ${stamp}

WHAT'S IN THIS ZIP
------------------
  .env                  Your personalised configuration (KEEP PRIVATE).
  INSTALL-WINDOWS.bat   Double-click this on Windows 10/11.
  INSTALL-MAC.command   Right-click → Open on macOS 12+.
  README.txt            This file.
  HOW_TO_RUN.txt        3-step cheat sheet.

WHAT THE INSTALLER DOES
-----------------------
  1. Downloads the latest JobyBots from
     https://github.com/muttonkodibiriyani/Jobybot
  2. Copies your .env into the JobyBot/ folder.
  3. Runs the standard setup (Python detection, virtual env,
     pip install, Gmail health check).
  4. Hands off to the menu — you can start a cycle, schedule it,
     or open the dashboard from there.

NEXT STEPS AFTER INSTALL
------------------------
  - Drop your resume.pdf into the JobyBot/ folder.
  - Windows: double-click START_AUTOSCHEDULE.bat for 24/7 mode.
  - Mac:     double-click mac/StartAutoSchedule.command.
  - Open data/dashboard.html any time to see what the bot's doing.

NEED HELP
---------
  Email:    tharakesh.iitp@gmail.com  (Mon-Sat, ~2hr reply)
  Website:  https://jobybots.com/install   (10-step visual guide)
  Docs:     https://jobybots.com/security  (why this is safe)
  Refunds:  https://jobybots.com/refund    (7-day, no questions)

WHY YOU CAN TRUST THIS
----------------------
  - .env was assembled in YOUR browser. No server saw it.
  - The bootstrap downloads JobyBots from a public GitHub repo,
    so you can audit every line at github.com/muttonkodibiriyani/Jobybot
  - No admin / sudo / UAC is ever requested.
  - To uninstall: delete the JobyBot/ folder. That's it.
`;
}

function howToRun(): string {
  return `JOBYBOTS QUICK-START
====================

WINDOWS (10 or 11)
------------------
  1. Right-click this folder → Extract All.
  2. Drop your resume.pdf into the same folder.
  3. Double-click INSTALL-WINDOWS.bat.
  4. Wait ~3 min. Done.

MACOS (12+, Intel or Apple Silicon)
-----------------------------------
  1. Double-click the .zip to extract.
  2. Drop your resume.pdf into the same folder.
  3. Right-click INSTALL-MAC.command → Open.
     (macOS will ask "are you sure?" once. Click Open.)
  4. Wait ~3 min. Done.

AFTER IT'S RUNNING
------------------
  - Watch the dashboard:  open JobyBot/data/dashboard.html
  - Run a cycle now:      double-click RUN_BOT_NOW.bat (Win)
                                       mac/RunBotNow.command (Mac)
  - Schedule 24/7:        START_AUTOSCHEDULE.bat (Win)
                          mac/StartAutoSchedule.command (Mac)
  - Stop the bot:         option 3 in JOBYBOT.bat
                          or mac/StopBot.command

PROBLEMS?
---------
  Email tharakesh.iitp@gmail.com  -  founder reads everything.
`;
}
