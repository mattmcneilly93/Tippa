"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

const REFRESH_THRESHOLD = 72;
const MAX_PULL = 88;

function isStandaloneDisplay() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && Boolean(navigator.standalone))
  );
}

function supportsTouch() {
  return window.matchMedia("(pointer: coarse)").matches;
}

export function PullToRefresh() {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!supportsTouch() || !isStandaloneDisplay()) return;

    let startY: number | null = null;
    let latestPull = 0;

    const onTouchStart = (event: TouchEvent) => {
      if (window.scrollY > 0 || event.touches.length !== 1) {
        startY = null;
        latestPull = 0;
        return;
      }

      startY = event.touches[0].clientY;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (startY == null || window.scrollY > 0 || event.touches.length !== 1) return;

      const pull = Math.max(0, event.touches[0].clientY - startY);
      latestPull = Math.min(MAX_PULL, pull * 0.55);
      setPullDistance(latestPull);
    };

    const onTouchEnd = () => {
      if (latestPull >= REFRESH_THRESHOLD) {
        setRefreshing(true);
        window.location.reload();
        return;
      }

      startY = null;
      latestPull = 0;
      setPullDistance(0);
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
    };
  }, []);

  if (!pullDistance && !refreshing) return null;

  const progress = refreshing ? 1 : Math.min(1, pullDistance / REFRESH_THRESHOLD);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-50 flex flex-col items-center"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
      aria-live="polite"
    >
      <div className="h-1 w-full bg-transparent">
        <div
          className="mx-auto h-full rounded-full bg-primary transition-[width,opacity]"
          style={{
            opacity: Math.max(0.25, progress),
            width: `${Math.max(12, progress * 100)}%`
          }}
        />
      </div>
      <div
        className="mt-1 flex h-8 w-8 items-center justify-center rounded-full border bg-background/95 shadow-sm transition-opacity"
        style={{ opacity: refreshing || progress >= 0.35 ? 1 : 0 }}
      >
        <RefreshCw
          className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          style={{ transform: refreshing ? undefined : `rotate(${progress * 180}deg)` }}
        />
      </div>
    </div>
  );
}
