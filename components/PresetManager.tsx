"use client";

import { useState } from "react";
import { Preset, TimerSettings } from "@/lib/types";
import { BUILTIN_PRESETS } from "@/lib/presets";
import { Button } from "./ui";

interface Props {
  currentSettings: TimerSettings;
  customPresets: Preset[];
  onApply: (settings: TimerSettings) => void;
  onSaveCustom: (preset: Preset) => void;
  onDeleteCustom: (id: string) => void;
}

function summarize(s: TimerSettings): string {
  return `${s.rounds} × ${s.workSeconds}s work / ${s.restSeconds}s rest`;
}

/** Simple unique id without external deps. */
function makeId(): string {
  return `p_${Date.now().toString(36)}_${Math.floor(
    performance.now()
  ).toString(36)}`;
}

export function PresetManager({
  currentSettings,
  customPresets,
  onApply,
  onSaveCustom,
  onDeleteCustom,
}: Props) {
  const [name, setName] = useState("");

  const save = () => {
    const trimmed = name.trim() || currentSettings.title || "My Preset";
    onSaveCustom({
      id: makeId(),
      name: trimmed,
      settings: { ...currentSettings },
    });
    setName("");
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Built-in
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          {BUILTIN_PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => onApply(p.settings)}
              className="rounded-xl bg-slate-800/60 p-3 text-left ring-1 ring-white/10 transition hover:bg-slate-700"
            >
              <div className="font-bold text-white">{p.name}</div>
              <div className="text-sm text-slate-400">
                {summarize(p.settings)}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Your presets
        </div>
        {customPresets.length === 0 ? (
          <p className="text-sm text-slate-500">
            No saved presets yet. Configure a session and save it below.
          </p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {customPresets.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between gap-2 rounded-xl bg-slate-800/60 p-3 ring-1 ring-white/10"
              >
                <button
                  onClick={() => onApply(p.settings)}
                  className="min-w-0 flex-1 text-left"
                >
                  <div className="truncate font-bold text-white">{p.name}</div>
                  <div className="truncate text-sm text-slate-400">
                    {summarize(p.settings)}
                  </div>
                </button>
                <button
                  aria-label={`Delete ${p.name}`}
                  onClick={() => onDeleteCustom(p.id)}
                  className="shrink-0 rounded-lg bg-slate-700 px-3 py-2 text-sm font-bold text-red-300 hover:bg-red-600 hover:text-white"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={name}
          placeholder="Preset name"
          onChange={(e) => setName(e.target.value)}
          className="flex-1 rounded-xl bg-slate-800 px-4 py-3 text-white outline-none ring-1 ring-white/10 placeholder:text-slate-500 focus:ring-emerald-500"
        />
        <Button variant="primary" onClick={save}>
          Save current
        </Button>
      </div>
    </div>
  );
}
