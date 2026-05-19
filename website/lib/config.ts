export const SITE = {
  name: "Jobybot",
  tagline: "Search jobs every hour. Email recruiters with your resume.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
};

export const PRICING = {
  pro: {
    name: "Jobybot Pro",
    description: "Lifetime license · runs on your PC",
    priceDisplay: {
      USD: "$49",
      AED: "AED 179",
      INR: process.env.NEXT_PUBLIC_INR_DISPLAY ?? "₹2,999",
    },
    amountUsdCents: 4900,
    amountInr: Number(process.env.NEXT_PUBLIC_INR_PRICE ?? 2999),
    features: [
      "Hourly job search across LinkedIn, Indeed, Bayt, Naukri, RemoteOK",
      "Up to 200 tailored recruiter emails per day",
      "Built-in email validator (no more bounces)",
      "GDPR-safe mode for EU markets (apply via official site)",
      "Live dashboard with sources, bounces and run log",
      "Browser bookmarklet + Chrome extension to pre-fill any apply form",
      "UAE + India + 7 global market packs (incl. Sweden, Ireland)",
      "One-click Windows installer · auto-start scheduler",
      "Your data never leaves your laptop",
    ],
  },
};

export const UPI = {
  vpa: process.env.NEXT_PUBLIC_UPI_VPA ?? "yourname@okhdfcbank",
  payeeName: process.env.NEXT_PUBLIC_UPI_PAYEE_NAME ?? "Jobybot",
  amountInr: Number(process.env.NEXT_PUBLIC_INR_PRICE ?? 2999),
};
