import Link from "next/link";

export const metadata = {
  title: "See Jobybot in action — Demo video",
  description:
    "Watch how Jobybot searches LinkedIn, Indeed, Bayt every hour and emails recruiters tailored applications in real time.",
};

export default function DemoPage() {
  const videoUrl = process.env.NEXT_PUBLIC_DEMO_VIDEO_URL ?? "";

  return (
    <div className="mx-auto max-w-page section-pad">
      <div className="mx-auto max-w-3xl text-center">
        <p className="eyebrow">Watch · 90 seconds</p>
        <h1 className="h1 mt-2">See Jobybot apply to jobs in real time</h1>
        <p className="lead mt-4">
          From clean install to first 50 applications — sped-up screen recording
          of an actual cycle.
        </p>
      </div>

      <div className="card mx-auto mt-10 max-w-3xl border-2 border-ink/5 p-2">
        <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-ink">
          {videoUrl ? (
            <iframe
              src={videoUrl}
              title="Jobybot demo"
              className="absolute inset-0 h-full w-full"
              allow="accelerometer; autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              loading="lazy"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center text-white">
              <div className="text-6xl">▶</div>
              <p className="mt-4 text-lg font-semibold">Demo video coming soon</p>
              <p className="mt-1 text-sm text-white/60">
                We&apos;ll post a 90-second walkthrough here. Set
                NEXT_PUBLIC_DEMO_VIDEO_URL in your .env to embed a YouTube or Vimeo
                video.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto mt-12 max-w-3xl grid gap-6 sm:grid-cols-3">
        <Step n="1" title="Install" desc="One Windows batch file. ~3 minutes total." />
        <Step n="2" title="Auto-cycle" desc="Every hour: search → match → email." />
        <Step n="3" title="Track" desc="Live dashboard shows every send + bounce." />
      </div>

      <div className="mt-12 text-center">
        <Link href="/pricing" className="btn-primary">Get Jobybot Pro</Link>
        <p className="mt-3 text-sm text-ink-muted">
          Or try the open-source community edition on GitHub.
        </p>
      </div>
    </div>
  );
}

function Step({ n, title, desc }: { n: string; title: string; desc: string }) {
  return (
    <div className="card">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-sm font-bold text-white">
        {n}
      </div>
      <h3 className="mt-4 text-base font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-ink-muted">{desc}</p>
    </div>
  );
}
