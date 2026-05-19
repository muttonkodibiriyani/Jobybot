import clsx from "clsx";

type LogoProps = {
  className?: string;
  variant?: "light" | "dark";
  showWordmark?: boolean;
  size?: "sm" | "md" | "lg";
};

const sizes = {
  sm: { icon: 28, text: "text-lg" },
  md: { icon: 36, text: "text-xl" },
  lg: { icon: 44, text: "text-2xl" },
};

export function Logo({
  className,
  variant = "dark",
  showWordmark = true,
  size = "md",
}: LogoProps) {
  const s = sizes[size];
  const fg = variant === "light" ? "#FFFFFF" : "#0B0B0B";
  const accent = "#FF6B00";

  return (
    <div className={clsx("flex items-center gap-2.5", className)}>
      <svg
        width={s.icon}
        height={s.icon}
        viewBox="0 0 48 48"
        fill="none"
        aria-hidden
        className="shrink-0"
      >
        <circle cx="24" cy="24" r="22" stroke={fg} strokeWidth="2" opacity="0.12" />
        <circle cx="24" cy="24" r="14" stroke={accent} strokeWidth="2" opacity="0.35" />
        <circle cx="24" cy="24" r="6" fill={accent} />
        <path
          d="M14 32h20a2 2 0 002-2v-8a2 2 0 00-2-2H18l-4 4v8a2 2 0 002 2z"
          stroke={fg}
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path d="M18 22v-4a6 6 0 0112 0v4" stroke={fg} strokeWidth="2" strokeLinecap="round" />
      </svg>
      {showWordmark ? (
        <span className="flex flex-col leading-none">
          <span
            className={clsx("font-bold tracking-tight", s.text)}
            style={{ color: fg }}
          >
            Jobybot
          </span>
          <span
            className="text-[10px] font-medium uppercase tracking-widest opacity-70"
            style={{ color: fg }}
          >
            Search · Apply · Win
          </span>
        </span>
      ) : null}
    </div>
  );
}

