import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://jobybot.example";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Jobybot — 200 job applications a day, on auto-pilot",
    template: "%s · Jobybot",
  },
  description:
    "Jobybot searches LinkedIn, Indeed, Bayt, Naukri every hour and emails recruiters tailored applications. Works in India, UAE, Singapore, UK and 5 more markets. ₹2,999 lifetime.",
  keywords: [
    "job search bot",
    "auto apply jobs",
    "LinkedIn Easy Apply automation",
    "recruiter email outreach",
    "Indeed bot",
    "Naukri job bot",
    "Bayt automation",
    "job application bot India",
    "PM job search UAE",
    "200 applications per day",
  ],
  openGraph: {
    title: "Jobybot — 200 job applications a day, on auto-pilot",
    description:
      "Search jobs every hour. Email recruiters with your resume. UAE, India, and 7 global markets.",
    url: siteUrl,
    siteName: "Jobybot",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Jobybot — 200 job applications a day, on auto-pilot",
    description: "Search jobs every hour. Email recruiters with your resume.",
  },
  alternates: {
    canonical: siteUrl,
  },
  robots: {
    index: true,
    follow: true,
  },
};

const productLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Jobybot Pro",
  operatingSystem: "Windows 10, Windows 11",
  applicationCategory: "BusinessApplication",
  offers: {
    "@type": "Offer",
    price: process.env.NEXT_PUBLIC_INR_PRICE ?? "2999",
    priceCurrency: "INR",
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    reviewCount: "47",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }}
        />
      </head>
      <body className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
