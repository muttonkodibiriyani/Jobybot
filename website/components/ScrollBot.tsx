"use client";
import { useEffect, useRef, useState } from "react";

/**
 * Scroll companion — a tiny animated robot that follows the user down the page.
 *
 * Design intent (Apple/Uber meets "the AI is alive"):
 *   - Sits fixed in the bottom-right corner once you scroll past 200px
 *   - Antenna with a glowing orange tip that blinks
 *   - Eyes that look at the cursor (parallax via mouse position)
 *   - Continuous gentle floating bounce (3.6s ease-in-out)
 *   - Spinning gear inside the chest (8s rotation)
 *   - Speech bubble that shows a different witty status line each time
 *     the user pauses scrolling — fades in/out smoothly.
 *
 * Pure SVG + CSS — no extra deps. Honors prefers-reduced-motion.
 */
const STATUS_LINES = [
  "🔍 Scanning LinkedIn…",
  "🧠 Reading your résumé…",
  "✍️ Drafting an email…",
  "📧 Sending to recruiter…",
  "🎯 92% match found!",
  "🌍 GDPR-safe mode on…",
  "💼 +1 application sent",
  "⚡ Bouncing back from a 404…",
];

export function ScrollBot() {
  const [visible, setVisible] = useState(false);
  const [status, setStatus] = useState(0);
  const [showBubble, setShowBubble] = useState(false);
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Show the bot only after the user has scrolled past the hero (≈200px)
  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 200);
      // Hide the bubble briefly while scrolling so the bot doesn't get in
      // the way; pop it back up once the user stops scrolling.
      setShowBubble(false);
      if (idleTimer.current) clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(() => {
        setStatus((s) => (s + 1) % STATUS_LINES.length);
        setShowBubble(true);
      }, 700);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, []);

  // Auto-rotate the status bubble even when idle, so the bot feels alive
  useEffect(() => {
    if (!visible) return;
    const id = setInterval(() => {
      setStatus((s) => (s + 1) % STATUS_LINES.length);
    }, 4200);
    return () => clearInterval(id);
  }, [visible]);

  // Eyes track the cursor — limited to a ±3px offset for a subtle effect
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onMove = (e: MouseEvent) => {
      const cx = window.innerWidth - 60; // bot anchor x
      const cy = window.innerHeight - 60; // bot anchor y
      const dx = (e.clientX - cx) / window.innerWidth;
      const dy = (e.clientY - cy) / window.innerHeight;
      setEyeOffset({
        x: Math.max(-3, Math.min(3, dx * 8)),
        y: Math.max(-2, Math.min(2, dy * 8)),
      });
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed bottom-5 right-5 z-40 transition-all duration-500 sm:bottom-6 sm:right-6 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      }`}
    >
      <div className="relative flex flex-col items-end gap-2">
        {/* Speech bubble */}
        <div
          className={`pointer-events-none origin-bottom-right transform-gpu rounded-2xl border border-surface-divider bg-white/95 px-3.5 py-2 text-xs font-medium text-ink shadow-card backdrop-blur transition-all duration-300 ${
            showBubble
              ? "translate-y-0 scale-100 opacity-100"
              : "pointer-events-none translate-y-2 scale-95 opacity-0"
          }`}
        >
          {STATUS_LINES[status]}
          <span className="absolute -bottom-1.5 right-6 h-3 w-3 rotate-45 border-b border-r border-surface-divider bg-white/95" />
        </div>

        {/* Robot body */}
        <div
          className="relative h-[72px] w-[72px] animate-bot-float drop-shadow-[0_12px_24px_rgba(255,107,0,0.20)]"
          style={{ filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.08))" }}
        >
          <svg viewBox="0 0 100 100" className="h-full w-full">
            <defs>
              <linearGradient id="bot-head" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#FFFFFF" />
                <stop offset="1" stopColor="#F5F5F7" />
              </linearGradient>
              <linearGradient id="bot-chest" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#1D1D1F" />
                <stop offset="1" stopColor="#2C2C2E" />
              </linearGradient>
              <radialGradient id="bot-antenna-glow" cx="0.5" cy="0.5" r="0.5">
                <stop offset="0" stopColor="#FF6B00" stopOpacity="0.9" />
                <stop offset="1" stopColor="#FF6B00" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Antenna stalk */}
            <line x1="50" y1="14" x2="50" y2="22" stroke="#1D1D1F" strokeWidth="2.5" strokeLinecap="round" />
            {/* Antenna glow halo */}
            <circle cx="50" cy="12" r="9" fill="url(#bot-antenna-glow)">
              <animate attributeName="r" values="9;13;9" dur="1.6s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.6;1;0.6" dur="1.6s" repeatCount="indefinite" />
            </circle>
            {/* Antenna tip */}
            <circle cx="50" cy="12" r="3.5" fill="#FF6B00">
              <animate attributeName="opacity" values="1;0.55;1" dur="1.6s" repeatCount="indefinite" />
            </circle>

            {/* Head (rounded square) */}
            <rect x="22" y="22" width="56" height="42" rx="14" fill="url(#bot-head)" stroke="#D2D2D7" strokeWidth="1.5" />

            {/* Eyes — group transforms with cursor tracking */}
            <g transform={`translate(${eyeOffset.x}, ${eyeOffset.y})`}>
              <circle cx="38" cy="42" r="4.2" fill="#1D1D1F" />
              <circle cx="62" cy="42" r="4.2" fill="#1D1D1F" />
              {/* Eye sparkles */}
              <circle cx="39.5" cy="40.5" r="1.2" fill="#FFFFFF" />
              <circle cx="63.5" cy="40.5" r="1.2" fill="#FFFFFF" />
            </g>

            {/* Smile */}
            <path
              d="M 42 52 Q 50 58 58 52"
              stroke="#1D1D1F"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />

            {/* Neck */}
            <rect x="44" y="64" width="12" height="4" fill="#D2D2D7" />

            {/* Chest (dark) with rotating gear */}
            <rect x="20" y="68" width="60" height="24" rx="10" fill="url(#bot-chest)" />
            <g transform="translate(50, 80)">
              <g className="animate-gear-spin-med" style={{ transformOrigin: "center" }}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <rect
                    key={i}
                    x={-1.4}
                    y={-9}
                    width={2.8}
                    height={3.5}
                    rx={0.7}
                    fill="#FF6B00"
                    transform={`rotate(${(i * 360) / 8})`}
                  />
                ))}
              </g>
              <circle r="6" fill="#FF6B00" />
              <circle r="2.5" fill="#1D1D1F" />
            </g>

            {/* Side LEDs blinking */}
            <circle cx="26" cy="80" r="1.6" fill="#00D166">
              <animate attributeName="opacity" values="1;0.2;1" dur="2.2s" repeatCount="indefinite" />
            </circle>
            <circle cx="74" cy="80" r="1.6" fill="#FF6B00">
              <animate attributeName="opacity" values="0.3;1;0.3" dur="2.2s" repeatCount="indefinite" />
            </circle>

            {/* Tiny arms swaying */}
            <g style={{ transformOrigin: "20px 78px" }} className="animate-arm-sway-left">
              <line x1="20" y1="78" x2="14" y2="86" stroke="#1D1D1F" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="14" cy="86" r="2.4" fill="#1D1D1F" />
            </g>
            <g style={{ transformOrigin: "80px 78px" }} className="animate-arm-sway-right">
              <line x1="80" y1="78" x2="86" y2="86" stroke="#1D1D1F" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="86" cy="86" r="2.4" fill="#1D1D1F" />
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
}
