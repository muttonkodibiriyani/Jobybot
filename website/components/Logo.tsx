import clsx from "clsx";

type LogoProps = {
  className?: string;
  variant?: "light" | "dark";
  size?: "sm" | "md" | "lg" | "xl";
  /** When true, render larger hero version with extended wordmark + tagline. */
  hero?: boolean;
};

const markSize = { sm: 28, md: 36, lg: 48, xl: 72 };
const fontSize = { sm: 16, md: 20, lg: 28, xl: 44 };

/**
 * JobyBots brand logo — clean geometric mark + wordmark.
 * No bot illustration. The mark is a stylized "J" with a motion accent
 * (small orange arc/dot) representing AI activity.
 */
export function Logo({
  className,
  variant = "dark",
  size = "md",
  hero = false,
}: LogoProps) {
  const m = hero ? markSize.xl : markSize[size];
  const fg = variant === "light" ? "#FFFFFF" : "#0B0B0B";
  const bg = variant === "light" ? "#0B0B0B" : "#0B0B0B";
  const accent = "#FF6B00";
  const ws = hero ? fontSize.xl : fontSize[size];

  return (
    <div className={clsx("inline-flex items-center", className)} style={{ gap: m * 0.35 }}>
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
 * Standalone brand mark — square monogram of "J" with AI motion accent.
 * Use this when the wordmark would be too wide (favicon, mobile, OG image fallback).
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

      {/* Rounded square card */}
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
