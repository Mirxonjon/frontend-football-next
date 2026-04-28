"use client";

// Minimal react-helmet-async compatibility shim.
// Walks Helmet children at runtime and applies <title>/<meta>/<link> tags
// to document.head from a useEffect. This keeps existing page code working
// while real SEO comes from per-page Next.js `export const metadata` blocks.

import { useEffect, type ReactNode, type ReactElement, Fragment } from "react";

type HelmetProps = { children?: ReactNode };

const flatten = (nodes: ReactNode): ReactElement[] => {
  const out: ReactElement[] = [];
  const visit = (n: ReactNode) => {
    if (n == null || typeof n === "boolean") return;
    if (Array.isArray(n)) {
      n.forEach(visit);
      return;
    }
    if (typeof n === "object" && (n as ReactElement).type) {
      const el = n as ReactElement;
      if (el.type === Fragment) {
        visit((el.props as { children?: ReactNode }).children);
        return;
      }
      out.push(el);
    }
  };
  visit(nodes);
  return out;
};

export const Helmet = ({ children }: HelmetProps) => {
  useEffect(() => {
    if (typeof document === "undefined") return;
    const elements = flatten(children);
    const created: HTMLElement[] = [];
    let prevTitle: string | null = null;

    for (const el of elements) {
      const tag = (typeof el.type === "string" ? el.type : "").toLowerCase();
      const props = (el.props || {}) as Record<string, unknown>;
      if (tag === "title") {
        prevTitle = document.title;
        document.title = String(
          (props as { children?: ReactNode }).children ?? ""
        );
      } else if (tag === "meta" || tag === "link") {
        const node = document.createElement(tag);
        for (const [k, v] of Object.entries(props)) {
          if (v == null || k === "children") continue;
          node.setAttribute(k, String(v));
        }
        document.head.appendChild(node);
        created.push(node);
      }
    }

    return () => {
      if (prevTitle != null) document.title = prevTitle;
      created.forEach((n) => n.parentNode?.removeChild(n));
    };
  }, [children]);

  return null;
};

export const HelmetProvider = ({ children }: { children?: ReactNode }) => (
  <>{children}</>
);
