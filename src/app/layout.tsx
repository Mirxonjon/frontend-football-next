import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@/assets/scss/main.scss";
import "@/components/ui/Container/Container.scss";
import "@/components/ui/Header/Header.scss";
import "@/components/ui/Footer/Footer.scss";
import "@/components/ui/LangChange/LangChange.scss";
import Providers from "./providers";

const SITE_URL =
  process.env.NEXT_PUBLIC_APP_ORIGIN || "https://coaching-center.uz";

export const metadata: Metadata = {
  title: {
    default: "Coaching Center — Futbol murabbiylari platformasi",
    template: "%s — Coaching Center",
  },
  description:
    "Yaxshi futbol murabbiyi bo'lish yo'li shu yerdan boshlanadi. Strategiyalar, taktika, masterclasslar va amaliy mashg'ulotlar.",
  metadataBase: new URL(SITE_URL),
  applicationName: "Coaching Center",
  keywords: [
    "futbol murabbiy",
    "futbol akademiya",
    "masterclass",
    "mashg'ulot",
    "coaching center",
    "futbol taktika",
  ],
  // No site-wide canonical here — that would force every page to declare
  // the homepage as its own canonical, which makes Google collapse them
  // and rank /plans, /masterclass, etc. as the homepage. Each route
  // page.tsx should set its own canonical if it needs one; otherwise
  // Next.js leaves it absent and Google uses the request URL.
  openGraph: {
    title: "Coaching Center — Futbol murabbiylari platformasi",
    description:
      "Strategiyalar, taktika, masterclasslar va amaliy mashg'ulotlar.",
    // Intentionally NO `url` here — same canonical reasoning as above. Per-page
    // metadata can override it; otherwise crawlers use the request URL.
    siteName: "Coaching Center",
    type: "website",
    locale: "uz_UZ",
  },
  twitter: {
    card: "summary_large_image",
    title: "Coaching Center",
    description: "Futbol murabbiylari uchun ta'lim platformasi.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

// Site-wide structured data. Static — no API needed — so it's safe to
// emit on every page. Google uses this for the knowledge panel, the
// logo in search results, and the sitelinks search box.
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "Coaching Center",
      url: SITE_URL,
      logo: `${SITE_URL}/icon-512.png`,
      description:
        "Futbol murabbiylari uchun strategiya, taktika va masterclasslar platformasi.",
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "Coaching Center",
      publisher: { "@id": `${SITE_URL}/#organization` },
      inLanguage: "uz",
    },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="uz">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
