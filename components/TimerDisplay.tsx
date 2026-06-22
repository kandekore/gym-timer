"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
} from "react";
import { Phase } from "@/lib/types";
import { formatTime } from "@/lib/format";

const PHASE_LABEL: Record<Phase, string> = {
  idle: "READY",
  getready: "GET READY",
  work: "WORK",
  rest: "REST",
  complete: "COMPLETE",
};

// useLayoutEffect on the client, useEffect on the server (avoids SSR warning).
const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Renders `text` as large as it can possibly be while still fitting inside the
 * available space. Measures the parent box and scales the font so the digits
 * fill it — so the time is readable from across a gym on any screen size.
 */
function FitText({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const spanRef = useRef<HTMLSpanElement>(null);

  useIsoLayoutEffect(() => {
    const box = boxRef.current;
    const span = spanRef.current;
    if (!box || !span) return;

    const fit = () => {
      // Measure at a known reference size, then scale to fill the box.
      span.style.fontSize = "100px";
      const sw = span.offsetWidth || 1;
      const sh = span.offsetHeight || 1;
      const scale = Math.min(box.clientWidth / sw, box.clientHeight / sh);
      // 0.94 leaves a small breathing margin so glyphs never touch the edge.
      const size = Math.max(16, Math.floor(100 * scale * 0.94));
      span.style.fontSize = `${size}px`;
    };

    fit();
    // Refit on container resize, fullscreen toggles and orientation changes.
    const ro = new ResizeObserver(fit);
    ro.observe(box);
    return () => ro.disconnect();
  }, [text]);

  return (
    // flex-1 (not h-full) gives this box a real, resolved height inside the
    // surrounding flex column — percentage heights collapse here.
    <div
      ref={boxRef}
      className="flex min-h-0 w-full flex-1 items-center justify-center overflow-hidden"
    >
      <span
        ref={spanRef}
        className={className}
        style={{ lineHeight: 1, whiteSpace: "nowrap", display: "inline-block" }}
      >
        {text}
      </span>
    </div>
  );
}

interface Props {
  phase: Phase;
  isWarning: boolean;
  remainingSeconds: number;
  currentRound: number;
  totalRounds: number;
  label?: string;
  isFinalRound: boolean;
  awaiting: boolean;
  manual: boolean;
  title: string;
}

export function TimerDisplay({
  phase,
  isWarning,
  remainingSeconds,
  currentRound,
  totalRounds,
  label,
  isFinalRound,
  awaiting,
  manual,
  title,
}: Props) {
  const showRound = phase === "work" || phase === "rest";
  const headline = isWarning ? "HURRY" : PHASE_LABEL[phase];

  return (
    <div className="flex min-h-0 w-full flex-1 select-none flex-col items-center justify-center gap-1 text-center leading-none">
      {phase === "idle" && title && (
        <div className="text-2xl font-semibold opacity-80 sm:text-4xl">
          {title}
        </div>
      )}

      <div className="shrink-0 text-4xl font-extrabold uppercase tracking-[0.2em] opacity-95 sm:text-6xl md:text-7xl">
        {headline}
      </div>

      {showRound && (
        <div className="shrink-0 text-2xl font-bold opacity-90 sm:text-4xl md:text-5xl">
          Round {currentRound} of {totalRounds}
          {isFinalRound && (
            <span className="ml-2 rounded-lg bg-black/30 px-2 py-0.5 align-middle text-lg font-extrabold tracking-wide sm:text-2xl">
              FINAL
            </span>
          )}
        </div>
      )}

      {label && phase === "work" && (
        <div className="shrink-0 text-xl font-semibold opacity-80 sm:text-3xl md:text-4xl">
          {label}
        </div>
      )}

      {/* The clock fills all remaining space, as large as it will go.
          The text-[…] classes are a large fallback size so the digits are
          never tiny if the fit script hasn't run yet — FitText overrides them
          with an exact pixel size via inline style once it measures. */}
      <FitText
        text={phase === "complete" ? "✓" : formatTime(remainingSeconds)}
        className="font-black tabular-nums text-[20vw] sm:text-[18vw]"
      />

      {awaiting && manual && (
        <div className="shrink-0 animate-pulse text-xl font-bold sm:text-3xl">
          Tap “Next ▸” to continue
        </div>
      )}
    </div>
  );
}
