# Jobybot Marketing Website

Uber/Amazon-inspired landing site with Stripe checkout and installer download.

## Run locally

```powershell
cd website
copy .env.example .env.local
npm install
npm run dev
```

Open http://localhost:3000

**Demo checkout:** Without Stripe keys, "Buy" redirects to success and allows download (demo session).

## Stripe setup

1. Create product + one-time price in [Stripe Dashboard](https://dashboard.stripe.com)
2. Set in `.env.local`:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_PRICE_ID`
   - `NEXT_PUBLIC_SITE_URL=https://yourdomain.com`

## Build installer ZIP

From repo root:

```powershell
.\scripts\package-release.ps1
```

Creates `releases/Jobybot-Pro-Setup.zip` served by `/api/download`.

## Deploy (Vercel)

```bash
cd website
vercel
```

Set environment variables in Vercel project settings. Upload `releases/Jobybot-Pro-Setup.zip` via CI or blob storage for production downloads.

## Design system

- **Ink** `#0B0B0B` — Uber-style dark hero
- **Accent** `#FF6B00` — Amazon-style CTA orange
- **Surface** white / `#F7F7F7` — clean product pages
- Max width 1200px, 16px+ body, bold headlines
