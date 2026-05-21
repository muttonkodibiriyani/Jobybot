# Storyboard → Realistic Video — Assembly Guide

This folder contains 10 sequential frames that tell the complete JobyBots
story: from a sleepy 9 AM Monday to an offer letter landing. Use them as a
ready-to-shoot storyboard for a 60-90 second hero video, social Reels, or
the homepage demo loop.

---

## Frame inventory

| # | File | What's on screen | Voice-over (1 sentence) |
|---|---|---|---|
| 01 | `storyboard-01-morning.png` | 9 AM desk + laptop + résumé + coffee + Dubai skyline | "9 AM Monday. The bot wakes up before you do." |
| 02 | `storyboard-02-scan.png` | 8 job-site cards scanning live | "It scans LinkedIn, Indeed, Naukri, Bayt and five more — in parallel." |
| 03 | `storyboard-03-score.png` | 87% match circle with Gemini reasoning | "Gemini reads each job and scores how well your résumé fits." |
| 04 | `storyboard-04-finder.png` | 5-tier discovery waterfall | "It finds the real recruiter email — career page, LinkedIn, or pattern guess." |
| 05 | `storyboard-05-probe.png` | SMTP probe terminal in dark mode | "Before sending, it asks the mail server if the address actually exists." |
| 06 | `storyboard-06-write.png` | Gemini drafting a personalised email | "A 5-sentence cover letter that quotes one JD line and one résumé outcome." |
| 07 | `storyboard-07-send.png` | Gmail send confirmation | "The email goes out from your own Gmail. We never see it." |
| 08 | `storyboard-08-progress.png` | 47 applications by lunch dashboard | "By lunch the bot has sent 47 personalised applications." |
| 09 | `storyboard-09-reply.png` | iPhone Gmail reply notification | "And the recruiter replies on her phone the same afternoon." |
| 10 | `storyboard-10-offer.png` | Gmail offer letter from Talabat | "Forty-seven days later: offer letter signed." |

Estimated reel length end-to-end: **60-90 seconds**.

---

## Option A — Free / no-code (Canva or CapCut)

Best for: TikTok, Instagram Reels, YouTube Shorts.
Time to assemble: ~30 minutes.

1. Open **Canva** (canva.com) → **Create design** → **Mobile Video (1080×1920)**
   for vertical reels, OR **YouTube video (1920×1080)** for landscape.
2. **Uploads** tab → upload all 10 PNGs.
3. Drag each frame onto the timeline in order (01 → 10). Set each to
   **6 seconds**.
4. Between every two frames, click the small **"+"** between them and add
   a **Page Transition** → choose **Dissolve** or **Push** (180 ms).
5. On each frame, add an **Animate → Pan & Zoom** (Ken Burns effect) of
   about 8% scale-up over the 6-second duration. This gives the static
   image life.
6. Click each frame → **Text** → add the voice-over line as a caption at
   the bottom (Inter or Space Grotesk, white text on a 50% dark overlay).
7. **Audio** tab → search "ambient lo-fi" or "tech upbeat" → drag in.
   Trim to your total length, fade in/out.
8. **Voice-over**: hit the **mic icon** → record yourself reading the
   ten lines above, OR use Canva's **Magic Audio → Voice Over** AI
   (Ariana → calm) for a free synthetic narration.
9. **Share** → **Download** → **MP4 1080p**.

Total: ~30 min, $0.

## Option B — Higher production (Descript)

Best for: longer-form YouTube, your `/demo` page, conference talks.
Time to assemble: ~60 minutes.

1. Open **Descript** (descript.com — free tier covers this).
2. **New project** → **Import** → drag all 10 PNGs.
3. Drag them onto the timeline in order. Default each to 6 seconds.
4. Click any frame → right panel → **Effects** → **Ken Burns**. Repeat for
   each frame.
5. **Script panel** → paste the 10 voice-over lines.
6. Highlight each line → click **Overdub** or **AI voices** → pick a
   voice (Sarah-en-US works well for tech/product narration). Descript
   re-times the frames to the audio automatically.
7. **B-roll** → add 1-2 second cutaways between frames if you have
   real footage (your actual JobyBots terminal output, Gmail inbox, etc).
8. **Music** → Descript Library → search "tech ambient". Auto-duck
   under voice-over.
9. **Export** → **Video** → MP4 4K. Upload to YouTube and embed via the
   existing `HeroVideo` component on the site.

Total: ~60 min, $0 on Descript free tier.

## Option C — Highest production (Adobe After Effects or DaVinci Resolve)

Best for: ProductHunt launch video, Apple-keynote-style polish.
Time to assemble: 4-8 hours.

1. Open **DaVinci Resolve** (free — resolve.app).
2. Import all 10 PNGs as a **Image Sequence** at 4 sec each.
3. For each frame, add a **Transform** keyframe at 0% (start) and end
   with a 5% zoom + 30 px horizontal pan.
4. Add **Cross Dissolve** transitions (12 frames each) between every two
   frames.
5. **Fairlight** audio editor:
   - Voice-over: record with a USB mic OR use **ElevenLabs** (free tier,
     `Bella` voice) → drag into timeline.
   - Music: **Epidemic Sound** trial → "Ambient Tech / Inspirational"
     → place under VO, auto-duck.
6. **Color** panel → apply a warm-orange LUT to match the JobyBots
   palette. Lift the highlights by 5% to give the desk shots a sunny feel.
7. **Fusion** panel: on Frame 03 (the 87% match), animate the percentage
   counting from 0 to 87 over 1.5 seconds for a hero moment. Same on
   Frame 08 (the 47 applications counter).
8. **Deliver** → H.264, 1080p60. Upload to YouTube. Replace
   `DEMO_VIDEO_ID = "fwKCITDa2MM"` in `website/app/page.tsx` and
   `website/app/demo/page.tsx`.

Total: 4-8 hours, $0 on free tools.

---

## Recommended music tracks (royalty-free)

- **YouTube Audio Library** (youtube.com/audiolibrary) → search "Ambient",
  "Inspirational", "Corporate Tech". Free, no attribution required.
- **Epidemic Sound** (free 30-day trial) → "Future Forward" by Beneath
  the Mountain or "Bright Day" by Ooyy.
- **Pixabay Music** (free, attribution optional) → "Tech Corporate
  Inspiring" by Coma-Media is the closest match to JobyBots tone.

## Recommended voice-over lines

Read these EXACTLY for best alignment with the on-screen text overlays.

> **(01)** "9 AM Monday. Your laptop wakes up. JobyBots is already running."
>
> **(02)** "In 30 seconds it scans LinkedIn, Indeed, Naukri, Bayt and five
> more job sites — in parallel."
>
> **(03)** "Gemini reads every job description and scores how well your
> résumé fits. Eighty-seven percent on this one."
>
> **(04)** "It finds the real recruiter email through five tiers — cache,
> career-page scrape, LinkedIn lookup, pattern, SMTP probe."
>
> **(05)** "Before sending, it quietly asks the mail server if the
> address even exists. No more bounces."
>
> **(06)** "Gemini writes a five-sentence cover letter that quotes one
> requirement from the JD and one outcome from your résumé."
>
> **(07)** "The email leaves your own Gmail. JobyBots never touches
> the cloud. Your data stays on your laptop."
>
> **(08)** "By lunch, forty-seven personalised applications have gone out
> — all while you took the kids to school."
>
> **(09)** "By afternoon, the recruiter replies on her phone."
>
> **(10)** "Forty-seven days later: an offer letter for two-and-a-half
> times your old salary. That's why JobyBots exists."

---

## Where to use the finished video

- **Homepage hero** — replace `DEMO_VIDEO_ID` in `app/page.tsx` and
  `app/demo/page.tsx` with the new YouTube ID.
- **YouTube channel** — upload long-form (90 sec), keep title as
  "Watch JobyBots send 47 applications by lunch · 90 sec demo".
- **Reels / Shorts** — re-export 9:16 vertical, post to LinkedIn,
  Instagram, TikTok, YouTube Shorts. Caption: same VO lines as
  burned-in subtitles.
- **ProductHunt launch** — frame 01 → 10 as a GIF (auto-play, 5 sec
  per frame, no audio). Embed in the PH product page.
- **Cold press pitches** — paste the 60-sec MP4 link in your TechCrunch
  / Khaleej Times email along with the press kit.
- **/about page** — drop a low-res WebM looping background of frames
  01 + 08 + 10 behind the founder pitch hero.

---

## Static-image alternative (if you don't want to make a video)

The 10 frames also work as **carousel posts** on LinkedIn, Instagram and
Twitter:

- LinkedIn carousel = 10 slides, 5-10 sec auto-advance. Highest organic
  reach of any LinkedIn format right now.
- Twitter → post frame 01 with the caption "How JobyBots actually works
  — a thread. 1/10", then quote-tweet each frame in sequence.
- Instagram → 10-slide carousel with the voice-over lines as captions.

---

## Tips for highest engagement

1. **First 3 seconds matter most.** Frame 01 has to hook attention.
   Consider adding a 1-second jump-cut at the start: black screen with
   white text "I sent 200 cold emails for jobs. 6 replies." → cut to
   Frame 01.
2. **End with a CTA.** Frame 10 should overlay a "Get JobyBots →
   ₹2,999 lifetime · jobybots.com" sticker for the last 4 seconds.
3. **Caption everything.** 85% of social video is watched muted. Hard
   subtitles (white on a 50% black bar) are non-negotiable.
4. **Vertical wins.** TikTok / Reels / Shorts get 7-10× the reach of
   horizontal in 2026. Always export a 9:16 version even for YouTube.
5. **Post at 18:00-21:00 IST** for peak India + UAE engagement.

---

## License

These storyboard frames are AI-generated PNG renders made for the JobyBots
launch. You are the founder; do whatever you want with them. They are
NOT real product screenshots — clarify that in any voice-over if asked
("These are illustrative renders of the actual JobyBots workflow").

---

Built in Dubai. 🚀
