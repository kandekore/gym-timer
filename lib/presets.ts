import { Preset, SoundSettings, TimerSettings } from "./types";

/** Sensible defaults — a balanced HIIT-style session. */
export const DEFAULT_SETTINGS: TimerSettings = {
  title: "Gym Class",
  rounds: 8,
  workSeconds: 40,
  restSeconds: 20,
  warmupSeconds: 10,
  manualMode: false,
  roundLabels: [],
  highContrast: false,
};

export const DEFAULT_SOUND: SoundSettings = {
  muted: false,
  volume: 1,
  voiceEnabled: true,
};

/** Built-in presets that always appear in the preset list. */
export const BUILTIN_PRESETS: Preset[] = [
  {
    id: "boxing",
    name: "Boxing",
    builtin: true,
    settings: {
      ...DEFAULT_SETTINGS,
      title: "Boxing",
      rounds: 12,
      workSeconds: 180,
      restSeconds: 60,
      warmupSeconds: 10,
    },
  },
  {
    id: "hiit",
    name: "HIIT",
    builtin: true,
    settings: {
      ...DEFAULT_SETTINGS,
      title: "HIIT",
      rounds: 8,
      workSeconds: 40,
      restSeconds: 20,
      warmupSeconds: 10,
    },
  },
  {
    id: "tabata",
    name: "Tabata",
    builtin: true,
    settings: {
      ...DEFAULT_SETTINGS,
      title: "Tabata",
      rounds: 8,
      workSeconds: 20,
      restSeconds: 10,
      warmupSeconds: 10,
    },
  },
];
