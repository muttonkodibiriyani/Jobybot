# ProductHunt Launch Plan — JobyBots

> **Goal**: #1 Product of the Day, top-5 Product of the Week.
> **Date**: Tuesday, 03 June 2026 (12:01 AM PT) — Tuesdays consistently have the strongest sustained voting curve.

## Pre-launch (T–7 days)

1. **Build hunter network.** Reach out to 30 high-DAU PH hunters who launched dev-tools / career-tools in 2025-2026. Goal: 8 confirmations.
2. **Schedule the post.** Lock the title, tagline, gallery, and first comment 72h before launch.
3. **Warm the audience.** LinkedIn + Twitter posts every other day for the 7 days before launch, building anticipation. Pin a "Launching on PH 03 June, comment LAUNCH to be notified" post on your LinkedIn.
4. **Internal QA.** All assets uploaded to a private PH draft. Test every link from a fresh browser.

## Asset checklist

- [ ] Logo (240×240 PNG, transparent)
- [ ] Tagline (60 chars max)
- [ ] Description (260 chars max)
- [ ] Gallery — 5 images at 1270×760 + 1 GIF (≤3MB)
- [ ] Demo video — YouTube link (https://youtu.be/fwKCITDa2MM)
- [ ] Maker comment (post immediately after launch)
- [ ] PH bio: "Founder of JobyBots. Working PM in Dubai. 8yr MENA retail. Building local-first AI tools for job seekers."

## Copy

### Tagline (60 char limit)
> The AI job hunter that lives on your laptop. ₹2,999 lifetime.

Alternative taglines:
> Send 200 AI-personalised job applications a day — locally
> Recruiter outreach automation that respects your Gmail
> Local-first AI for job hunting · UAE / Saudi / India / UK

### Description (260 char limit)
> JobyBots scans LinkedIn, Indeed, Naukri & Bayt every 30 min, scores each match with Gemini, validates recruiter emails, and sends 200 personalised applications a day — all on your laptop. Pay ₹2,999 once. UAE-focused, GCC + India + UK markets.

### Maker comment (post within 5 min of launch)

> Hey hunters 👋
>
> Founder here. I'm Darapu — working product manager in Dubai, IIT Patna alum, 8 years in MENA retail data + AI. Earlier this year I started quietly looking for what's next on top of my day job. After sending 200 manual cold emails for product roles and getting 6 replies, I went home and started building the bot that should have existed.
>
> Three things make JobyBots different from LazyApply / Sonara / AIApply:
>
> 1. **It runs on your laptop.** Your résumé and Gmail credentials never leave your machine.
> 2. **It writes — not just sends.** Gemini reads each JD, quotes ONE requirement, and matches it to ONE outcome from your résumé.
> 3. **It pays for itself.** One job offer covers ~50 lifetime licenses.
>
> Pricing: ₹2,999 (~$49) lifetime. 7-day refund.
>
> Built specifically for UAE / Saudi / Qatar / Oman / Bahrain / India / UK candidates — the markets where US tools don't ship curated recruiter lists.
>
> Ask me anything! I'll be in this thread all day.

### Reply templates (for common questions)

**Q: Doesn't this violate LinkedIn's ToS?**
> Great question. JobyBots never logs into your LinkedIn account or clicks any UI element. It only reads public job listings (same as anyone with a browser would). Outreach goes via your Gmail, not LinkedIn. We've stayed inside ToS deliberately — the moment a tool touches LinkedIn's UI, accounts start getting suspended.

**Q: Why ₹2,999 instead of subscription?**
> Two reasons. (1) I hate subscriptions and so does everyone I asked. (2) The ongoing costs (Gemini API, Gmail SMTP, your server) are all on your side, so we don't have a recurring cost to recoup. It's a one-time tool license like a piece of software in 2005.

**Q: What's the bounce rate?**
> About 3% after we rewrote the bounce tracker in April. We do an SMTP RCPT probe before every send to catch obvious 5xx addresses, and we read your Gmail inbox via IMAP for delivery-failure notifications. Every bad address gets quarantined and never retried.

**Q: Mac support?**
> Yes — Windows 10/11 and macOS 12+. The installer is identical (a shell script for Mac, a .bat for Windows).

**Q: How is it different from Massive.ai?**
> Massive is a beautiful SaaS bot, but every résumé, every cover letter, and every reply lives on their cloud. JobyBots gives you the same agent loop entirely on your laptop with a SQLite database you can open in DB Browser. Same loop, your data.

## Launch-day execution

- **00:01 PT** — Post goes live (scheduled). Hunter notifies their followers.
- **00:05 PT** — Maker comment posted. Pin it.
- **00:10 PT** — Slack/Discord blast to your inner circle: "JobyBots is live on PH. One upvote + one comment = ❤️"
- **06:00 PT** — Morning shift: respond to every comment within 10 min for first 6 hours.
- **12:00 PT** — Twitter / LinkedIn announcements with PH badge embed.
- **18:00 PT** — Evening shift: Reddit /r/cscareerquestions, /r/EngineeringResumes, /r/jobsearch posts.
- **23:00 PT** — Recap blog post: "What happened when JobyBots launched on PH".

## Voter-mobilization channels

| Channel | Audience | Tactic |
|---|---|---|
| LinkedIn (personal) | 3K connections | Pinned post with PH link, hourly comment replies |
| Twitter | 800 followers | Thread with screenshots + PH link |
| Telegram (IIT alumni) | 12K members | Polite ask in #side-projects |
| WhatsApp (close 50) | 50 people | Direct DM with link + one-sentence ask |
| Reddit (existing posts) | ~5K total | Add comment to your launch-related answers |
| HackerNews | Unknown | "Show HN" same day (separate post) |

## After launch

- **Day 1 evening**: Send personal thank-you email to every commenter.
- **Day 2**: Post the final result + lessons-learned blog.
- **Day 3-7**: Slow-burn social media — "Day 3 after launch: 47 sign-ups, 12 reviews".
- **Week 2**: Apply the PH momentum to Reddit / IndieHackers / HN follow-ups.

## Backup plans

- If the launch stalls mid-morning (under 100 upvotes by 10 AM PT), trigger the WhatsApp blast to your 50 closest contacts.
- If a controversy thread forms (LinkedIn ToS, GDPR, etc.), address it transparently in the maker comment within 30 min — don't let it fester.
