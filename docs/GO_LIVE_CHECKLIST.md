# Get jobybots.com online — step-by-step for non-IT

You've already done these (✅):
- Imported the repo in Vercel.
- Set Root Directory = `website` (the Python error is gone).
- Added the GoDaddy DNS records (A `@ → 76.76.21.21`, CNAME `www → cname.vercel-dns.com`).

Two things are still left. Each takes ~3 minutes.

---

## A. Fix the current build error (Hobby cron limit)

The error you saw:

> Hobby accounts are limited to daily cron jobs. This cron expression
> (*/30 * * * *) would run more than once per day. Upgrade to the Pro
> plan to unlock all Cron Jobs features on Vercel.

**Fix already pushed** (commit you're about to do): the cron in
`vercel.json` is now `0 9 * * *` (once a day at 9:00 UTC) which is
allowed on the free plan. You don't need to upgrade.

The actual every-30-min reminder is now done by **GitHub Actions**
(free, unlimited) — see section C below.

### Steps for you

1. After this commit is pushed to GitHub (I'll do that), open Vercel:
   <https://vercel.com/muttonkodibiriyanis-projects/jobybot>
2. **Deployments** tab → click the latest build (it will have started
   automatically once GitHub gets the push).
3. Wait ~90 seconds. The build should turn **Ready** with a green tick.
4. If it's still red, paste the new error to me.

---

## B. Add environment variables in Vercel (5 minutes)

Without these, the website loads but emails/admin/checkout will be
broken. Open the Vercel project → **Settings** → **Environment
Variables**. For each row below, click **Add New**, paste the key and
the value, leave all three scopes (Production / Preview / Development)
checked, and click **Save**.

| Key | Value | Used by |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://jobybots.com` | OG, sitemap, share links |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | `tharakesh.iitp@gmail.com` | Footer, FAQ |
| `NEXT_PUBLIC_SUPPORT_PHONE` | `+91 7989931325` | Footer, FAQ |
| `NEXT_PUBLIC_INR_PRICE` | `2999` | Pricing card |
| `NEXT_PUBLIC_INR_DISPLAY` | `₹2,999` | Pricing label |
| `NEXT_PUBLIC_UPI_PAYEE_NAME` | `DARAPU THARAKESWARA REDDY` | QR card |
| `GMAIL_ADDRESS` | `tharakesh.iitp@gmail.com` | Sends order/refund emails |
| `GMAIL_APP_PASSWORD` | *(your 16-char Gmail App Password — no spaces)* | SMTP login |
| `GMAIL_FROM_NAME` | `JobyBots Team` | From-name on outgoing mail |
| `ADMIN_PASSWORD` | *(make up a long random password)* | Login at `/admin` |
| `CRON_SECRET` | *(make up another long random string)* | Protects the cron endpoint |
| `INSTALLER_DOWNLOAD_URL` | `https://jobybots.com/Jobybot-Pro-Setup.zip` | Sent in delivery email |

### How to make a Gmail App Password (if you don't have one)

1. Go to <https://myaccount.google.com/apppasswords> (you must have
   2-Step Verification turned on).
2. Choose **Mail** + **Windows Computer** → **Generate**.
3. Copy the 16-character password (remove the spaces) and paste it
   into the `GMAIL_APP_PASSWORD` value above.

After adding all env vars, click **Deployments** → on the latest build,
**⋯ → Redeploy** (uncheck "Use existing Build Cache") → **Redeploy**.

---

## C. Set up the free every-30-min reminder (GitHub Actions)

This replaces what Vercel's free plan won't let us do.

### Steps

1. Open your repo: <https://github.com/muttonkodibiriyani/Jobybot>
2. Click **Settings** (top right) → **Secrets and variables** → **Actions**.
3. Click **New repository secret**.
   - Name: `CRON_SECRET`
   - Secret: *paste the same value you set for `CRON_SECRET` in
     Vercel above (they must match exactly)*.
   - Click **Add secret**.
4. (Optional — only if your live URL is not `https://jobybots.com`.)
   Click **Variables** tab → **New repository variable**.
   - Name: `SITE_URL`
   - Value: your live URL (e.g. `https://jobybot-xyz.vercel.app`).
5. Click **Actions** (top nav) → if you see a banner saying "Workflows
   aren't being run on this forked repository", click **I understand
   my workflows, go ahead and enable them**.
6. In the left sidebar click **Notify pending orders & refunds (every
   30 min)** → click **Run workflow** → **Run workflow** (this is just
   a smoke test).
7. Refresh in ~15 seconds. You should see a green tick. Click into the
   run → expand the step — you'll see `HTTP 200`.

From now on, every 30 minutes it will hit `/api/cron/notify-pending`.
If there's anything in the queue, you get an email. If not, nothing
happens. You don't need to keep your computer on.

---

## D. Add the domain `jobybots.com` to Vercel (3 minutes)

Your DNS records are already pointed at Vercel. Tell Vercel to claim
the domain.

1. Vercel project → **Settings** → **Domains**.
2. **Add** → type `jobybots.com` → **Add**. It should immediately
   show a green tick (because your A record is already `76.76.21.21`).
3. **Add** again → type `www.jobybots.com` → **Add**. Choose
   "Redirect to `jobybots.com`" when prompted.
4. Vercel will provision an SSL certificate in 30-60 seconds.

Visit <https://jobybots.com> in a fresh browser window. You should see
the new homepage with the logo, slogan, and pricing.

---

## E. Quick verification (2 minutes)

After the build is green AND env vars are set AND domain is attached:

| Check | URL | Should show |
|---|---|---|
| Homepage | <https://jobybots.com> | Logo, slogan, "Get Started" button |
| FAQ | <https://jobybots.com/faq> | Sections on payments, refund, security |
| Pricing | <https://jobybots.com/pricing> | INR price card |
| India checkout | <https://jobybots.com/buy-india> | Your PhonePe QR code |
| Refund form | <https://jobybots.com/refund> | 7-day refund policy + form |
| Demo video | <https://jobybots.com/demo> | Steps + video placeholder |
| Admin login | <https://jobybots.com/admin/login> | Password prompt |

If any of those 404, the build still hasn't finished — wait one more
minute and refresh. If any look broken, paste the URL + screenshot back
to me.

---

## F. After today: everything is automatic

You don't have to touch Vercel or GitHub again unless you want to
change something. From now on:

- Edit any file locally → commit → `git push origin main`.
- Vercel auto-builds and deploys in ~90 seconds.
- GitHub Actions keeps pinging every 30 min so you never miss a payment.
- The Vercel daily cron (`0 9 * * *`) acts as a safety-net heartbeat.

That's it — your site is live.
