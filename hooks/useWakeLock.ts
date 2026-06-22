"use client";

import { useEffect, useRef } from "react";

type WakeLockSentinelLike = { release: () => Promise<void> } | null;

/**
 * Hold a screen wake lock while `active` is true. Re-acquires the lock when the
 * page becomes visible again (locks are dropped on tab switch). Fails silently
 * where the API is unsupported.
 */
export function useWakeLock(active: boolean) {
  const sentinelRef = useRef<WakeLockSentinelLike>(null);

  useEffect(() => {
    let cancelled = false;

    const request = async () => {
      if (!active) return;
      const nav = navigator as Navigator & {
        wakeLock?: { request: (type: "screen") => Promise<WakeLockSentinelLike> };
      };
      if (!nav.wakeLock) return;
      try {
        const sentinel = await nav.wakeLock.request("screen");
        if (cancelled) {
          await sentinel?.release();
        } else {
          sentinelRef.current = sentinel;
        }
      } catch {
        /* lock denied — ignore */
      }
    };

    const onVisibility = () => {
      if (active && document.visibilityState === "visible") void request();
    };

    if (active) void request();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
      try {
        void sentinelRef.current?.release();
      } catch {
        /* ignore */
      }
      sentinelRef.current = null;
    };
  }, [active]);
}
