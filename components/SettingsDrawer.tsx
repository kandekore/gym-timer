"use client";

import { useState } from "react";
import { Preset, SoundSettings as SoundSettingsType, TimerSettings as TimerSettingsType } from "@/lib/types";
import { TimerSettings } from "./TimerSettings";
import { PresetManager } from "./PresetManager";
import { SoundSettings } from "./SoundSettings";

interface Props {
  open: boolean;
  onClose: () => void;
  settings: TimerSettingsType;
  onSettingsChange: (s: TimerSettingsType) => void;
  sound: SoundSettingsType;
  onSoundChange: (s: SoundSettingsType) => void;
  presets: Preset[];
  onSavePreset: (p: Preset) => void;
  onDeletePreset: (id: string) => void;
  onReset: () => void;
}

type Tab = "session" | "presets" | "sound";

const TABS: { id: Tab; label: string }[] = [
  { id: "session", label: "Session" },
  { id: "presets", label: "Presets" },
  { id: "sound", label: "Sound" },
];

export function SettingsDrawer({
  open,
  onClose,
  settings,
  onSettingsChange,
  sound,
  onSoundChange,
  presets,
  onSavePreset,
  onDeletePreset,
  onReset,
}: Props) {
  const [tab, setTab] = useState<Tab>("session");

  const handleReset = () => {
    if (
      window.confirm(
        "Reset all settings, sounds and saved presets back to defaults? This clears stored data and can't be undone."
      )
    ) {
      onReset();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      {/* Panel */}
      <div className="relative flex h-full w-full max-w-xl flex-col bg-slate-900 text-white shadow-2xl ring-1 ring-white/10">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="text-xl font-bold">Settings</h2>
          <button
            onClick={onClose}
            aria-label="Close settings"
            className="rounded-xl bg-slate-800 px-4 py-2 font-bold hover:bg-slate-700"
          >
            Done
          </button>
        </div>

        <div className="flex gap-2 border-b border-white/10 px-5 py-3">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-xl px-4 py-2 font-semibold transition ${
                tab === t.id
                  ? "bg-emerald-500 text-slate-900"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {tab === "session" && (
            <TimerSettings settings={settings} onChange={onSettingsChange} />
          )}
          {tab === "presets" && (
            <PresetManager
              currentSettings={settings}
              customPresets={presets}
              onApply={onSettingsChange}
              onSaveCustom={onSavePreset}
              onDeleteCustom={onDeletePreset}
            />
          )}
          {tab === "sound" && (
            <SoundSettings sound={sound} onChange={onSoundChange} />
          )}
        </div>

        <div className="border-t border-white/10 px-5 py-4">
          <button
            onClick={handleReset}
            className="w-full rounded-xl bg-red-600/90 px-4 py-3 font-bold text-white hover:bg-red-600"
          >
            Reset to defaults
          </button>
          <p className="mt-2 text-center text-xs text-slate-400">
            Clears saved settings, sounds &amp; presets from this device.
          </p>
        </div>
      </div>
    </div>
  );
}
