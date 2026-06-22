"use client";

import { formatDuration } from "@/lib/format";
import { Button } from "./ui";

interface Props {
  totalDuration: number;
  totalWork: number;
  totalRest: number;
  roundsCompleted: number;
  totalRounds: number;
  onClose: () => void;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/10 px-4 py-3 text-center ring-1 ring-white/15">
      <div className="text-sm uppercase tracking-wide text-slate-300">
        {label}
      </div>
      <div className="mt-1 text-2xl font-black tabular-nums text-white">
        {value}
      </div>
    </div>
  );
}

export function SessionSummary({
  totalDuration,
  totalWork,
  totalRest,
  roundsCompleted,
  totalRounds,
  onClose,
}: Props) {
  return (
    <div className="flex w-full max-w-2xl flex-col items-center gap-6 text-center">
      <div>
        <div className="text-5xl font-black text-emerald-400">Complete!</div>
        <div className="mt-2 text-lg text-slate-300">Great work 👏</div>
      </div>

      <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Duration" value={formatDuration(totalDuration)} />
        <Stat label="Work" value={formatDuration(totalWork)} />
        <Stat label="Rest" value={formatDuration(totalRest)} />
        <Stat
          label="Rounds"
          value={`${roundsCompleted}/${totalRounds}`}
        />
      </div>

      <Button variant="primary" onClick={onClose} className="mt-2">
        Done
      </Button>
    </div>
  );
}
