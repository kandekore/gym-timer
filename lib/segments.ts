import { Segment, TimerSettings } from "./types";

/**
 * Expand user settings into a flat, ordered list of timed segments.
 *
 * Layout:
 *   [warm-up?] -> work(1) -> rest -> work(2) -> rest -> ... -> work(N)
 * The final round has no trailing rest. The last round is flagged as a
 * "burnout" round so the UI can highlight it.
 */
export function buildSegments(settings: TimerSettings): Segment[] {
  const segs: Segment[] = [];
  const rounds = Math.max(1, Math.floor(settings.rounds));
  const work = Math.max(1, Math.floor(settings.workSeconds));
  const rest = Math.max(0, Math.floor(settings.restSeconds));
  const warmup = Math.max(0, Math.floor(settings.warmupSeconds));

  if (warmup > 0) {
    segs.push({
      phase: "getready",
      duration: warmup,
      round: 0,
      totalRounds: rounds,
      roundType: "warmup",
    });
  }

  for (let r = 1; r <= rounds; r++) {
    segs.push({
      phase: "work",
      duration: work,
      round: r,
      totalRounds: rounds,
      roundType: r === rounds ? "burnout" : "work",
      label: settings.roundLabels[r - 1]?.trim() || undefined,
    });
    // No rest after the final round.
    if (r < rounds && rest > 0) {
      segs.push({
        phase: "rest",
        duration: rest,
        round: r,
        totalRounds: rounds,
        roundType: "work",
      });
    }
  }

  return segs;
}
