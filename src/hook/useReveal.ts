"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Scroll-reveal hook backed by ONE shared IntersectionObserver per page.
 * Cheaper than spinning up a fresh observer per element — good for lists
 * and pages with many sections.
 *
 * Usage:
 *   const { ref, revealed } = useReveal<HTMLDivElement>();
 *   <section ref={ref} className={revealed ? "revealed" : ""}>…</section>
 */

type Entry = {
  el: Element;
  callback: (visible: boolean) => void;
};

let sharedObserver: IntersectionObserver | null = null;
const registry = new Map<Element, Entry["callback"]>();

const ensureObserver = (): IntersectionObserver | null => {
  if (typeof IntersectionObserver === "undefined") return null;
  if (sharedObserver) return sharedObserver;
  sharedObserver = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          const cb = registry.get(e.target);
          if (cb) {
            cb(true);
            // Fire once per element — keep the registry small.
            sharedObserver?.unobserve(e.target);
            registry.delete(e.target);
          }
        }
      }
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );
  return sharedObserver;
};

export const useReveal = <T extends HTMLElement = HTMLDivElement>() => {
  const ref = useRef<T | null>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // Cheap pre-check: if the element is already inside (or above) the
    // viewport on mount, reveal it immediately. This avoids a "blank
    // section" when the IntersectionObserver callback is delayed by the
    // browser, especially on slower devices.
    const rect = node.getBoundingClientRect();
    const vh =
      typeof window !== "undefined" ? window.innerHeight : 0;
    if (rect.top < vh + 80) {
      setRevealed(true);
      return;
    }

    const obs = ensureObserver();
    if (!obs) {
      setRevealed(true);
      return;
    }

    let revealedHere = false;
    registry.set(node, () => {
      revealedHere = true;
      setRevealed(true);
    });
    obs.observe(node);

    // Failsafe: if the observer hasn't fired in 1.5s (e.g. inside an iframe,
    // the user's browser throttled callbacks, or some odd CSS clip),
    // force the reveal so the section never stays invisible.
    const timer = window.setTimeout(() => {
      if (!revealedHere) setRevealed(true);
    }, 1500);

    return () => {
      window.clearTimeout(timer);
      obs.unobserve(node);
      registry.delete(node);
    };
  }, []);

  return { ref, revealed };
};
