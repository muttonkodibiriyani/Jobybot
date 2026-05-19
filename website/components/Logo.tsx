import clsx from "clsx";
import Image from "next/image";

type LogoProps = {
  className?: string;
  variant?: "light" | "dark";
  size?: "sm" | "md" | "lg" | "xl";
  /** When true, render the large HD PNG (hero); otherwise compact inline mark. */
  hero?: boolean;
};

const heights = { sm: 32, md: 40, lg: 56, xl: 96 };
const widths = { sm: 128, md: 160, lg: 224, xl: 384 };

export function Logo({
  className,
  variant = "dark",
  size = "md",
  hero = false,
}: LogoProps) {
  const h = heights[size];
  const w = widths[size];
  const fg = variant === "light" ? "#FFFFFF" : "#0B0B0B";
  const accent = "#FF6B00";

  if (hero) {
    return (
      <Image
        src="/jobybots-logo.png"
        alt="JobyBots — Your AI Job Hunter. 24/7. On Your Laptop."
        width={w * 4}
        height={h * 2}
        priority
        className={clsx("h-auto w-full max-w-[640px]", className)}
      />
    );
  }

  return (
    <div className={clsx("flex items-center gap-2.5", className)}>
      <svg
        width={h * 0.9}
        height={h * 0.9}
        viewBox="0 0 48 48"
        fill="none"
        aria-hidden
        className="shrink-0"
      >
        <rect x="6" y="14" width="36" height="24" rx="6" fill={fg} />
        <rect x="22" y="6" width="4" height="8" rx="2" fill={fg} />
        <circle cx="26" cy="6" r="3" fill={accent} />
        <circle cx="18" cy="26" r="2.5" fill="#FFFFFF" />
        <circle cx="30" cy="26" r="2.5" fill={accent} />
        <rect x="20" y="32" width="8" height="2" rx="1" fill="#FFFFFF" />
      </svg>
      <span className="flex flex-col leading-none">
        <span
          className="font-extrabold tracking-tight"
          style={{ color: fg, fontSize: size === "sm" ? 18 : 22 }}
        >
          Joby<span style={{ color: accent }}>Bots</span>
        </span>
        <span
          className="mt-0.5 text-[10px] font-medium uppercase tracking-widest opacity-70"
          style={{ color: fg }}
        >
          AI Job Hunter · 24/7
        </span>
      </span>
    </div>
  );
}
