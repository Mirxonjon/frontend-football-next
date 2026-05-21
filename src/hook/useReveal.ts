"use client";

import { useCallback, useRef, useState } from "react";

/**
 * Scroll-reveal hook backed by ONE shared IntersectionObserver per page.
 *
 * Uses a callback ref so it fires the moment the element actually mounts —
 * which matters for sections rendered conditionally (e.g. only after an
 * async fetch resolves). A ref-object hook only runs its effect on the
 * parent's mount; by then a late-rendered child's ref is still null and
 * the failsafe timer would never get armed.
 *
 * Usage:
 *   const r = useReveal<HTMLElement>();
 *   <section ref={r.ref} className={r.revealed ? "revealed" : ""}>…</section>
 */

type Callback = (visible: boolean) => void;

let sharedObserver: IntersectionObserver | null = null;
const registry = new Map<Element, Callback>();

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
  const [revealed, setRevealed] = useState(false);
  const currentNode = useRef<T | null>(null);
  const failsafeTimer = useRef<number | null>(null);

  const ref = useCallback((node: T | null) => {
    // Same element — nothing to do.
    if (node === currentNode.current) return;

    // Detaching: clean up any prior observation/timer.
    if (currentNode.current) {
      sharedObserver?.unobserve(currentNode.current);
      registry.delete(currentNode.current);
    }
    if (failsafeTimer.current !== null) {
      window.clearTimeout(failsafeTimer.current);
      failsafeTimer.current = null;
    }

    currentNode.current = node;
    if (!node) return;

    // Already in (or above) the viewport on mount — reveal immediately.
    const rect = node.getBoundingClientRect();
    const vh = window.innerHeight || 0;
    if (rect.top < vh + 80) {
      setRevealed(true);
      return;
    }

    const obs = ensureObserver();
    if (!obs) {
      setRevealed(true);
      return;
    }

    let firedByObserver = false;
    registry.set(node, () => {
      firedByObserver = true;
      setRevealed(true);
    });
    obs.observe(node);

    // Failsafe — guarantees the section never stays invisible.
    failsafeTimer.current = window.setTimeout(() => {
      if (!firedByObserver) setRevealed(true);
    }, 1500);
  }, []);

  return { ref, revealed };
};
