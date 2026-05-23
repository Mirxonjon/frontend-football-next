import { Suspense, type ReactNode } from "react";
import Header from "@/components/ui/Header/Header";

export const dynamic = "force-dynamic";

export default function WithHeaderLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Suspense fallback={null}>
        <Header />
      </Suspense>
      {/* <main> landmark — required for accessibility (Lighthouse "no main landmark")
          and lets screen readers skip past the header to the page content. */}
      <main>{children}</main>
    </>
  );
}
