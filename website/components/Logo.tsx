import clsx from "clsx";

type LogoProps = {
  className?: string;
  variant?: "light" | "dark";
  size?: "sm" | "md" | "lg" | "xl";
  /** When true, render larger hero version with extended wordmark + tagline. */
  hero?: boolean;
  /** When false, omit the rotating gear (useful for tight headers if needed). */
  withGear?: boolean;
};

const markSize = { sm: 28, md: 36, lg: 48, xl: 72 };
const fontSize = { sm: 16, md: 20, lg: 28, xl: 44 };

/**
 * JobyBots brand logo — three pieces, left → right:
 *
 *   [ rotating gear ]  [ J monogram in rounded square ]  [ Joby**Bots** wordmark ]
 *
 * The gear (orange, slowly spinning) is the "O" that represents JobyBots
 * actively working / AI in motion. The J stays exactly as before. The
 * wordmark closes it out.
 *
 * All inline SVG — no PNG dependencies, scales perfectly from favicon to hero.
 */
export function Logo({
  className,
  variant = "dark",
  size = "md",
  hero = false,
  withGear = true,
}: LogoProps) {
  const m = hero ? markSize.xl : markSize[size];
  const fg = variant === "light" ? "#FFFFFF" : "#0B0B0B";
  const bg = "#0B0B0B";
  const accent = "#FF6B00";
  const ws = hero ? fontSize.xl : fontSize[size];

  return (
    <div className={clsx("inline-flex items-center", className)} style={{ gap: m * 0.32 }}>
      {withGear ? <GearMark size={Math.round(m * 0.95)} accent={accent} variant={variant} /> : null}
      <BrandMark size={m} bg={bg} accent={accent} />
      <div className="flex flex-col leading-none">
        <span
          className="font-extrabold tracking-tight"
          style={{ color: fg, fontSize: ws, letterSpacing: "-0.02em" }}
        >
          Joby<span style={{ color: accent }}>Bots</span>
        </span>
        {hero ? (
          <span
            className="mt-2 text-sm font-medium opacity-60"
            style={{ color: fg, letterSpacing: "0.04em" }}
          >
            AI Job Hunter · Tailored to your résumé · 24/7
          </span>
        ) : (
          <span
            className="mt-0.5 font-medium uppercase opacity-60"
            style={{
              color: fg,
              fontSize: Math.max(9, ws * 0.42),
              letterSpacing: "0.18em",
            }}
          >
            AI Job Hunter
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Rotating gear icon. The 12-tooth gear represents JobyBots actively
 * working / the AI in motion. Spins continuously via inline CSS so it
 * works in Server Components without `use client`.
 */
export function GearMark({
  size = 36,
  accent = "#FF6B00",
  variant = "dark",
  className,
}: {
  size?: number;
  accent?: string;
  variant?: "light" | "dark";
  className?: string;
}) {
  // Color choice: on dark backgrounds use orange gear, on light backgrounds
  // use the same orange — keeps the brand instantly recognizable everywhere.
  const ring = accent;
  const hole = variant === "light" ? "#0B0B0B" : "#FFFFFF";

  return (
    <svg
      width={size}
      height={size}
      viewBox="-32 -32 64 64"
      fill="none"
      aria-hidden="true"
      className={clsx("shrink-0 jobybots-gear", className)}
      style={{
        // Inline keyframe via animation shorthand — works without external CSS.
        animation: "jobybots-gear-spin 8s linear infinite",
        transformOrigin: "center",
      }}
    >
      {/* 12 trapezoidal teeth radiating from center */}
      {Array.from({ length: 12 }).map((_, i) => (
        <rect
          key={i}
          x={-3.5}
          y={-30}
          width={7}
          height={9}
          rx={1.5}
          fill={ring}
          transform={`rotate(${(i * 360) / 12})`}
        />
      ))}
      {/* Outer ring */}
      <circle cx={0} cy={0} r={22} fill={ring} />
      {/* Inner hole — the "O" */}
      <circle cx={0} cy={0} r={10} fill={hole} />
      {/* Subtle inner accent ring for depth */}
      <circle cx={0} cy={0} r={10} stroke={ring} strokeWidth={1.2} fill="none" opacity={0.5} />
    </svg>
  );
}

/**
 * Standalone J monogram in a rounded dark square. Used inside Logo, also
 * exported so other components (favicon backups, OG image, etc.) can reuse it.
 */
export function BrandMark({
  size = 56,
  bg = "#0B0B0B",
  accent = "#FF6B00",
  className,
}: {
  size?: number;
  bg?: string;
  accent?: string;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      className={clsx("shrink-0", className)}
    >
      <defs>
        <linearGradient id="jb-bg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={bg} />
          <stop offset="1" stopColor="#1f2024" />
        </linearGradient>
        <linearGradient id="jb-accent" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FF8C3A" />
          <stop offset="1" stopColor={accent} />
        </linearGradient>
      </defs>

      <rect width="64" height="64" rx="16" fill="url(#jb-bg)" />

      {/* J letter: crossbar + descender with hook */}
      <rect x="22" y="13" width="22" height="7" rx="3.5" fill="#FFFFFF" />
      <path
        d="M 36.5 17 L 36.5 38 Q 36.5 48 26.5 48 Q 18 48 18 39"
        stroke="#FFFFFF"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* AI pulse: small accent arc + dot top-right (suggests motion / signal) */}
      <path
        d="M 47 18 Q 53 14 53 22"
        stroke="url(#jb-accent)"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        opacity="0.9"
      />
      <circle cx="52" cy="12" r="4.5" fill="url(#jb-accent)" />
    </svg>
  );
}
