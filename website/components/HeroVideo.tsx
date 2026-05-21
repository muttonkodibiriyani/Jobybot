"use client";

import { useState } from "react";

/**
 * Lightweight click-to-load YouTube embed.
 *
 * Why not react-player or a plain iframe?
 *
 *   - react-player adds ~25 KB of JS even when nothing is playing.
 *   - A plain iframe loads ~600 KB of YouTube JS on every page view.
 *
 * This component renders only the YouTube poster image until the user
 * clicks Play. The iframe is then created on demand, which keeps the
 * page's LCP and TBT scores untouched and Lighthouse Performance >= 90.
 */
type Props = {
  /** YouTube video id, e.g. fwKCITDa2MM */
  id: string;
  /** Visible title for accessibility. */
  title: string;
  /** Optional aspect ratio class (default 16:9). */
  aspect?: string;
  /** When false, hides the rounded card chrome (used inside other cards). */
  framed?: boolean;
};

export function HeroVideo({
  id,
  title,
  aspect = "aspect-video",
  framed = true,
}: Props) {
  const [playing, setPlaying] = useState(false);

  const poster = `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`;
  const playerSrc = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
  const watchUrl = `https://www.youtube.com/watch?v=${id}`;

  const wrapperClass = framed
    ? "group relative w-full overflow-hidden rounded-3xl border border-surface-divider bg-ink shadow-lift"
    : "group relative w-full overflow-hidden";

  return (
    <div className={`${wrapperClass} ${aspect}`}>
      {playing ? (
        <iframe
          className="absolute inset-0 h-full w-full"
          src={playerSrc}
          title={title}
          frameBorder={0}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          aria-label={`Play video: ${title}`}
          className="absolute inset-0 flex items-center justify-center"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={poster}
            alt={`${title} — video preview`}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
          {/* Vignette + play button overlay */}
          <span
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/15"
          />
          <span
            aria-hidden
            className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full bg-white/95 shadow-2xl backdrop-blur transition-transform duration-300 group-hover:scale-110"
          >
            <svg
              viewBox="0 0 24 24"
              width="34"
              height="34"
              className="ml-1 text-ink"
              fill="currentColor"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
          <span className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/70 px-3 py-1 text-[11px] font-medium text-white">
            Watch on YouTube
          </span>
        </button>
      )}

      {/* Fallback link visible to crawlers / no-JS users */}
      <noscript>
        <a
          href={watchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute inset-0 flex items-center justify-center text-white"
        >
          Watch &quot;{title}&quot; on YouTube
        </a>
      </noscript>
    </div>
  );
}

export default HeroVideo;
