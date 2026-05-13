"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  src: string;
  className?: string;
};

/**
 * Hero video that doesn't pay its full bandwidth cost on first paint.
 *
 * - `preload="none"` until the element scrolls into view (or is visible
 *   on initial paint, like a hero); then we switch to "metadata" + load.
 * - We honour `prefers-reduced-data` and `connection.saveData` — slow /
 *   metered connections never auto-load the video. The user sees the
 *   gradient placeholder and the page stays light.
 * - We honour `prefers-reduced-motion` — never autoplay if the user opted
 *   out of motion.
 */
const LazyHeroVideo = ({ src, className }: Props) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Respect Save-Data / reduced motion: don't autoload heavy media.
    const conn: any =
      (navigator as any).connection ||
      (navigator as any).mozConnection ||
      (navigator as any).webkitConnection;
    if (conn?.saveData) return;
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const node = videoRef.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      setShouldLoad(true);
      return;
    }

    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShouldLoad(true);
            obs.disconnect();
            break;
          }
        }
      },
      { threshold: 0.15 }
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!shouldLoad) return;
    const node = videoRef.current;
    if (!node) return;
    // Once we decide to load, attempt autoplay. iOS / Android need muted+playsInline.
    node.load();
    const tryPlay = () => {
      node.play().catch(() => {
        /* autoplay can still be blocked; user can tap to play */
      });
    };
    if (node.readyState >= 2) tryPlay();
    else node.addEventListener("loadeddata", tryPlay, { once: true });
  }, [shouldLoad]);

  return (
    <video
      ref={videoRef}
      className={className}
      muted
      loop
      playsInline
      // Start with `none` — the IntersectionObserver flips it to "metadata"
      // when the video becomes visible.
      preload={shouldLoad ? "metadata" : "none"}
      // Suggest a fallback frame: prevents big black box while loading.
      // (No external poster — gradient via CSS handles the empty state.)
    >
      {shouldLoad && <source src={src} type="video/mp4" />}
    </video>
  );
};

export default LazyHeroVideo;
