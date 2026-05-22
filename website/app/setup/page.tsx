import type { Metadata } from "next";
import { SetupWizard } from "@/components/SetupWizard";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://jobybots.com";

export const metadata: Metadata = {
  title: "Setup wizard · Generate your personal JobyBots .env in 2 minutes",
  description:
    "A friendly 5-step wizard that turns your Gmail App Password, Gemini API key, resume and target roles into a personalised configuration file. Runs entirely in your browser — your credentials never touch our servers.",
  alternates: { canonical: `${SITE_URL}/setup` },
  robots: { index: true, follow: true },
  openGraph: {
    title: "JobyBots Setup Wizard — generate your .env in your browser",
    description:
      "Local-first config builder. Your Gmail password, Gemini key and resume stay on your machine. We never see them.",
    url: `${SITE_URL}/setup`,
    type: "website",
  },
};

const howToLd = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "Configure JobyBots in 5 steps",
  description:
    "Generate a personalised .env configuration file for JobyBots without your credentials ever leaving your browser.",
  totalTime: "PT2M",
  estimatedCost: { "@type": "MonetaryAmount", currency: "INR", value: "0" },
  supply: [
    { "@type": "HowToSupply", name: "Gmail account with 2FA enabled" },
    { "@type": "HowToSupply", name: "Free Gemini API key from Google AI Studio" },
    { "@type": "HowToSupply", name: "Your résumé as a PDF" },
  ],
  step: [
    { "@type": "HowToStep", name: "Identity", text: "Tell us your name, email, phone, LinkedIn, and one-line summary." },
    { "@type": "HowToStep", name: "Gmail", text: "Paste your Gmail address and 16-digit App Password." },
    { "@type": "HowToStep", name: "AI key", text: "Paste your free Gemini API key from Google AI Studio." },
    { "@type": "HowToStep", name: "Targeting", text: "Pick your target job titles and markets (UAE, Saudi, Qatar, India, UK, etc.)." },
    { "@type": "HowToStep", name: "Download", text: "Download your personalised .env file. Drop it into the JobyBots folder. Run Setup.command (Mac) or SETUP_FOR_FRIENDS.bat (Windows)." },
  ],
};

export default function SetupPage() {
  return (
    <>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToLd) }}
      />
      <SetupWizard />
    </>
  );
}
