export const SITE = {
  name: "Jobybots",
  tagline: "Your AI Job Hunter. 24/7. On Your Laptop.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://jobybots.com",
};

export const SUPPORT = {
  email: process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "tharakesh.iitp@gmail.com",
  phone: process.env.NEXT_PUBLIC_SUPPORT_PHONE ?? "+91 7989931325",
  phoneDigits: (process.env.NEXT_PUBLIC_SUPPORT_PHONE ?? "+91 7989931325").replace(/\D/g, ""),
  hours: "Mon–Sat · 10:00 – 20:00 IST",
  refundDays: 7,
  verificationWindow: "30 minutes",
};

export const PAYMENT = {
  upiQrImage: "/phonepe-qr.png",
  upiPayeeName: "DARAPU THARAKESWARA REDDY",
  upiVpa: process.env.NEXT_PUBLIC_UPI_VPA ?? "",
  amountInr: Number(process.env.NEXT_PUBLIC_INR_PRICE ?? 2999),
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
  vpa: process.env.NEXT_PUBLIC_UPI_VPA ?? "",
  payeeName: process.env.NEXT_PUBLIC_UPI_PAYEE_NAME ?? "DARAPU THARAKESWARA REDDY",
  amountInr: Number(process.env.NEXT_PUBLIC_INR_PRICE ?? 2999),
};
