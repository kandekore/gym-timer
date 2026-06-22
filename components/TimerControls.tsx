"use client";

import { TimerStatus } from "@/hooks/useIntervalTimer";
import { Button } from "./ui";

interface Props {
  status: TimerStatus;
  manual: boolean;
  onToggle: () => void;
  onReset: () => void;
  onNext: () => void;
  onSkipRound: () => void;
  onSkipRest: () => void;
  onAddRest: (secs: number) => void;
}

export function TimerControls({
  status,
  manual,
  onToggle,
  onReset,
  onNext,
  onSkipRound,
  onSkipRest,
  onAddRest,
}: Props) {
  const idle = status === "idle";
  const running = status === "running";
  const complete = status === "complete";
  const active = !idle && !complete; // running or paused

  const primaryLabel = idle || complete ? "Start" : running ? "Pause" : "Resume";

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
      <Button variant="primary" onClick={onToggle} className="min-w-[7rem]">
        {primaryLabel}
      </Button>

      {active && (
        <Button variant="secondary" onClick={onNext}>
          {manual ? "Next ▸" : "Skip Phase"}
        </Button>
      )}
      {active && (
        <Button variant="secondary" onClick={onSkipRound}>
          Skip Round
        </Button>
      )}
      {active && (
        <Button variant="secondary" onClick={onSkipRest}>
          Skip Rest
        </Button>
      )}
      {active && (
        <Button variant="secondary" onClick={() => onAddRest(30)}>
          +30s Rest
        </Button>
      )}

      <Button variant="danger" onClick={onReset}>
        Reset
      </Button>
    </div>
  );
}
