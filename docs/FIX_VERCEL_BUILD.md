# Fix: "No python entrypoint found" on Vercel build

## What you saw

```
Running "vercel build"
Vercel CLI 53.3.2
Error: No python entrypoint found in standard locations.
Found Python files: config.py, jobybot.py.
```

## What it means

Vercel imported the repo and tried to deploy the **Python job bot** at
the repo root. But the **Next.js website** is in the `website/`
subdirectory. Vercel needs to be told to use `website/` as its build
root.

## The 30-second fix (you only do this once)

1. Open your project: <https://vercel.com/muttonkodibiriyanis-projects/jobybot>
2. Click **Settings** → **General**.
3. Scroll to **Root Directory** → click **Edit**.
4. Type: `website`
5. Leave "Include source files outside of the Root Directory" **UNCHECKED**.
6. Click **Save**.
7. Click **Deployments** in the top nav → on the most recent failed
   deployment, click the **⋯** menu → **Redeploy** → uncheck
   "Use existing Build Cache" → **Redeploy**.

You'll see the next build pick up Next.js, install website dependencies,
and deploy successfully. Every future `git push origin main` will then
auto-deploy in ~2 minutes.

## Why you don't see UI/UX changes

Because the deploy is failing, the live site still shows whatever the
last successful build was (or nothing). Once you do the steps above,
the latest commit (with the rebrand, FAQ page, refund flow, QR-code
checkout, comparison table, etc.) will be live within ~2 minutes.

## Safety nets already pushed in commit history

To make it impossible for this error to come back, the repo now contains:

* **`/vercel.json`** at the repo root — explicitly tells Vercel
  `framework = nextjs`, `buildCommand = cd website && npm install && npm run build`,
  and `outputDirectory = website/.next`. So even if the dashboard Root
  Directory was reset, Vercel would still build the Next.js app.
* **`/.vercelignore`** at the repo root — hides every Python file,
  batch script, PowerShell script, and docs folder from Vercel's build
  context. Vercel can no longer see `jobybot.py` / `config.py`.

Once you set Root Directory = `website` in the dashboard, Vercel reads
`website/vercel.json` (which already has the cron config) and ignores
the root files. Both paths are now safe.

## Auto-sync GitHub → Vercel

Auto-sync is already on the moment you imported the repo. Vercel
listens to the `main` branch of `github.com/muttonkodibiriyani/Jobybot`.
After the Root Directory fix above:

* Every push to `main` → production deploy on `jobybots.com`.
* Every push to any other branch → preview deploy on
  `<branch>-jobybot-...vercel.app`.
* You don't need to run `vercel deploy` from your laptop.

## If a future build ever fails again

1. Open Vercel Deployments → click the failed build → **View Build Logs**.
2. Copy the error and paste it back to me. The Vercel logs almost
   always tell you the exact missing env var, broken import, or wrong
   directory.

## Quick sanity check before pushing big changes

From `Jobybot/website/`:

```powershell
cd website
npm install
npm run build
```

If that succeeds locally, the Vercel build will also succeed
(assuming the same env vars are configured in Vercel).

## Second error you may hit: Hobby cron limit

If you see:

> Hobby accounts are limited to daily cron jobs. This cron expression
> (`*/30 * * * *`) would run more than once per day. Upgrade to the
> Pro plan to unlock all Cron Jobs features on Vercel.

This is a Vercel free-plan restriction. We solved it by:

1. Switching `vercel.json` cron to once-a-day (`0 9 * * *`) — Hobby-safe.
2. Adding a free **GitHub Actions** workflow
   (`.github/workflows/cron-notify-pending.yml`) that runs every 30
   minutes and curls the same endpoint with the `CRON_SECRET` header.

Set `CRON_SECRET` as a repo secret on GitHub at
`Settings → Secrets and variables → Actions → New repository secret`,
using the same value you set in Vercel env vars. The workflow takes
over for the every-30-min job. See `docs/GO_LIVE_CHECKLIST.md` section
C for the click-by-click walkthrough.
