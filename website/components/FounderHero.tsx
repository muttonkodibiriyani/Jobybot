"use client";

import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

/**
 * Material-3-Expressive "wow" hero for the /about page.
 *
 * Three layered surprises that all run on a single mousemove:
 *  1. A 3D tilt founder card that follows your cursor with spring physics.
 *  2. A radial spotlight that lights up the surface where your cursor lands.
 *  3. An animated mesh gradient backdrop that breathes slowly.
 *
 * Plus a typewriter that introduces the founder line by line.
 *
 * Honours prefers-reduced-motion. Renders a calm static fallback if the
 * visitor has the OS-level setting on.
 */
export function FounderHero() {
  const reduce = useReducedMotion();

  // mouse motion values (only used when motion is allowed)
  const mx = useMotionValue(0);
  const my = useMotionValue(0);

  // spring-smoothed rotations
  const rotY = useSpring(useTransform(mx, [-0.5, 0.5], [-9, 9]), {
    stiffness: 180, damping: 18, mass: 0.6,
  });
  const rotX = useSpring(useTransform(my, [-0.5, 0.5], [9, -9]), {
    stiffness: 180, damping: 18, mass: 0.6,
  });

  // raw mouse position for the spotlight
  const spotX = useSpring(useTransform(mx, [-0.5, 0.5], ["0%", "100%"]), {
    stiffness: 220, damping: 22,
  });
  const spotY = useSpring(useTransform(my, [-0.5, 0.5], ["0%", "100%"]), {
    stiffness: 220, damping: 22,
  });

  const cardRef = useRef<HTMLDivElement | null>(null);
  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduce || !cardRef.current) return;
    const r = cardRef.current.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top)  / r.height - 0.5);
  };
  const onLeave = () => {
    if (reduce) return;
    mx.set(0);
    my.set(0);
  };

  const lines = [
    "Hi, I'm Tharakesh.",
    "I quit Alshaya in Feb 2026 to find my next role.",
    "Two hundred manual cold emails. Six replies.",
    "So I built JobyBots.",
  ];

  return (
    <section className="relative isolate overflow-hidden bg-gradient-to-b from-cream via-white to-cream py-24 sm:py-32">
      {/* Animated mesh backdrop */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70"
        initial={false}
        animate={reduce ? {} : { backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
        transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
        style={{
          background:
            "radial-gradient(60% 50% at 20% 30%, rgba(255,107,0,0.18) 0%, transparent 70%)," +
            "radial-gradient(50% 40% at 80% 70%, rgba(60,108,255,0.16) 0%, transparent 70%)," +
            "radial-gradient(70% 60% at 50% 100%, rgba(255,180,80,0.14) 0%, transparent 70%)",
          backgroundSize: "200% 200%",
        }}
      />
      {/* Subtle floating orb (purely decorative depth) */}
      {!reduce && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -top-10 right-1/4 h-72 w-72 rounded-full bg-accent/20 blur-3xl"
          animate={{ y: [0, 18, 0], x: [0, -12, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      <div className="relative mx-auto grid max-w-page items-center gap-12 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
        {/* LEFT — the founder card */}
        <div className="relative lg:col-span-5" style={{ perspective: 1000 }}>
          <motion.div
            ref={cardRef}
            onMouseMove={onMove}
            onMouseLeave={onLeave}
            style={{ rotateX: reduce ? 0 : rotX, rotateY: reduce ? 0 : rotY, transformStyle: "preserve-3d" }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="relative aspect-[4/5] w-full max-w-md mx-auto rounded-[2rem] border border-white/40 bg-gradient-to-br from-ink to-[#1c2230] p-8 text-white shadow-[0_30px_80px_-30px_rgba(0,0,0,0.5)]"
          >
            {/* Spotlight (radial follow) */}
            {!reduce && (
              <motion.div
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-[2rem]"
                style={{
                  background: `radial-gradient(280px circle at ${spotX as unknown as string} ${spotY as unknown as string}, rgba(255,140,58,0.30), transparent 60%)`,
                }}
              />
            )}

            {/* Top label */}
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-mono uppercase tracking-[0.18em]">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live · Dubai
              </div>
              <span className="text-[11px] font-mono uppercase tracking-[0.18em] opacity-70">
                Founder
              </span>
            </div>

            {/* Avatar mark — a stylised JB monogram so we don't depend on a real photo */}
            <div
              className="relative mt-8 mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-white text-[44px] font-display font-extrabold text-ink shadow-2xl"
              style={{ transform: "translateZ(40px)" }}
            >
              <span className="bg-gradient-to-br from-accent to-[#FF8C3A] bg-clip-text text-transparent">
                T
              </span>
            </div>

            {/* Name + role */}
            <div className="relative mt-6 text-center" style={{ transform: "translateZ(20px)" }}>
              <p className="font-display text-2xl font-bold">Darapu Tharakeswara Reddy</p>
              <p className="mt-1 text-sm text-white/70">Founder · JobyBots</p>
              <p className="mt-1 text-xs text-white/50 font-mono uppercase tracking-[0.2em]">
                IIT Patna · 7yr Alshaya · MENA
              </p>
            </div>

            {/* Quick stats */}
            <div className="relative mt-8 grid grid-cols-3 gap-3 border-t border-white/10 pt-6 text-center">
              <Stat label="Cold emails" value="200" />
              <Stat label="Replies" value="6" />
              <Stat label="Days to ship v1" value="14" />
            </div>

            {/* Bottom signature */}
            <div className="relative mt-6 flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.18em] opacity-70">
              <span>Built in public</span>
              <span>v2.6 · 2026</span>
            </div>
          </motion.div>
        </div>

        {/* RIGHT — typewriter intro + CTA */}
        <div className="lg:col-span-7">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-accent-strong">
            A letter from the founder
          </p>
          <h1 className="mt-4 font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-ink">
            <Typewriter lines={lines} reducedMotion={!!reduce} />
          </h1>
          <p className="mt-8 max-w-2xl text-lg text-slate-700 leading-relaxed">
            Job-hunting in 2026 broke me first. The wall is real:
            1,200 applicants per LinkedIn post, ATS filters tuned for keywords,
            recruiters drowning in noise. JobyBots is what I wished existed
            during that grind — and what 47 strangers (and counting) trusted me
            to build for them.
          </p>
          <p className="mt-5 max-w-2xl text-lg text-slate-700 leading-relaxed">
            <strong>If you're stuck right now</strong>, this isn't a sales page.
            Scroll a little — you'll meet the version of me who needed this.
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            <a
              href="#dedications"
              className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white transition hover:bg-ink-soft"
            >
              Read the dedication ↓
            </a>
            <a
              href="/install"
              aria-label="See how JobyBots installs in 5 minutes"
              className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-6 py-3 text-sm font-semibold text-ink transition hover:bg-ink/5"
            >
              See it install in 5 minutes
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-display text-2xl font-bold">{value}</p>
      <p className="mt-0.5 text-[10px] font-mono uppercase tracking-[0.16em] text-white/55">
        {label}
      </p>
    </div>
  );
}

/**
 * Lightweight, dependency-free typewriter. Renders all lines stacked,
 * each typed in sequence. If reduced-motion is on, shows everything
 * instantly with no animation.
 */
function Typewriter({
  lines,
  reducedMotion,
  charDelayMs = 28,
  pauseBetweenMs = 350,
}: {
  lines: string[];
  reducedMotion: boolean;
  charDelayMs?: number;
  pauseBetweenMs?: number;
}) {
  const [lineIdx, setLineIdx] = useState(reducedMotion ? lines.length : 0);
  const [charIdx, setCharIdx] = useState(reducedMotion ? 0 : 0);

  useEffect(() => {
    if (reducedMotion) return;
    if (lineIdx >= lines.length) return;
    const current = lines[lineIdx];
    if (charIdx < current.length) {
      const t = setTimeout(() => setCharIdx((c) => c + 1), charDelayMs);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setLineIdx((i) => i + 1);
      setCharIdx(0);
    }, pauseBetweenMs);
    return () => clearTimeout(t);
  }, [lineIdx, charIdx, lines, charDelayMs, pauseBetweenMs, reducedMotion]);

  return (
    <span className="block">
      {lines.map((l, i) => {
        const isCurrent = i === lineIdx && !reducedMotion;
        const isDone = i < lineIdx || reducedMotion;
        const shown = isDone ? l : isCurrent ? l.slice(0, charIdx) : "";
        const lastLine = i === lines.length - 1;
        return (
          <span key={i} className="block">
            {lastLine && (isDone || isCurrent) ? (
              <>
                So I built <span className="bg-gradient-to-r from-accent to-[#FF8C3A] bg-clip-text text-transparent">JobyBots</span>.
                {!isDone && !reducedMotion && <Caret />}
              </>
            ) : (
              <>
                {shown}
                {isCurrent && <Caret />}
              </>
            )}
          </span>
        );
      })}
    </span>
  );
}

function Caret() {
  return (
    <span
      aria-hidden
      className="ml-1 inline-block h-[0.9em] w-[3px] translate-y-[0.08em] bg-accent align-middle"
      style={{ animation: "jobybots-caret 1s steps(2,end) infinite" }}
    />
  );
}
