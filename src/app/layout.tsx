import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@/assets/scss/main.scss";
import "@/components/ui/Container/Container.scss";
import "@/components/ui/Header/Header.scss";
import "@/components/ui/Footer/Footer.scss";
import "@/components/ui/LangChange/LangChange.scss";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "Coaching Zona — Murabbiylar markazi platformasi",
  description:
    "Yaxshi futbol murabbiyi bo'lish yo'li shu erdan boshlanadi. Strategiyalar, taktika va amaliy mashg'ulotlar.",
  metadataBase: new URL("https://coachingzona.uz"),
  openGraph: {
    title: "Coaching Zona",
    description: "Murabbiylar markazi platformasi",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="uz">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
