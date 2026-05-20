import clsx from "clsx";

/**
 * The HUGE animated gear that anchors the hero on the new homepage.
 *
 * Three SVG layers rotating at different speeds + an orbit ring of
 * floating dots = "the AI is alive and working" feel. Apple-style:
 * subtle, premium, never gimmicky.
 *
 * - main gear (orange, slow):   18s rotation
 * - inner ring (dark, medium):   9s opposite rotation
 * - sparkle gear (small):        4s fast spin
 * - 6 orbiting dots:            30s orbit around the centerpiece
 * - radial halo behind it all:   pulses every 4s
 */
export function HeroGear({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        // Constrained max width so the gear never overflows the column on
        // 13-15" laptops. Min height keeps it visible on mobile too.
        "relative mx-auto flex aspect-square w-full max-w-[520px] items-center justify-center",
        className
      )}
      aria-hidden="true"
    >
      {/* Halo — soft radial glow that pulses */}
      <div
        className="absolute inset-0 animate-halo rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, rgba(255,107,0,0.22), rgba(255,140,58,0.06) 55%, transparent 75%)",
        }}
      />

      {/* Orbiting dots — 6 dots circling at 220px radius */}
      <div className="absolute inset-0">
        {Array.from({ length: 6 }).map((_, i) => (
          <span
            key={i}
            className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent shadow-[0_0_18px_rgba(255,107,0,0.55)] animate-orbit-30"
            style={{
              animationDelay: `${-(i * 5)}s`,
              opacity: i % 2 === 0 ? 1 : 0.65,
            }}
          />
        ))}
      </div>

      {/* Main gear — orange, slow rotation */}
      <svg
        viewBox="-110 -110 220 220"
        className="absolute inset-0 h-full w-full animate-gear-spin-slow drop-shadow-[0_24px_48px_rgba(255,107,0,0.18)]"
      >
        <defs>
          <linearGradient id="gear-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FF8C3A" />
            <stop offset="50%" stopColor="#FF6B00" />
            <stop offset="100%" stopColor="#E85D00" />
          </linearGradient>
          <radialGradient id="gear-glow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* 12 teeth */}
        {Array.from({ length: 12 }).map((_, i) => (
          <rect
            key={i}
            x={-10}
            y={-100}
            width={20}
            height={28}
            rx={5}
            fill="url(#gear-grad)"
            transform={`rotate(${(i * 360) / 12})`}
          />
        ))}
        {/* outer ring */}
        <circle cx={0} cy={0} r={76} fill="url(#gear-grad)" />
        {/* inner hole — white */}
        <circle cx={0} cy={0} r={34} fill="#FFFFFF" />
        {/* white sheen */}
        <circle cx={0} cy={0} r={76} fill="url(#gear-glow)" />
        {/* subtle inner accent ring */}
        <circle cx={0} cy={0} r={34} stroke="#FFFFFF" strokeWidth={2} fill="none" opacity={0.4} />
      </svg>

      {/* Inner counter-rotating dark ring with notches */}
      <svg
        viewBox="-60 -60 120 120"
        className="absolute h-[55%] w-[55%] animate-gear-spin-reverse"
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <rect
            key={i}
            x={-3}
            y={-52}
            width={6}
            height={10}
            rx={2}
            fill="#1D1D1F"
            transform={`rotate(${(i * 360) / 8})`}
          />
        ))}
        <circle cx={0} cy={0} r={42} fill="#1D1D1F" />
        <circle cx={0} cy={0} r={28} fill="#FFFFFF" />
      </svg>

      {/* Center J monogram */}
      <div className="relative flex h-[28%] w-[28%] items-center justify-center">
        <svg viewBox="0 0 64 64" className="h-full w-full">
          <defs>
            <linearGradient id="center-bg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#1D1D1F" />
              <stop offset="1" stopColor="#2C2C2E" />
            </linearGradient>
          </defs>
          <rect width="64" height="64" rx="16" fill="url(#center-bg)" />
          <rect x="22" y="13" width="22" height="7" rx="3.5" fill="#FFFFFF" />
          <path
            d="M 36.5 17 L 36.5 38 Q 36.5 48 26.5 48 Q 18 48 18 39"
            stroke="#FFFFFF"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <circle cx="52" cy="12" r="4.5" fill="#FF6B00" />
        </svg>
      </div>

      {/* Tiny fast-spinning sparkle gear top-right */}
      <svg
        viewBox="-32 -32 64 64"
        className="absolute right-[8%] top-[6%] h-[15%] w-[15%] animate-gear-spin-fast"
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <rect
            key={i}
            x={-3}
            y={-28}
            width={6}
            height={8}
            rx={1.5}
            fill="#FF6B00"
            transform={`rotate(${(i * 360) / 8})`}
          />
        ))}
        <circle cx={0} cy={0} r={20} fill="#FF6B00" />
        <circle cx={0} cy={0} r={10} fill="#FFFFFF" />
      </svg>

      {/* Sparkle dots scattered */}
      <span className="absolute left-[10%] top-[18%] h-2 w-2 rounded-full bg-accent animate-fade-in" />
      <span className="absolute bottom-[20%] left-[8%] h-1.5 w-1.5 rounded-full bg-ink" />
      <span className="absolute right-[14%] bottom-[10%] h-2 w-2 rounded-full bg-accent" />
    </div>
  );
}
