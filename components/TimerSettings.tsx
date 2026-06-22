"use client";

import { TimerSettings as TimerSettingsType } from "@/lib/types";
import { Stepper, Toggle } from "./ui";

interface Props {
  settings: TimerSettingsType;
  onChange: (s: TimerSettingsType) => void;
}

export function TimerSettings({ settings, onChange }: Props) {
  const set = (patch: Partial<TimerSettingsType>) =>
    onChange({ ...settings, ...patch });

  const setLabel = (index: number, value: string) => {
    const labels = [...settings.roundLabels];
    // Ensure the array is long enough to address this round.
    while (labels.length <= index) labels.push("");
    labels[index] = value;
    set({ roundLabels: labels });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-slate-800/60 p-4 ring-1 ring-white/10">
        <label className="mb-2 block font-semibold text-white">
          Session title
        </label>
        <input
          type="text"
          value={settings.title}
          onChange={(e) => set({ title: e.target.value })}
          placeholder="e.g. Friday Boxing"
          className="w-full rounded-xl bg-slate-900 px-4 py-3 text-white outline-none ring-1 ring-white/10 placeholder:text-slate-500 focus:ring-emerald-500"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Stepper
          label="Rounds"
          value={settings.rounds}
          min={1}
          max={99}
          step={1}
          unit="rounds"
          onChange={(v) => set({ rounds: v })}
        />
        <Stepper
          label="Warm-up"
          value={settings.warmupSeconds}
          min={0}
          max={600}
          step={5}
          unit="seconds (0 = off)"
          onChange={(v) => set({ warmupSeconds: v })}
        />
        <Stepper
          label="Work"
          value={settings.workSeconds}
          min={1}
          max={3600}
          step={5}
          unit="seconds"
          onChange={(v) => set({ workSeconds: v })}
        />
        <Stepper
          label="Rest"
          value={settings.restSeconds}
          min={0}
          max={3600}
          step={5}
          unit="seconds (0 = off)"
          onChange={(v) => set({ restSeconds: v })}
        />
      </div>

      <Toggle
        label="Manual mode"
        hint="Coach advances each phase by hand"
        checked={settings.manualMode}
        onChange={(v) => set({ manualMode: v })}
      />
      <Toggle
        label="High contrast"
        hint="Black background for very bright gyms"
        checked={settings.highContrast}
        onChange={(v) => set({ highContrast: v })}
      />

      <div className="rounded-xl bg-slate-800/60 p-4 ring-1 ring-white/10">
        <div className="mb-1 font-semibold text-white">
          Exercise labels (optional)
        </div>
        <p className="mb-3 text-sm text-slate-400">
          Name each round — e.g. Pads, Bag Work, Burpees, Core.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {Array.from({ length: Math.max(1, settings.rounds) }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-16 shrink-0 text-sm text-slate-400">
                Round {i + 1}
              </span>
              <input
                type="text"
                value={settings.roundLabels[i] ?? ""}
                onChange={(e) => setLabel(i, e.target.value)}
                placeholder="—"
                className="min-w-0 flex-1 rounded-lg bg-slate-900 px-3 py-2 text-white outline-none ring-1 ring-white/10 placeholder:text-slate-600 focus:ring-emerald-500"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
