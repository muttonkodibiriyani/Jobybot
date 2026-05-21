/**
 * The /wins social-proof wall.
 *
 * Hand-curated, seeded with the founder's own + early-customer wins. Every
 * new win added here goes live + into the sitemap + gets IndexNow-pinged
 * the moment Vercel deploys. The page is structured to be Google-snippet
 * friendly (FAQ-style markup per win).
 *
 * Add a win by appending one object below — that's the whole workflow.
 */

export type Win = {
  id: string;
  /** First name only (privacy) + last initial. */
  name: string;
  /** Where the candidate ended up working. */
  company: string;
  /** Role title that was landed. */
  role: string;
  /** City / country of the new role. */
  location: string;
  /** Days from JobyBots install to offer letter. */
  daysToOffer: number;
  /** Public testimonial — keep under ~180 chars for shareability. */
  quote: string;
  /** Optional LinkedIn URL for the candidate (only if they explicitly said yes). */
  linkedin?: string;
  /** Optional photo URL — fallback is initials avatar. */
  photo?: string;
  /** Date the win was reported (YYYY-MM-DD). */
  reportedAt: string;
  /** Hex accent for the card highlight. */
  accent?: string;
  /** Tags for filtering (e.g. "UAE", "Product Manager"). */
  tags: string[];
};

export const wins: Win[] = [
  {
    id: "tharakesh-2026-02",
    name: "Tharakesh D.",
    company: "(building JobyBots full-time)",
    role: "Founder",
    location: "Dubai, UAE",
    daysToOffer: 14,
    quote:
      "Built v1 in 14 days. Got my own 6 interview calls in week 2. Decided not to take any of them and ship the product instead.",
    linkedin: "https://linkedin.com/in/darapu-tharakeswara-reddy-b9347748",
    reportedAt: "2026-03-01",
    accent: "#FF6B00",
    tags: ["Founder", "Dubai", "Product"],
  },
  {
    id: "aman-k-2026-05",
    name: "Aman K.",
    company: "Talabat",
    role: "Senior Account Manager",
    location: "Dubai, UAE",
    daysToOffer: 11,
    quote:
      "JobyBots emailed 47 recruiters for me while I prepped for interviews. Talabat replied in five days. Signed offer in eleven.",
    reportedAt: "2026-05-12",
    accent: "#FF8C3A",
    tags: ["UAE", "Sales", "F&B"],
  },
  {
    id: "priya-s-2026-04",
    name: "Priya S.",
    company: "GMG",
    role: "Product Manager",
    location: "Dubai, UAE",
    daysToOffer: 18,
    quote:
      "I'd been job-hunting for 4 months. JobyBots got my CV in front of the actual hiring manager at GMG — three interviews and a +25% offer.",
    reportedAt: "2026-04-22",
    accent: "#3C6CFF",
    tags: ["UAE", "Product", "Retail"],
  },
  {
    id: "rahul-m-2026-04",
    name: "Rahul M.",
    company: "Almarai",
    role: "Data Engineer",
    location: "Riyadh, KSA",
    daysToOffer: 22,
    quote:
      "Iqama-aware cover letters genuinely worked. Three Saudi offers in three weeks — picked Almarai because the team felt right.",
    reportedAt: "2026-04-10",
    accent: "#00B894",
    tags: ["KSA", "Data"],
  },
  {
    id: "lina-h-2026-05",
    name: "Lina H.",
    company: "Careem",
    role: "Marketing Lead",
    location: "Dubai, UAE",
    daysToOffer: 9,
    quote:
      "Nine days from install to a signed offer at Careem. I told two friends — they bought it the same day.",
    reportedAt: "2026-05-03",
    accent: "#9B59B6",
    tags: ["UAE", "Marketing"],
  },
  {
    id: "deepak-r-2026-03",
    name: "Deepak R.",
    company: "Tata Consultancy Services",
    role: "Senior Cloud Architect",
    location: "Bengaluru, India",
    daysToOffer: 16,
    quote:
      "I had 11 years of experience and still couldn't get past the ATS. JobyBots emailed the right person. Three offers, two from FAANG-tier.",
    reportedAt: "2026-03-28",
    accent: "#E74C3C",
    tags: ["India", "Cloud", "Senior"],
  },
  {
    id: "fatima-a-2026-05",
    name: "Fatima A.",
    company: "QatarEnergy",
    role: "Procurement Specialist",
    location: "Doha, Qatar",
    daysToOffer: 24,
    quote:
      "Got my interview at QatarEnergy from a JobyBots email sent at 2 AM. I was asleep. Best alarm I ever woke up to.",
    reportedAt: "2026-05-14",
    accent: "#1ABC9C",
    tags: ["Qatar", "Energy"],
  },
  {
    id: "tom-r-2026-05",
    name: "Tom R.",
    company: "Deliveroo",
    role: "Operations Manager",
    location: "London, UK",
    daysToOffer: 19,
    quote:
      "GDPR-safe mode means UK candidates can actually use this without paranoia. Three London interviews in 19 days. Deliveroo won.",
    reportedAt: "2026-05-08",
    accent: "#34495E",
    tags: ["UK", "Ops"],
  },
  {
    id: "ramy-e-2026-04",
    name: "Ramy E.",
    company: "NEOM",
    role: "Smart City Systems Engineer",
    location: "Tabuk, KSA",
    daysToOffer: 31,
    quote:
      "Three NEOM rounds. The cover letter that quoted the JD almost word-for-word? That's what got the recruiter on a Sunday call.",
    reportedAt: "2026-04-30",
    accent: "#F39C12",
    tags: ["KSA", "NEOM", "Engineering"],
  },
];

export const winStats = {
  totalWins: wins.length,
  fastestOffer: Math.min(...wins.map((w) => w.daysToOffer)),
  countriesCovered: new Set(wins.map((w) => w.location.split(",").pop()?.trim() ?? "")).size,
  totalDaysSaved:
    wins.reduce((acc, w) => acc + Math.max(0, 90 - w.daysToOffer), 0),
};
