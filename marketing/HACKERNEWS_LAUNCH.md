# HackerNews "Show HN" Launch — JobyBots

The submission template is below, plus rules of engagement based on what's worked for similar indie tools (Plausible, Cal.com, PostHog) when they were at $0-MRR.

---

## When to submit

- **Best day**: Tuesday or Wednesday
- **Best time**: 8:00–8:30 AM US Eastern Time (13:00 UTC)
- **Why**: Frontpage algorithm rewards stories that gain velocity in the first 30 minutes, when US West-coast wakes up and EU is still active.
- **Worst times**: Weekends, US holidays, Mondays (people are catching up).

---

## Title (pick one — A is the strongest)

A) `Show HN: I built JobyBots after 200 cold emails got me 6 replies (₹2,999, runs on your laptop)`

B) `Show HN: JobyBots – local-first AI job hunter for UAE/India/UK (one-time $36)`

C) `Show HN: An AI job hunter that runs on your laptop, not someone's cloud`

**Title rule:** Must start with `Show HN:`. Must not exaggerate. Must contain a falsifiable claim (the 200/6 number, the $36 price).

URL: `https://jobybots.com`

---

## Body (post as a comment immediately after submitting)

```
Hi HN — I'm Tharakesh, a working product manager in Dubai. Earlier this year I started quietly looking for my next role on top of a full-time job.

Over two months I sent 200+ manual cold emails on evenings and weekends. I got 6 replies. None became an interview.

The diagnosis was obvious — none of the email-finders, tracking tools, or AI-write-my-cover-letter SaaS apps actually wired together end-to-end. So I wrote one that does.

JobyBots:
- Searches LinkedIn / Indeed / Naukri / Bayt / GulfTalent / Greenhouse / Lever / Workable every 30 min
- Scores every job 0-100 against your résumé using Gemini Flash (with the explanation visible)
- For matches above 70%, runs a 5-tier email finder (cache → careers page scrape → LinkedIn HR lookup → name+domain patterns → SMTP RCPT probe)
- Drafts a JD-aware cover letter, sends it via your own Gmail SMTP (daily cap so Gmail doesn't ban you)
- Pulls IMAP NDR responses to detect bounces and quarantine bad addresses
- Logs everything to a local SQLite file you can open in DB Browser

What's notable for HN:
- 100% local. Nothing leaves your laptop. Your résumé, Gmail App Password, Gemini key live in a folder.
- No subscription. One-time ₹2,999 (~$36). GDPR-safe mode for UK/EU markets.
- The SMTP RCPT probe technique is what dropped my bounce rate from ~35% to under 5%.
- Built specifically for UAE + Saudi + India + UK (the markets where global tools have zero recruiter density).

Tech: Python 3.12, Pydantic, SQLite, Gemini API, Gmail SMTP, IMAP, a handful of Playwright fallbacks for stubborn career pages.

The website: https://jobybots.com
60-second demo: https://jobybots.com/jobybots-60s.mp4
The /install walkthrough: https://jobybots.com/install
The /wins wall (real customers): https://jobybots.com/wins

Happy to talk about:
- How the 5-tier email finder actually works (technical writeup in /blog soon)
- Why SMTP RCPT probing is the single biggest lever for cold-email deliverability
- The GDPR question — we run a "legitimate-interest-only" mode for UK addresses
- Why I made it a one-time purchase vs subscription (TL;DR: I wanted a tool, not a recurring expense)

Refunds inside 7 days if it doesn't work for you. Critiques very welcome.

— Tharakesh
```

---

## Rules of engagement (the first 4 hours)

1. **Submit yourself only.** Never ask anyone to upvote.
2. **First 2 hours**: respond to every single comment within 5 minutes. HN voters reward founder presence.
3. **No marketing language.** "Personalised" is fine, "revolutionary" is not.
4. **Concede technical critiques openly.** "Good point, the email-finder fallback chain doesn't handle X yet — I'm tracking it in #14" wins more than defending.
5. **Don't post on multiple sites the same day** (HN, PH, Reddit). HN voters dislike "launch everywhere" energy.
6. **If you get the front page**: Pin the post on your LinkedIn header. Tweet the HN link, not your URL. The HN traffic compounds.
7. **If you don't get the front page**: That's fine, the secondary effects (SEO backlink from news.ycombinator.com is worth a lot) still happen.

---

## Pre-checks (45 minutes before you submit)

- [ ] `/install` and `/wins` are reachable, return 200
- [ ] The 60-second `.mp4` plays directly in browser (https://jobybots.com/jobybots-60s.mp4)
- [ ] Buy flow works on `/buy-india` (test transaction yourself with 1 INR if needed)
- [ ] HN profile bio mentions "Founder, JobyBots" (people will click)
- [ ] You're at a desk for the next 4 hours
- [ ] Slack/WhatsApp notifications off — comments are the only thing that matters

---

## After the launch (next day)

- Add the HN thread URL to `/press` and `/about`.
- Tweet a thread: "How my Show HN went. Lessons in numbers." with the upvote/visit/buy numbers.
- Add the top 3-5 HN comments verbatim to `/testimonials`.
- Cross-post the same write-up to dev.to + Medium ("Show HN postmortem: building JobyBots").
- IndexNow ping again. The HN backlink + the new content gives Google + Bing fresh signal.
