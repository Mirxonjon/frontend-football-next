"use client";

import { useEffect, type ReactNode } from "react";
import { Provider as ReduxProvider } from "react-redux";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { HelmetProvider } from "@/lib/helmet-compat";
import { store } from "@/store/config-store";

export default function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    let cancelled = false;
    import("aos").then((mod) => {
      if (cancelled) return;
      mod.default.init();
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AntdRegistry>
      <HelmetProvider>
        <ReduxProvider store={store}>{children}</ReduxProvider>
      </HelmetProvider>
    </AntdRegistry>
  );
}
