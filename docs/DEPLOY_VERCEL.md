# Deploy jobybots.com to Vercel — step by step

Total time: ~25 minutes the first time. After that, every `git push` to
`main` redeploys automatically.

## 1. Push code to GitHub (already done)

The website lives at `website/` inside the main `Jobybot` repo. Vercel will
deploy that subdirectory.

## 2. Connect the repo to Vercel

1. Go to <https://vercel.com/signup> and sign up with the same GitHub account
   that owns the `Jobybot` repo.
2. **Add New… → Project** → select your `Jobybot` repository.
3. On the import screen:
   * **Framework Preset** → Next.js (auto-detected).
   * **Root Directory** → click *Edit* → type `website` → save.
   * **Build & Output settings** → leave the defaults (`npm run build`,
     `.next`).
4. Skip env vars for now (we add them next), click **Deploy**.

The first build will fail or run with placeholder values — that's fine,
we'll fix it in step 4.

## 3. Add environment variables in Vercel

In the Vercel project **Settings → Environment Variables**, add the
following (set scope to **Production, Preview, Development**):

| Key | Value | Why |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://jobybots.com` | Canonical URL, OG, sitemap |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | `tharakesh.iitp@gmail.com` | Shown in FAQ, footer |
| `NEXT_PUBLIC_SUPPORT_PHONE` | `+91 7989931325` | Shown in FAQ, footer |
| `NEXT_PUBLIC_INR_PRICE` | `2999` | Used on /buy-india and product schema |
| `NEXT_PUBLIC_INR_DISPLAY` | `₹2,999` | Display text |
| `NEXT_PUBLIC_UPI_PAYEE_NAME` | `DARAPU THARAKESWARA REDDY` | Shown on QR card |
| `GMAIL_ADDRESS` | `tharakesh.iitp@gmail.com` | Sender + notify recipient |
| `GMAIL_APP_PASSWORD` | *(16-char App Password)* | SMTP login. **Never commit.** |
| `GMAIL_FROM_NAME` | `JobyBots Team` | "From" display |
| `ADMIN_PASSWORD` | *(generate 32+ random chars)* | `/admin` login |
| `CRON_SECRET` | *(generate 32+ random chars)* | Auth on `/api/cron/notify-pending` |
| `INSTALLER_DOWNLOAD_URL` | `https://jobybots.com/Jobybot-Pro-Setup.zip` | Email link on order approval |
| `STRIPE_SECRET_KEY` | `sk_live_...` | Optional, for /pricing card checkout |
| `STRIPE_PRICE_ID` | `price_...` | Optional |

For best practice, use **Vercel KV** (Redis) for orders so they survive
restarts on the serverless filesystem:
1. **Storage → Create Database → KV**
2. Connect it to the `Jobybot` project — Vercel automatically injects
   `KV_REST_API_URL` and `KV_REST_API_TOKEN`. Our `lib/orders.ts` detects
   these and switches storage backend automatically.

After saving env vars, **Redeploy** from the **Deployments** tab.

## 4. Add the custom domain `jobybots.com`

1. In Vercel: **Settings → Domains → Add → `jobybots.com`** (then also add
   `www.jobybots.com`).
2. Vercel shows the DNS records you need.

### GoDaddy DNS records to add

Sign in to <https://dcc.godaddy.com/domains> → `jobybots.com` → **Manage DNS**.

Add / replace the following:

| Type | Name | Value | TTL |
|---|---|---|---|
| `A` | `@` | `76.76.21.21` | 600 |
| `CNAME` | `www` | `cname.vercel-dns.com` | 600 |

(If Vercel shows different values, use **theirs** — they update routing
infrastructure occasionally. The two above are correct as of May 2026.)

Within 5–60 minutes, Vercel automatically provisions a Let's Encrypt SSL
certificate. The padlock will appear and `http://` will auto-redirect to
`https://`.

### Bonus: redirect `www.jobybots.com` → `jobybots.com`

In Vercel **Domains** tab, click the gear icon next to `www.jobybots.com`
and choose **Redirect to `jobybots.com` (308 permanent)**. This keeps
SEO clean.

## 5. Configure Vercel Cron (automated 30-min pending-orders email)

The file `website/vercel.json` already declares:

```json
{ "crons": [{ "path": "/api/cron/notify-pending", "schedule": "*/30 * * * *" }] }
```

After your first production deploy, Vercel auto-enables this cron. Confirm
it under **Settings → Cron Jobs**.

The cron uses `CRON_SECRET` to authenticate. Make sure that env var is set.

## 6. Verify everything works

1. `https://jobybots.com/` — hero with HD logo, slogan, comparison table.
2. `https://jobybots.com/buy-india` — your PhonePe QR with the form.
3. Submit a test order — check Gmail for the screenshot + admin notify.
4. `https://jobybots.com/admin/login` — sign in with `ADMIN_PASSWORD`.
5. Approve the test order — customer receives the installer email.
6. `https://jobybots.com/refund` — submit a refund — check Gmail.
7. `https://jobybots.com/sitemap.xml` and `/robots.txt` — both present.
8. Open dev-tools → Network tab → confirm `Strict-Transport-Security`,
   `Content-Security-Policy`, `X-Frame-Options: DENY` headers on every
   page.

## 7. Auto-deploy on push

Already on by default once the repo is linked. Every push to `main`
triggers a production build at `jobybots.com`. PRs get a unique preview URL.

## 8. Submit to Google for indexing

1. Sign in to <https://search.google.com/search-console>.
2. **Add property → URL prefix → `https://jobybots.com`**.
3. Verify ownership via the **HTML tag** method (we already inject metadata
   you can copy into `app/layout.tsx` `metadata.verification`).
4. Once verified, **Sitemaps → Add new sitemap → `sitemap.xml`**.
5. **URL Inspection** → paste your home URL → click *Request indexing*.

Google usually crawls within 2-7 days. Subsequent pages get indexed
automatically once it sees the sitemap.

## 9. Monitoring & alerts

* **Vercel Analytics** — Settings → Analytics → Enable. Free tier covers
  the first 10 000 monthly visits.
* **Error monitoring** — Vercel surfaces server errors under
  **Logs → Runtime Logs**. For richer alerts, optionally connect
  Vercel → Sentry (free starter tier).
* **Security alerts** — already wired: failed `/admin` logins,
  `/api/india-order` rate limits, and `/api/refund` abuse all email you
  at `GMAIL_ADDRESS` automatically.

## 10. Common gotchas

| Symptom | Fix |
|---|---|
| Build fails on `better-sqlite3` | Add env var `KV_REST_API_URL` + `KV_REST_API_TOKEN` so the SQLite code path never runs on Vercel. |
| Emails not delivered | Set up SPF/DKIM/DMARC on `jobybots.com` — see `docs/DOMAIN_SECURITY.md`. |
| `/admin` looping back to `/admin/login` | `ADMIN_PASSWORD` env not set or different between scopes. Set in **Production**. |
| Cron not firing | Confirm `vercel.json` is at the project root (it is). `Settings → Cron Jobs` should show it green. |
| 404 on `/jobybots-logo.png` | Hard-refresh once — Vercel CDN warmup. The file is in `website/public/`. |
