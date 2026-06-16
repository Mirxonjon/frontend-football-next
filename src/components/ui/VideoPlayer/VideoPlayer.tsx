"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  CaretRightFilled,
  PauseOutlined,
  SoundFilled,
  AudioMutedOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  ThunderboltOutlined,
  PicCenterOutlined,
  LoadingOutlined,
  ReloadOutlined,
  FastForwardOutlined,
  FastBackwardOutlined,
} from "@ant-design/icons";
import s from "./VideoPlayer.module.scss";

export type VideoPlayerProps = {
  src: string;
  duration?: number | null;
  startAt?: number;
  onEnded?: () => void;
  onProgress?: (currentSec: number, totalSec: number) => void;
  onUrlExpired?: () => void;
  poster?: string;
  className?: string;
  style?: CSSProperties;
};

const PLAYBACK_RATES = [0.5, 1, 1.25, 1.5, 2] as const;

const formatTime = (sec: number): string => {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const total = Math.floor(sec);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
};

const VideoPlayer = ({
  src,
  duration: durationProp,
  startAt,
  onEnded,
  onProgress,
  onUrlExpired,
  poster,
  className,
  style,
}: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastProgressEmitRef = useRef<number>(0);
  const lastTapTimeRef = useRef<number>(0);
  const lastTapSideRef = useRef<"left" | "right" | null>(null);
  const startedRef = useRef<boolean>(false);
  const autoRetriedRef = useRef<boolean>(false);
  const lastSrcRef = useRef<string>("");

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(durationProp ?? 0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [rate, setRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [loading, setLoading] = useState(true);
  const [waiting, setWaiting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [speedMenuOpen, setSpeedMenuOpen] = useState(false);
  const [skipHint, setSkipHint] = useState<"forward" | "back" | null>(null);

  const showControls = useCallback((auto = true) => {
    setControlsVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (!auto) return;
    if (!playing) return;
    hideTimerRef.current = setTimeout(() => setControlsVisible(false), 3000);
  }, [playing]);

  // Reset on src change + watchdog timeout if metadata never arrives
  useEffect(() => {
    setLoading(true);
    setError(null);
    setCurrentTime(0);
    setBuffered(0);
    startedRef.current = false;
    lastProgressEmitRef.current = 0;

    // NOTE: do NOT reset `autoRetriedRef` when src changes — a parent refetch
    // produces a NEW signed URL even when the underlying file is broken,
    // which would loop forever if we re-armed auto-retry every time.
    // Manual user retry (button click) is the only path that re-arms it.
    lastSrcRef.current = src;

    if (!src || !src.trim()) {
      setLoading(false);
      setError("Video havolasi mavjud emas");
      return;
    }

    const timeoutId = setTimeout(() => {
      const v = videoRef.current;
      // If metadata still hasn't loaded after 15s, treat as failed.
      if (v && v.readyState < 1) {
        setError("Video yuklanmadi (vaqt tugadi)");
        setLoading(false);
        setWaiting(false);
      }
    }, 15000);

    return () => clearTimeout(timeoutId);
  }, [src]);

  // Auto-hide on play
  useEffect(() => {
    showControls();
  }, [playing, showControls]);

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  // Fullscreen change listener
  useEffect(() => {
    const handler = () => {
      const fs = document.fullscreenElement === wrapRef.current;
      setIsFullscreen(fs);
    };
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // Video event handlers
  const handleLoadedMetadata = () => {
    const v = videoRef.current;
    if (!v) return;
    if (Number.isFinite(v.duration) && v.duration > 0) setDuration(v.duration);
    setLoading(false);
    if (startAt && !startedRef.current && Number.isFinite(startAt)) {
      try {
        v.currentTime = Math.max(0, Math.min(startAt, v.duration || startAt));
      } catch {
        /* noop */
      }
      startedRef.current = true;
    }
  };

  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (!v) return;
    setCurrentTime(v.currentTime);
    const now = performance.now();
    if (onProgress && now - lastProgressEmitRef.current > 5000) {
      lastProgressEmitRef.current = now;
      onProgress(v.currentTime, v.duration || duration || 0);
    }
  };

  const handleProgress = () => {
    const v = videoRef.current;
    if (!v || v.buffered.length === 0) return;
    setBuffered(v.buffered.end(v.buffered.length - 1));
  };

  const handlePlay = () => setPlaying(true);
  const handlePause = () => setPlaying(false);
  const handleWaiting = () => setWaiting(true);
  const handlePlaying = () => setWaiting(false);
  const handleEnded = () => {
    setPlaying(false);
    if (onProgress && videoRef.current) {
      onProgress(videoRef.current.duration, videoRef.current.duration);
    }
    onEnded?.();
  };

  const handleError = () => {
    const v = videoRef.current;
    const code = v?.error?.code;
    // If we still have an auto-refresh budget, kick it off and stay in
    // "loading" — don't flash a scary error message at the user. The
    // expired-signed-URL case (403) is silently recovered: parent will
    // refetch the lesson and a fresh signed URL flows back in.
    if (!autoRetriedRef.current && onUrlExpired) {
      autoRetriedRef.current = true;
      setError(null);
      setLoading(true);
      setWaiting(false);
      onUrlExpired();
      return;
    }
    // No more retries — show the user something real.
    setError(code ? `Video yuklanmadi (xato ${code})` : "Video yuklanmadi");
    setLoading(false);
    setWaiting(false);
  };

  // Control actions
  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      void v.play().catch(() => {});
    } else {
      v.pause();
    }
  }, []);

  const seekBy = useCallback((delta: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(
      0,
      Math.min((v.duration || duration || 0), v.currentTime + delta)
    );
    if (delta > 0) {
      setSkipHint("forward");
      setTimeout(() => setSkipHint(null), 600);
    } else {
      setSkipHint("back");
      setTimeout(() => setSkipHint(null), 600);
    }
  }, [duration]);

  const seekTo = useCallback((sec: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(sec, v.duration || duration || 0));
  }, [duration]);

  const changeVolume = useCallback((v: number) => {
    const vid = videoRef.current;
    if (!vid) return;
    const next = Math.max(0, Math.min(1, v));
    vid.volume = next;
    setVolume(next);
    if (next > 0 && muted) {
      vid.muted = false;
      setMuted(false);
    }
  }, [muted]);

  const toggleMute = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  }, []);

  const setPlaybackRate = useCallback((r: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.playbackRate = r;
    setRate(r);
    setSpeedMenuOpen(false);
  }, []);

  const togglePiP = useCallback(async () => {
    const v = videoRef.current;
    if (!v) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if ((v as any).requestPictureInPicture) {
        await (v as any).requestPictureInPicture();
      }
    } catch {
      /* noop */
    }
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await wrap.requestFullscreen();
        const orient = (screen as any).orientation;
        if (orient && typeof orient.lock === "function") {
          try {
            await orient.lock("landscape");
          } catch {
            /* may fail on desktop or non-https — ignore */
          }
        }
      }
    } catch {
      /* noop */
    }
  }, []);

  const retry = useCallback(() => {
    setError(null);
    setLoading(true);
    // Manual retry: allow another auto-refresh chance after this attempt.
    autoRetriedRef.current = false;
    onUrlExpired?.();
    const v = videoRef.current;
    if (v) {
      v.load();
    }
  }, [onUrlExpired]);

  // Keyboard shortcuts (only when wrapper is hovered/focused)
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (!wrap.contains(document.activeElement) && !wrap.matches(":hover")) return;
      switch (e.key) {
        case " ":
        case "k":
        case "K":
          e.preventDefault();
          togglePlay();
          showControls();
          break;
        case "ArrowRight":
          e.preventDefault();
          seekBy(5);
          showControls();
          break;
        case "ArrowLeft":
          e.preventDefault();
          seekBy(-5);
          showControls();
          break;
        case "ArrowUp":
          e.preventDefault();
          changeVolume(volume + 0.05);
          showControls();
          break;
        case "ArrowDown":
          e.preventDefault();
          changeVolume(volume - 0.05);
          showControls();
          break;
        case "f":
        case "F":
          e.preventDefault();
          void toggleFullscreen();
          break;
        case "m":
        case "M":
          e.preventDefault();
          toggleMute();
          showControls();
          break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [togglePlay, seekBy, changeVolume, toggleMute, toggleFullscreen, showControls, volume]);

  // Mobile double-tap → 10s skip
  const handleVideoClick = useCallback(
    (e: React.MouseEvent) => {
      const wrap = wrapRef.current;
      if (!wrap) return;
      const rect = wrap.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const side: "left" | "right" = x < rect.width / 2 ? "left" : "right";
      const now = Date.now();
      if (
        now - lastTapTimeRef.current < 350 &&
        lastTapSideRef.current === side
      ) {
        if (side === "left") seekBy(-10);
        else seekBy(10);
        lastTapTimeRef.current = 0;
        lastTapSideRef.current = null;
        return;
      }
      lastTapTimeRef.current = now;
      lastTapSideRef.current = side;
      // Single tap on desktop = play/pause; on mobile, the double-tap may
      // trigger this once before being detected. Fine.
      if (window.matchMedia("(hover: hover)").matches) {
        togglePlay();
      } else {
        showControls();
      }
    },
    [seekBy, togglePlay, showControls]
  );

  // Click outside speed menu to close
  useEffect(() => {
    if (!speedMenuOpen) return;
    const handler = (e: MouseEvent) => {
      const wrap = wrapRef.current;
      if (!wrap) return;
      const target = e.target as Node;
      if (wrap.contains(target)) {
        // close on outside-of-menu click within wrap
        const menu = wrap.querySelector<HTMLElement>(`.${s.speedMenu}`);
        if (menu && !menu.contains(target)) setSpeedMenuOpen(false);
      } else {
        setSpeedMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [speedMenuOpen]);

  const progressPct = useMemo(() => {
    if (!duration || duration <= 0) return 0;
    return (currentTime / duration) * 100;
  }, [currentTime, duration]);

  const bufferedPct = useMemo(() => {
    if (!duration || duration <= 0) return 0;
    return Math.min(100, (buffered / duration) * 100);
  }, [buffered, duration]);

  const onProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const bar = e.currentTarget;
    const rect = bar.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    seekTo(pct * duration);
  };

  return (
    <div
      ref={wrapRef}
      className={`${s.root} ${className ?? ""} ${controlsVisible ? s.showControls : ""} ${isFullscreen ? s.fullscreen : ""}`}
      style={style}
      onMouseMove={() => showControls()}
      onMouseLeave={() => playing && setControlsVisible(false)}
      tabIndex={0}
    >
      <video
        ref={videoRef}
        className={s.video}
        src={src}
        poster={poster}
        playsInline
        preload="metadata"
        crossOrigin="anonymous"
        {...({ referrerPolicy: "no-referrer" } as any)}
        controlsList="nodownload"
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onProgress={handleProgress}
        onPlay={handlePlay}
        onPause={handlePause}
        onWaiting={handleWaiting}
        onPlaying={handlePlaying}
        onEnded={handleEnded}
        onError={handleError}
        onClick={handleVideoClick}
      />

      {/* Loading / buffering / error overlays */}
      {loading && !error && (
        <div className={s.loadingOverlay}>
          <LoadingOutlined className={s.spinnerLg} />
          <div className={s.loadingText}>Yuklanmoqda…</div>
        </div>
      )}
      {waiting && !loading && !error && (
        <div className={s.bufferIndicator}>
          <LoadingOutlined />
        </div>
      )}
      {error && (
        <div className={s.errorOverlay}>
          <div className={s.errorTitle}>{error}</div>
          <button type="button" className={s.retryBtn} onClick={retry}>
            <ReloadOutlined /> Qayta urinish
          </button>
        </div>
      )}

      {/* Skip hints (double-tap feedback) */}
      {skipHint === "forward" && (
        <div className={`${s.skipHint} ${s.skipRight}`}>
          <FastForwardOutlined /> +10s
        </div>
      )}
      {skipHint === "back" && (
        <div className={`${s.skipHint} ${s.skipLeft}`}>
          <FastBackwardOutlined /> −10s
        </div>
      )}

      {/* Big play button when paused */}
      {!playing && !loading && !error && (
        <button
          type="button"
          className={s.bigPlay}
          onClick={(e) => {
            e.stopPropagation();
            togglePlay();
          }}
          aria-label="Play"
        >
          <CaretRightFilled />
        </button>
      )}

      {/* Controls bar */}
      <div
        className={s.controls}
        onClick={(e) => e.stopPropagation()}
        onMouseEnter={() => showControls(false)}
      >
        {/* Progress bar */}
        <div
          className={s.progressTrack}
          onClick={onProgressBarClick}
          role="slider"
          aria-valuemin={0}
          aria-valuemax={duration}
          aria-valuenow={currentTime}
        >
          <div className={s.progressBuffer} style={{ width: `${bufferedPct}%` }} />
          <div className={s.progressFilled} style={{ width: `${progressPct}%` }}>
            <span className={s.progressDot} />
          </div>
        </div>

        <div className={s.bottomRow}>
          <div className={s.left}>
            <button
              type="button"
              className={s.iconBtn}
              onClick={togglePlay}
              aria-label={playing ? "Pause" : "Play"}
            >
              {playing ? <PauseOutlined /> : <CaretRightFilled />}
            </button>

            <div className={s.volumeGroup}>
              <button
                type="button"
                className={s.iconBtn}
                onClick={toggleMute}
                aria-label={muted ? "Unmute" : "Mute"}
              >
                {muted || volume === 0 ? <AudioMutedOutlined /> : <SoundFilled />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={muted ? 0 : volume}
                onChange={(e) => changeVolume(Number(e.target.value))}
                className={s.volumeSlider}
                aria-label="Volume"
              />
            </div>

            <div className={s.time}>
              <span>{formatTime(currentTime)}</span>
              <span className={s.timeSep}>/</span>
              <span className={s.timeTotal}>
                {formatTime(duration || durationProp || 0)}
              </span>
            </div>
          </div>

          <div className={s.right}>
            <div className={s.speedWrap}>
              <button
                type="button"
                className={`${s.iconBtn} ${rate !== 1 ? s.iconBtnActive : ""}`}
                onClick={() => setSpeedMenuOpen((o) => !o)}
                aria-label="Playback speed"
                aria-expanded={speedMenuOpen}
              >
                <ThunderboltOutlined />
                <span className={s.rateLabel}>{rate}x</span>
              </button>
              {speedMenuOpen && (
                <div className={s.speedMenu} role="menu">
                  {PLAYBACK_RATES.map((r) => (
                    <button
                      type="button"
                      key={r}
                      className={`${s.speedItem} ${r === rate ? s.speedItemActive : ""}`}
                      onClick={() => setPlaybackRate(r)}
                      role="menuitemradio"
                      aria-checked={r === rate}
                    >
                      {r}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              className={s.iconBtn}
              onClick={togglePiP}
              aria-label="Picture in Picture"
              title="Picture in Picture"
            >
              <PicCenterOutlined />
            </button>

            <button
              type="button"
              className={s.iconBtn}
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? (
                <FullscreenExitOutlined />
              ) : (
                <FullscreenOutlined />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
