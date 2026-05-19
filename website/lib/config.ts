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
      INR: "₹2,999",
    },
    amountUsdCents: 4900,
    features: [
      "Hourly job search (LinkedIn, Indeed, Bayt, Naukri, RemoteOK)",
      "Up to 200 tailored emails per day",
      "UAE + India + 6 global market packs",
      "One-click Windows installer",
      "Auto-start scheduler + full documentation",
      "Your data never leaves your laptop",
    ],
  },
};
