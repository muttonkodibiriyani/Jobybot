"use client";
import { useEffect, useRef, useState } from "react";
import clsx from "clsx";

/**
 * Wrap any content in <Reveal> to make it fade-up into view when it
 * enters the viewport. Pure IntersectionObserver — no extra deps.
 *
 *   <Reveal delay={1}>...</Reveal>     // 80ms stagger
 *   <Reveal delay={2}>...</Reveal>     // 160ms stagger
 *   <Reveal as="li">...</Reveal>       // semantic override
 */
export function Reveal({
  children,
  delay = 0,
  className,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  delay?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  className?: string;
  as?: keyof React.JSX.IntrinsicElements;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setVisible(true);
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -10% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const Component = Tag as React.ElementType;
  return (
    <Component
      ref={ref as React.RefObject<HTMLElement>}
      className={clsx(
        "reveal",
        delay > 0 && `reveal-delay-${delay}`,
        visible && "is-visible",
        className
      )}
    >
      {children}
    </Component>
  );
}
