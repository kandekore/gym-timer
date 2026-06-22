"use client";

interface Props {
  label: string;
  value: number; // 0..1
}

export function ProgressBar({ label, value }: Props) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <div className="w-full">
      <div className="mb-1 flex justify-between text-xs font-semibold uppercase tracking-wide opacity-80 sm:text-sm">
        <span>{label}</span>
        <span className="tabular-nums">{pct}%</span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-black/30 sm:h-4">
        <div
          className="h-full rounded-full bg-white/85 transition-[width] duration-200 ease-linear"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
