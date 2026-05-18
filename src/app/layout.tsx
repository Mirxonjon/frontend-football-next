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
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Coaching Center — Futbol murabbiylari platformasi",
    description:
      "Strategiyalar, taktika, masterclasslar va amaliy mashg'ulotlar.",
    url: SITE_URL,
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
