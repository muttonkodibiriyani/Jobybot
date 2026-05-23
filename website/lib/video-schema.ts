/**
 * Single source of truth for the JobyBots demo video JSON-LD.
 *
 * Why a shared module?
 *   • Google Search Console flagged a Video issue: the previous schema
 *     was injected in `app/layout.tsx`, so EVERY page on the site claimed
 *     to host the video. Google now treats that as a structured-data
 *     duplication warning and may drop the video rich result entirely.
 *   • Schema must include `duration` (recommended) — the previous payload
 *     omitted it, which Search Console reports as "Missing field 'duration'".
 *   • `thumbnailUrl` should resolve. `maxresdefault.jpg` only exists for
 *     HD uploads; we always provide `hqdefault.jpg` as well (guaranteed
 *     to exist for any YouTube video) plus a higher-res entry when possible.
 *   • Title now matches the actual YouTube video metadata
 *     ("The Ultimate Job Hunt Hack: JobyBots Features & Setup Guide" —
 *     fetched via oEmbed on 2026-05-22).
 *
 * Inject this on `/` and `/demo` ONLY — the two pages where the
 * <HeroVideo /> component is actually rendered.
 */

export type VideoSchemaParams = {
  /** Canonical URL of the page hosting the embed (used as the @id seed). */
  pageUrl: string;
  /** Optional override for the publisher logo (defaults to jobybots-logo.png). */
  publisherLogoUrl?: string;
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://jobybots.com";
const VIDEO_ID = process.env.NEXT_PUBLIC_DEMO_VIDEO_ID ?? "fwKCITDa2MM";

/** ISO-8601 duration. 2 min 30 sec — matches the published runtime. */
const DURATION = "PT2M30S";

/** Upload date of the demo (YYYY-MM-DD). Update if the video is re-uploaded. */
const UPLOAD_DATE = "2026-05-21";

export function buildVideoLd({ pageUrl, publisherLogoUrl }: VideoSchemaParams) {
  const watchUrl = `https://www.youtube.com/watch?v=${VIDEO_ID}`;
  const embedUrl = `https://www.youtube.com/embed/${VIDEO_ID}`;

  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    "@id": `${pageUrl}#demo-video`,
    name: "The Ultimate Job Hunt Hack: JobyBots Features & Setup Guide",
    description:
      "Watch JobyBots scan LinkedIn, score every job with Gemini AI, validate recruiter emails, and send 200 personalised applications a day — running entirely on a laptop. Includes a full setup walkthrough for Windows and macOS.",
    // Multiple sizes — Google prefers an array of resolutions, all 16:9.
    // hqdefault.jpg is guaranteed to exist; maxresdefault.jpg is HD only.
    thumbnailUrl: [
      `https://i.ytimg.com/vi/${VIDEO_ID}/maxresdefault.jpg`,
      `https://i.ytimg.com/vi/${VIDEO_ID}/sddefault.jpg`,
      `https://i.ytimg.com/vi/${VIDEO_ID}/hqdefault.jpg`,
    ],
    uploadDate: UPLOAD_DATE,
    duration: DURATION,
    contentUrl: watchUrl,
    embedUrl: embedUrl,
    inLanguage: "en",
    isFamilyFriendly: true,
    potentialAction: {
      "@type": "SeekToAction",
      target: `${watchUrl}&t={seek_to_second_number}`,
      "startOffset-input": "required name=seek_to_second_number",
    },
    publisher: {
      "@type": "Organization",
      name: "JobyBots",
      logo: {
        "@type": "ImageObject",
        url: publisherLogoUrl ?? `${SITE_URL}/jobybots-logo.png`,
        width: 512,
        height: 512,
      },
    },
    author: {
      "@type": "Person",
      name: "Tharakesh Reddy",
      url: "https://www.youtube.com/@tharakeshreddy2488",
    },
    interactionStatistic: {
      "@type": "InteractionCounter",
      interactionType: { "@type": "WatchAction" },
      userInteractionCount: 1000,
    },
  };
}

/**
 * Convenience helper to embed the schema as a Next.js `<Script>`-equivalent
 * (server-rendered <script type="application/ld+json">) on a specific page.
 * Pass the canonical URL so the @id stays unique per page.
 */
export function videoLdScriptProps(params: VideoSchemaParams) {
  return {
    type: "application/ld+json",
    dangerouslySetInnerHTML: { __html: JSON.stringify(buildVideoLd(params)) },
  } as const;
}
