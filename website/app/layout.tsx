import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Display font for headlines and UI — Apple's Plus Jakarta Sans cousin,
// works beautifully at large weights.
const display = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

// Monospace for labels / eyebrow text — clean technical feel.
const mono = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://jobybots.com";
const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "tharakesh.iitp@gmail.com";
const supportPhone = process.env.NEXT_PUBLIC_SUPPORT_PHONE ?? "+91 7989931325";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "JobyBots — Your AI Job Hunter. 24/7. On Your Laptop.",
    template: "%s · JobyBots",
  },
  description:
    "JobyBots searches LinkedIn, Indeed, Bayt, Naukri every 30 minutes and emails recruiters with your resume. 200 validated applications a day. India, UAE, Singapore, UK and 7 more markets. ₹2,999 lifetime. 7-day refund.",
  keywords: [
    "JobyBots",
    "job search bot",
    "AI job hunter",
    "auto apply jobs India",
    "LinkedIn Easy Apply automation safe",
    "recruiter email outreach",
    "Indeed bot",
    "Naukri job bot",
    "Bayt automation",
    "job application bot India",
    "Sonara alternative",
    "LazyApply alternative",
    "AIApply alternative",
    "200 applications per day",
    "lifetime job search license",
  ],
  openGraph: {
    title: "JobyBots — Your AI Job Hunter. 24/7. On Your Laptop.",
    description:
      "200 validated job applications a day. Built for India, UAE, Singapore, UK and 7 more markets. ₹2,999 lifetime.",
    url: siteUrl,
    siteName: "JobyBots",
    type: "website",
    images: [
      {
        url: "/jobybots-logo.png",
        width: 1200,
        height: 630,
        alt: "JobyBots — Your AI Job Hunter. 24/7. On Your Laptop.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "JobyBots — Your AI Job Hunter. 24/7.",
    description: "200 validated job applications a day, on your own laptop. ₹2,999 lifetime.",
    images: ["/jobybots-logo.png"],
  },
  alternates: {
    canonical: siteUrl,
  },
  robots: {
    index: true,
    follow: true,
  },
  // Favicon + apple-touch-icon are auto-detected from app/icon.svg
  // and app/apple-icon.svg — clean J brand mark, no PNG dependencies.
};

const productLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "JobyBots Pro",
  operatingSystem: "Windows 10, Windows 11",
  applicationCategory: "BusinessApplication",
  offers: {
    "@type": "Offer",
    price: process.env.NEXT_PUBLIC_INR_PRICE ?? "2999",
    priceCurrency: "INR",
    availability: "https://schema.org/InStock",
    url: `${siteUrl}/buy-india`,
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    reviewCount: "47",
  },
};

const organizationLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "JobyBots",
  url: siteUrl,
  logo: `${siteUrl}/jobybots-logo.png`,
  slogan: "Your AI Job Hunter. 24/7. On Your Laptop.",
  contactPoint: [
    {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: supportEmail,
      telephone: supportPhone,
      areaServed: ["IN", "AE", "SG", "UK", "DE", "NL", "IE", "SE", "CA", "AU"],
      availableLanguage: ["English", "Hindi", "Telugu"],
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${display.variable} ${mono.variable}`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-surface text-ink font-sans antialiased">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
