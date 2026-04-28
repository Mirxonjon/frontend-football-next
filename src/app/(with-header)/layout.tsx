import { Suspense, type ReactNode } from "react";
import Header from "@/components/ui/Header/Header";

export const dynamic = "force-dynamic";

export default function WithHeaderLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Suspense fallback={null}>
        <Header />
      </Suspense>
      {children}
    </>
  );
}
