import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Jobybot — Your 24/7 job search on your laptop",
  description:
    "Search LinkedIn, Indeed, Bayt and more every hour. Send tailored recruiter emails with your resume. UAE, India, and global markets.",
  openGraph: {
    title: "Jobybot",
    description: "Automated job search + recruiter outreach on your PC.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
