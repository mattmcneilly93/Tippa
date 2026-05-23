"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

const REFRESH_THRESHOLD = 72;
const MAX_PULL = 96;

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

  return (
    <div
      className="pointer-events-none fixed left-1/2 top-16 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border bg-background px-4 py-2 text-sm font-bold shadow-md transition-transform"
      style={{ transform: `translate(-50%, ${Math.min(pullDistance, MAX_PULL)}px)` }}
      aria-live="polite"
    >
      <RefreshCw
        className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
        style={{ transform: refreshing ? undefined : `rotate(${pullDistance * 3}deg)` }}
      />
      {refreshing ? "Refreshing" : pullDistance >= REFRESH_THRESHOLD ? "Release" : "Pull"}
    </div>
  );
}
