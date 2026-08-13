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
    default: "Coach Hub — Futbol murabbiylari platformasi",
    template: "%s — Coach Hub",
  },
  description:
    "Yaxshi futbol murabbiyi boʻlish yoʻli shu yerdan boshlanadi. Strategiyalar, taktika, masterklasslar va amaliy mashgʻulotlar.",
  metadataBase: new URL(SITE_URL),
  applicationName: "Coach Hub",
  keywords: [
    "futbol murabbiy",
    "futbol akademiya",
    "masterklass",
    "mashgʻulot",
    "coach hub",
    "coaching center",
    "futbol taktika",
  ],
  // No site-wide canonical here — that would force every page to declare
  // the homepage as its own canonical, which makes Google collapse them
  // and rank /plans, /masterclass, etc. as the homepage. Each route
  // page.tsx should set its own canonical if it needs one; otherwise
  // Next.js leaves it absent and Google uses the request URL.
  openGraph: {
    title: "Coach Hub — Futbol murabbiylari platformasi",
    description:
      "Strategiyalar, taktika, masterklasslar va amaliy mashgʻulotlar.",
    // Intentionally NO `url` here — same canonical reasoning as above. Per-page
    // metadata can override it; otherwise crawlers use the request URL.
    siteName: "Coach Hub",
    type: "website",
    locale: "uz_UZ",
  },
  twitter: {
    card: "summary_large_image",
    title: "Coach Hub",
    description: "Futbol murabbiylari uchun taʼlim platformasi.",
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
      name: "Coach Hub",
      url: SITE_URL,
      logo: `${SITE_URL}/icon-512.png`,
      description:
        "Futbol murabbiylari uchun strategiya, taktika va masterklasslar platformasi.",
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "Coach Hub",
      publisher: { "@id": `${SITE_URL}/#organization` },
      inLanguage: "uz",
    },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="uz">
      <head>
        {/* Pre-warm the TCP/TLS handshake for the two hosts that block the
            hero render: the API (covers, lesson data) and the GCS bucket
            that serves the hero video. Saves ~100-300 ms on LCP. */}
        <link rel="preconnect" href="https://api.coaching-center.uz" crossOrigin="" />
        <link rel="dns-prefetch" href="https://api.coaching-center.uz" />
        <link rel="preconnect" href="https://storage.googleapis.com" crossOrigin="" />
        <link rel="dns-prefetch" href="https://storage.googleapis.com" />
      </head>
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
