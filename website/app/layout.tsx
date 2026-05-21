import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ScrollBot } from "@/components/ScrollBot";

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
const demoVideoId = process.env.NEXT_PUBLIC_DEMO_VIDEO_ID ?? "fwKCITDa2MM";
const demoVideoUrl = `https://www.youtube.com/watch?v=${demoVideoId}`;
const demoEmbedUrl = `https://www.youtube.com/embed/${demoVideoId}`;
const demoThumbUrl = `https://i.ytimg.com/vi/${demoVideoId}/maxresdefault.jpg`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "JobyBots — Your AI Job Hunter. 24/7. On Your Laptop.",
    template: "%s · JobyBots",
  },
  description:
    "JobyBots is an AI agent that runs on your laptop, scans LinkedIn / Indeed / Naukri / Bayt every 30 minutes, scores every job with Gemini, validates recruiter emails, and sends up to 200 personalised applications a day. UAE, Saudi, Qatar, Oman, Bahrain, India, Singapore, UK, Canada and more. ₹2,999 lifetime. 7-day refund.",
  applicationName: "JobyBots",
  authors: [{ name: "Darapu Tharakeswara Reddy", url: `${siteUrl}/about` }],
  creator: "Darapu Tharakeswara Reddy",
  publisher: "JobyBots",
  category: "Career Software",
  keywords: [
    "JobyBots",
    "AI job hunter",
    "auto apply jobs",
    "LinkedIn Easy Apply automation",
    "recruiter email outreach",
    "Indeed job bot",
    "Naukri job bot",
    "Bayt automation",
    "UAE job search AI",
    "Saudi Arabia job bot",
    "Qatar job application AI",
    "Oman job hunter",
    "Bahrain job automation",
    "LazyApply alternative",
    "Sonara alternative",
    "AIApply alternative",
    "Massive.ai alternative",
    "Simplify Jobs alternative",
    "200 applications per day",
    "lifetime job search license",
    "Gemini AI cover letter",
    "auto cover letter generator",
    "job search Dubai",
  ],
  openGraph: {
    title: "JobyBots — Your AI Job Hunter. 24/7. On Your Laptop.",
    description:
      "200 validated job applications a day, written and sent by an AI agent that lives on your laptop. UAE, Saudi, Qatar, Oman, Bahrain, India, Singapore, UK + 4 more. ₹2,999 lifetime, 7-day refund.",
    url: siteUrl,
    siteName: "JobyBots",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: demoThumbUrl,
        width: 1280,
        height: 720,
        alt: "JobyBots dashboard — AI job hunting agent",
      },
      {
        url: "/jobybots-logo.png",
        width: 1200,
        height: 630,
        alt: "JobyBots — Your AI Job Hunter",
      },
    ],
    videos: [
      {
        url: demoEmbedUrl,
        secureUrl: demoEmbedUrl,
        type: "text/html",
        width: 1280,
        height: 720,
      },
    ],
  },
  twitter: {
    card: "player",
    title: "JobyBots — Your AI Job Hunter. 24/7.",
    description: "200 validated job applications a day, on your own laptop. ₹2,999 lifetime.",
    images: [demoThumbUrl],
    players: [
      {
        playerUrl: demoEmbedUrl,
        streamUrl: demoEmbedUrl,
        width: 1280,
        height: 720,
      },
    ],
  },
  alternates: {
    canonical: siteUrl,
    languages: {
      "en-US": siteUrl,
      "en-AE": siteUrl,
      "en-GB": siteUrl,
      "en-IN": siteUrl,
      "en-SA": siteUrl,
      "x-default": siteUrl,
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-video-preview": -1,
      "max-snippet": -1,
    },
  },
  // Favicon + apple-touch-icon are auto-detected from app/icon.svg
  // and app/apple-icon.svg — clean J brand mark, no PNG dependencies.
};

const productLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "JobyBots Pro",
  operatingSystem: "Windows 10, Windows 11, macOS 12+",
  applicationCategory: "BusinessApplication",
  applicationSubCategory: "Career Software",
  url: siteUrl,
  image: demoThumbUrl,
  description:
    "AI agent that searches 8 job sites, scores every match with Gemini, validates recruiter emails, and sends up to 200 personalised applications per day — all locally on your laptop.",
  featureList: [
    "Searches LinkedIn, Indeed, Naukri, Bayt, RemoteOK, AngelList, Glassdoor + company career pages",
    "Gemini AI résumé matching + per-job 0-100 score with explanation",
    "Custom cover letter for every match above 70%",
    "SMTP-validated, bounce-tracked email delivery (cap 200/day)",
    "GDPR-aware market routing (UK, EU)",
    "Runs entirely offline — your résumé and credentials never leave your machine",
    "Daily 9 AM digest with one-click apply links",
  ],
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
  founder: {
    "@type": "Person",
    name: "Darapu Tharakeswara Reddy",
    jobTitle: "Founder & Engineer",
    sameAs: ["https://linkedin.com/in/darapu-tharakeswara-reddy-b9347748"],
  },
  contactPoint: [
    {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: supportEmail,
      telephone: supportPhone,
      areaServed: ["IN", "AE", "SA", "QA", "OM", "BH", "SG", "GB", "DE", "NL", "IE", "SE", "CA", "AU"],
      availableLanguage: ["English", "Hindi", "Telugu"],
    },
  ],
  sameAs: [
    "https://github.com/jobybots",
    "https://www.youtube.com/watch?v=" + demoVideoId,
  ],
};

const websiteLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "JobyBots",
  url: siteUrl,
  potentialAction: {
    "@type": "SearchAction",
    target: `${siteUrl}/?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

const videoLd = {
  "@context": "https://schema.org",
  "@type": "VideoObject",
  name: "JobyBots — Your AI Job Hunter. 24/7. Live demo.",
  description:
    "Watch JobyBots scan LinkedIn, score every job with Gemini AI, validate recruiter emails, and send 200 personalised applications a day — running entirely on a laptop.",
  thumbnailUrl: demoThumbUrl,
  uploadDate: "2026-05-21",
  contentUrl: demoVideoUrl,
  embedUrl: demoEmbedUrl,
  publisher: {
    "@type": "Organization",
    name: "JobyBots",
    logo: { "@type": "ImageObject", url: `${siteUrl}/jobybots-logo.png` },
  },
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
        <link rel="preconnect" href="https://i.ytimg.com" />
        <link rel="dns-prefetch" href="https://www.youtube-nocookie.com" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(videoLd) }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-surface text-ink font-sans antialiased">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <ScrollBot />
      </body>
    </html>
  );
}
