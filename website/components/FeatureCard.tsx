import clsx from "clsx";

/**
 * Apple-style feature card. Soft white surface, generous spacing,
 * subtle shadow that lifts on hover. The accent dot in the corner
 * appears only on hover for that "this is alive" feel.
 */
export function FeatureCard({
  emoji,
  title,
  desc,
  className,
}: {
  emoji: string;
  title: string;
  desc: string;
  className?: string;
}) {
  return (
    <article
      className={clsx(
        "group relative flex h-full flex-col overflow-hidden rounded-3xl",
        "border border-surface-divider bg-surface-raised p-7 sm:p-8",
        "shadow-xs transition-all duration-500",
        "hover:-translate-y-1 hover:border-accent/30 hover:shadow-card",
        className
      )}
    >
      {/* Animated accent dot — top right, hidden until hover */}
      <span className="pointer-events-none absolute right-6 top-6 h-2 w-2 rounded-full bg-accent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      {/* Soft inner glow on hover */}
      <span
        className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(closest-side, rgba(255,107,0,0.15), transparent)",
        }}
      />

      <div className="text-3xl">{emoji}</div>
      <h3 className="mt-5 font-display text-xl font-semibold tracking-tight text-ink">
        {title}
      </h3>
      <p className="mt-2.5 text-[15px] leading-relaxed text-ink-muted">
        {desc}
      </p>
    </article>
  );
}
