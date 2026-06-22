"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CueType, Phase, Segment, TimerSettings } from "@/lib/types";
import { buildSegments } from "@/lib/segments";

export type TimerStatus = "idle" | "running" | "paused" | "complete";

interface Params {
  settings: TimerSettings;
  onCue?: (cue: CueType, seg?: Segment, value?: number) => void;
}

/**
 * Core timer engine.
 *
 * Accuracy: instead of decrementing a counter every tick (which drifts), we
 * store an absolute `deadline` timestamp and derive the remaining time from
 * `performance.now()`. This keeps pause/resume exact and self-corrects if the
 * tab is throttled in the background.
 *
 * Mutable engine state lives in refs (read by the interval callback) and is
 * mirrored into React state for rendering.
 */
export function useIntervalTimer({ settings, onCue }: Params) {
  const [segments, setSegmentsState] = useState<Segment[]>(() =>
    buildSegments(settings)
  );
  const [status, setStatus] = useState<TimerStatus>("idle");
  const [index, setIndex] = useState(0);
  const [remainingMs, setRemainingMs] = useState<number>(
    () => (buildSegments(settings)[0]?.duration ?? 0) * 1000
  );
  const [awaiting, setAwaiting] = useState(false);

  const segmentsRef = useRef<Segment[]>(segments);
  const indexRef = useRef(0);
  const statusRef = useRef<TimerStatus>("idle");
  const remainingRef = useRef(remainingMs);
  const deadlineRef = useRef(0);
  const awaitingRef = useRef(false);
  const manualRef = useRef(settings.manualMode);
  const onCueRef = useRef(onCue);
  const firedRef = useRef({ ten: false, c3: false, c2: false, c1: false });

  // Keep "live" refs current on every render.
  onCueRef.current = onCue;
  manualRef.current = settings.manualMode;

  const setSegments = useCallback((s: Segment[]) => {
    segmentsRef.current = s;
    setSegmentsState(s);
  }, []);

  const resetFired = () => {
    firedRef.current = { ten: false, c3: false, c2: false, c1: false };
  };

  const enterSegment = useCallback((seg: Segment | undefined) => {
    if (!seg) return;
    if (seg.phase === "work") onCueRef.current?.("roundStart", seg);
    else if (seg.phase === "rest") onCueRef.current?.("restStart", seg);
    else if (seg.phase === "getready") onCueRef.current?.("getReady", seg);
  }, []);

  const exitSegment = useCallback((seg: Segment | undefined) => {
    if (!seg) return;
    // A bell marks the end of every work round.
    if (seg.phase === "work") onCueRef.current?.("roundEnd", seg);
  }, []);

  /** Move to a specific segment index (or finish if out of range). */
  const goToSegment = useCallback(
    (next: number) => {
      const segs = segmentsRef.current;
      const current = segs[indexRef.current];
      exitSegment(current);

      if (next >= segs.length) {
        statusRef.current = "complete";
        setStatus("complete");
        remainingRef.current = 0;
        setRemainingMs(0);
        awaitingRef.current = false;
        setAwaiting(false);
        onCueRef.current?.("complete", current);
        return;
      }

      indexRef.current = next;
      setIndex(next);
      const seg = segs[next];
      const durMs = seg.duration * 1000;
      remainingRef.current = durMs;
      setRemainingMs(durMs);
      deadlineRef.current = performance.now() + durMs;
      awaitingRef.current = false;
      setAwaiting(false);
      resetFired();
      enterSegment(seg);
    },
    [enterSegment, exitSegment]
  );

  /** Fire warning + countdown cues at the right moments within a segment. */
  const fireCues = useCallback((remMs: number, seg: Segment) => {
    const secs = remMs / 1000;
    const f = firedRef.current;
    if (
      !f.ten &&
      seg.duration > 11 &&
      secs <= 10 &&
      (seg.phase === "work" || seg.phase === "rest")
    ) {
      f.ten = true;
      onCueRef.current?.("tenSeconds", seg);
    }
    if (!f.c3 && secs <= 3 && secs > 2) {
      f.c3 = true;
      onCueRef.current?.("countdown", seg, 3);
    }
    if (!f.c2 && secs <= 2 && secs > 1) {
      f.c2 = true;
      onCueRef.current?.("countdown", seg, 2);
    }
    if (!f.c1 && secs <= 1 && secs > 0) {
      f.c1 = true;
      onCueRef.current?.("countdown", seg, 1);
    }
  }, []);

  const tick = useCallback(() => {
    if (statusRef.current !== "running") return;
    const now = performance.now();
    const remMs = deadlineRef.current - now;
    const seg = segmentsRef.current[indexRef.current];

    if (remMs <= 0) {
      if (manualRef.current) {
        // Manual mode: hold at zero and wait for the coach to advance.
        if (!awaitingRef.current) {
          awaitingRef.current = true;
          setAwaiting(true);
          remainingRef.current = 0;
          setRemainingMs(0);
        }
        return;
      }
      goToSegment(indexRef.current + 1);
      return;
    }

    remainingRef.current = remMs;
    setRemainingMs(remMs);
    if (seg) fireCues(remMs, seg);
  }, [goToSegment, fireCues]);

  // Drive the engine while running.
  useEffect(() => {
    if (status !== "running") return;
    const id = setInterval(tick, 100);
    return () => clearInterval(id);
  }, [status, tick]);

  // Rebuild the timeline when settings change while idle, so the preview and
  // first-segment time stay in sync with the config panel.
  useEffect(() => {
    if (statusRef.current !== "idle") return;
    const s = buildSegments(settings);
    segmentsRef.current = s;
    setSegmentsState(s);
    indexRef.current = 0;
    setIndex(0);
    const durMs = (s[0]?.duration ?? 0) * 1000;
    remainingRef.current = durMs;
    setRemainingMs(durMs);
  }, [settings]);

  // --- Public controls ---------------------------------------------------

  const start = useCallback(() => {
    // Always start from a freshly built timeline.
    const segs = buildSegments(settings);
    if (segs.length === 0) return;
    segmentsRef.current = segs;
    setSegmentsState(segs);
    indexRef.current = 0;
    setIndex(0);
    resetFired();
    const durMs = segs[0].duration * 1000;
    remainingRef.current = durMs;
    setRemainingMs(durMs);
    deadlineRef.current = performance.now() + durMs;
    awaitingRef.current = false;
    setAwaiting(false);
    statusRef.current = "running";
    setStatus("running");
    enterSegment(segs[0]);
  }, [settings, enterSegment]);

  const pause = useCallback(() => {
    if (statusRef.current !== "running") return;
    remainingRef.current = Math.max(0, deadlineRef.current - performance.now());
    setRemainingMs(remainingRef.current);
    statusRef.current = "paused";
    setStatus("paused");
  }, []);

  const resume = useCallback(() => {
    if (statusRef.current !== "paused") return;
    deadlineRef.current = performance.now() + remainingRef.current;
    statusRef.current = "running";
    setStatus("running");
  }, []);

  const reset = useCallback(() => {
    statusRef.current = "idle";
    setStatus("idle");
    const s = buildSegments(settings);
    segmentsRef.current = s;
    setSegmentsState(s);
    indexRef.current = 0;
    setIndex(0);
    const durMs = (s[0]?.duration ?? 0) * 1000;
    remainingRef.current = durMs;
    setRemainingMs(durMs);
    deadlineRef.current = 0;
    awaitingRef.current = false;
    setAwaiting(false);
    resetFired();
  }, [settings]);

  /** Single button: start / pause / resume depending on state. */
  const toggle = useCallback(() => {
    const st = statusRef.current;
    if (st === "idle" || st === "complete") start();
    else if (st === "running") pause();
    else if (st === "paused") resume();
  }, [start, pause, resume]);

  /** Advance to the next phase (manual "Next" / skip current phase). */
  const next = useCallback(() => {
    const st = statusRef.current;
    if (st === "idle") {
      start();
      return;
    }
    if (st === "complete") return;
    goToSegment(indexRef.current + 1);
  }, [goToSegment, start]);

  /** Jump straight to the next work round. */
  const skipRound = useCallback(() => {
    const st = statusRef.current;
    if (st === "idle" || st === "complete") return;
    const segs = segmentsRef.current;
    let target = -1;
    for (let k = indexRef.current + 1; k < segs.length; k++) {
      if (segs[k].phase === "work") {
        target = k;
        break;
      }
    }
    goToSegment(target === -1 ? segs.length : target);
  }, [goToSegment]);

  /** Skip the current rest, or remove the upcoming rest so work flows on. */
  const skipRest = useCallback(() => {
    const st = statusRef.current;
    if (st === "idle" || st === "complete") return;
    const segs = segmentsRef.current;
    const i = indexRef.current;
    if (segs[i]?.phase === "rest") {
      goToSegment(i + 1);
      return;
    }
    if (segs[i + 1]?.phase === "rest") {
      const ns = [...segs];
      ns.splice(i + 1, 1);
      setSegments(ns);
    }
  }, [goToSegment, setSegments]);

  /** Add extra rest: extend the current rest, or insert one after this work. */
  const addRest = useCallback(
    (secs = 30) => {
      const st = statusRef.current;
      if (st === "idle" || st === "complete") return;
      const segs = segmentsRef.current;
      const i = indexRef.current;
      const cur = segs[i];
      if (!cur) return;
      if (cur.phase === "rest") {
        remainingRef.current += secs * 1000;
        deadlineRef.current += secs * 1000;
        setRemainingMs(remainingRef.current);
        firedRef.current.ten = false; // allow the 10s warning to fire again
      } else {
        const rest: Segment = {
          phase: "rest",
          duration: secs,
          round: cur.round,
          totalRounds: cur.totalRounds,
          roundType: "work",
        };
        const ns = [...segs];
        ns.splice(i + 1, 0, rest);
        setSegments(ns);
      }
    },
    [setSegments]
  );

  // --- Derived values for rendering -------------------------------------

  const totalDuration = useMemo(
    () => segments.reduce((a, s) => a + s.duration, 0),
    [segments]
  );
  const totalWork = useMemo(
    () =>
      segments
        .filter((s) => s.phase === "work")
        .reduce((a, s) => a + s.duration, 0),
    [segments]
  );
  const totalRest = useMemo(
    () =>
      segments
        .filter((s) => s.phase === "rest")
        .reduce((a, s) => a + s.duration, 0),
    [segments]
  );
  const elapsedBefore = useMemo(() => {
    let sum = 0;
    for (let k = 0; k < index && k < segments.length; k++)
      sum += segments[k].duration;
    return sum;
  }, [segments, index]);

  const currentSegment = segments[index];
  const phase: Phase =
    status === "idle"
      ? "idle"
      : status === "complete"
      ? "complete"
      : currentSegment?.phase ?? "idle";
  const remainingSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const currentRound = currentSegment?.round ?? 0;
  const totalRounds = Math.max(1, Math.floor(settings.rounds));
  const isWarning =
    (phase === "work" || phase === "rest") &&
    remainingSeconds <= 10 &&
    remainingSeconds > 0;
  const isFinalRound =
    phase === "work" && currentSegment?.roundType === "burnout";

  const segmentProgress =
    currentSegment && currentSegment.duration > 0
      ? Math.min(1, Math.max(0, 1 - remainingMs / (currentSegment.duration * 1000)))
      : status === "complete"
      ? 1
      : 0;

  const elapsed =
    status === "complete"
      ? totalDuration
      : elapsedBefore +
        (currentSegment ? currentSegment.duration - remainingMs / 1000 : 0);
  const overallProgress =
    totalDuration > 0 ? Math.min(1, Math.max(0, elapsed / totalDuration)) : 0;

  const roundsCompleted =
    status === "complete"
      ? totalRounds
      : !currentSegment
      ? 0
      : currentSegment.phase === "work"
      ? Math.max(0, currentRound - 1)
      : currentSegment.phase === "rest"
      ? currentRound
      : 0;

  return {
    // state
    status,
    phase,
    segments,
    index,
    currentSegment,
    remainingSeconds,
    remainingMs,
    currentRound,
    totalRounds,
    isWarning,
    isFinalRound,
    awaiting,
    isManual: settings.manualMode,
    // progress / summary
    segmentProgress,
    overallProgress,
    roundsCompleted,
    totalDuration,
    totalWork,
    totalRest,
    // controls
    start,
    pause,
    resume,
    reset,
    toggle,
    next,
    skipRound,
    skipRest,
    addRest,
  };
}

export type TimerApi = ReturnType<typeof useIntervalTimer>;
