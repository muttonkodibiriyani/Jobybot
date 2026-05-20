# JobyBots Demo Video — Storyboard & Recording Script

A 90-second screen recording you can shoot on your own laptop and upload
to YouTube (free, unlisted) or Vimeo. Then drop the embed URL into Vercel
as `NEXT_PUBLIC_DEMO_VIDEO_URL` and it shows up on `/demo`.

## What you need

- **Screen recorder** — free options:
  - Windows: built-in **Xbox Game Bar** (`Win+G`)
  - Or **OBS Studio** (free, more control) — <https://obsproject.com>
- **A microphone** — your laptop's built-in is fine.
- **15 minutes** to record + edit.

## Recording setup tips

- Set your screen resolution to **1920×1080** before recording.
- Close all other windows. Use a fresh Chrome window.
- Disable Windows notifications (`Win+A` → Focus assist → Alarms only).
- Speak clearly. Smile while talking — it shows in your voice.

---

## The 90-second script

### Scene 1 — "The problem" (0–10s)

**Show:** Your face (webcam overlay) or a black slide with the text:
> *"You apply to 200 jobs. You hear back from 3."*

**Say:**
> "Job hunting in 2026 is broken. I applied to 200 jobs last month
> and only got 3 replies. So I built JobyBots — an AI that does the
> applying *for* you."

---

### Scene 2 — "Show the website" (10–20s)

**Show:** Open Chrome → type `jobybots.com` → press Enter.

**Say:**
> "JobyBots is a one-time payment, runs entirely on your laptop, and
> uses Google Gemini AI to find jobs that actually match your résumé."

Hover over the live AI search demo on the right. Let viewers see jobs
appearing one by one with match scores.

---

### Scene 3 — "Pay with UPI" (20–30s)

**Show:** Click **Buy with UPI**.

**Say:**
> "Pay ₹2,999 once with any UPI app — PhonePe, GPay, Paytm.
> Upload your payment screenshot. The owner approves within 30
> minutes, 24×7."

Show the QR code page. Don't actually pay — just demonstrate the flow.

---

### Scene 4 — "Install" (30–50s)

**Show:** Open a folder called `Jobybot-Pro-Setup` on your desktop.
Double-click **JOBYBOT.bat**. Show the black terminal window with the
wizard asking questions. Type a few answers fast.

**Say:**
> "After payment, you get the installer in email. Extract the zip,
> double-click JOBYBOT.bat, answer five questions. Takes about three
> minutes."

Cut to the wizard finishing with the ✅ success message.

---

### Scene 5 — "The dashboard" (50–70s)

**Show:** Your local dashboard at `http://localhost:8080` (or use the
preview on `jobybots.com/dashboard` if you haven't installed yet).

**Say:**
> "This is your dashboard. The AI activity log on the left shows
> Gemini scanning LinkedIn, Indeed, Naukri, Bayt — eight sources in
> parallel. On the right, jobs ranked by AI match score. Click Apply
> on any one — the form pre-fills."

Hover over the "92% match" pill on the top job. Click **Apply →**.
The job opens in a new tab.

---

### Scene 6 — "The daily email" (70–80s)

**Show:** Switch to Gmail. Open the daily summary email titled
"25 AI-matched jobs · Today" with all the apply buttons.

**Say:**
> "And every morning at 9 AM, you get this email — top 25 jobs of
> the day, ranked by AI, one-click apply links. The whole thing
> takes you five minutes a day."

---

### Scene 7 — "The pitch" (80–90s)

**Show:** Back to `jobybots.com` hero, with the "Buy with UPI" button.

**Say:**
> "₹2,999 once. Lifetime license. Your data never leaves your laptop.
> Seven-day money-back guarantee. Go to jobybots.com. Get hired faster."

End with the JobyBots logo on a clean dark screen for 1 second.

---

## After recording

1. Trim dead air at the start/end.
2. Add background music (free at <https://incompetech.com> — pick
   something upbeat and quiet).
3. Export as **MP4, 1080p, 30fps**.
4. Upload to YouTube:
   - Visibility: **Unlisted** (only people with the link can see it).
   - Title: "JobyBots — Your AI Job Hunter. 24/7. On Your Laptop."
   - Click **Share** → **Embed** → copy the iframe `src` URL.
5. In Vercel → Project → Settings → Environment Variables:
   - Add `NEXT_PUBLIC_DEMO_VIDEO_URL` = `https://www.youtube.com/embed/YOUR_VIDEO_ID`
   - Redeploy.
6. The video shows up automatically on `https://jobybots.com/demo`.

---

## Quick-start: alternative if you don't want to record yourself

You can also use the built-in interactive demo on the site —
**the live AI search animation on `/demo` already shows the AI in
action**. Until you record a video, customers see the animated demo +
dashboard preview, which is honestly more engaging than most product
videos.

If you skip the video forever, that's fine. Don't block on it.
