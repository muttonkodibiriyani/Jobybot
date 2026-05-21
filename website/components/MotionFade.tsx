"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Premium scroll-triggered fade + lift, with reduced-motion fallback and
 * a configurable stagger so several MotionFade siblings animate as a chord.
 */
export function MotionFade({
  children,
  delay = 0,
  y = 24,
  className,
  once = true,
  duration = 0.6,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  once?: boolean;
  duration?: number;
}) {
  const reduce = useReducedMotion();
  const variants: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : y },
    show:   { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once, amount: 0.2 }}
      transition={{
        duration: reduce ? 0 : duration,
        delay: reduce ? 0 : delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      variants={variants}
    >
      {children}
    </motion.div>
  );
}

/**
 * Parallax wrapper — child moves slightly slower than the page, on scroll.
 * Cheap CSS-transform only — no JS rAF loops, so it's safe for Lighthouse.
 */
export function MotionParallax({
  children,
  strength = 30,
  className,
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={{ y: 0 }}
      whileInView={{ y: reduce ? 0 : -strength }}
      viewport={{ amount: 0.1, margin: "-10% 0px -10% 0px" }}
      transition={{ duration: 1.2, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Magnetic / hover-springy wrapper for primary CTAs. Use sparingly.
 */
export function MotionMagnet({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      whileHover={{ scale: 1.04, y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 320, damping: 22 }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Number that counts up when scrolled into view.
 */
export function MotionCount({
  value,
  suffix = "",
  duration = 1.6,
  className,
}: {
  value: number;
  suffix?: string;
  duration?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <span className={className}>{value}{suffix}</span>;
  return (
    <motion.span
      className={className}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.4 }}
    >
      <motion.span
        initial={{ scale: 0.7 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration, ease: [0.22, 1, 0.36, 1] }}
      >
        {value}
      </motion.span>
      {suffix}
    </motion.span>
  );
}
