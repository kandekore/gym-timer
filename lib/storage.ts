import { Preset, SoundSettings, TimerSettings } from "./types";
import { DEFAULT_SETTINGS, DEFAULT_SOUND } from "./presets";

const KEYS = {
  settings: "gymtimer.settings",
  presets: "gymtimer.presets",
  sound: "gymtimer.sound",
} as const;

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return { ...fallback, ...(JSON.parse(raw) as object) } as T;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full / disabled — ignore */
  }
}

export function loadSettings(): TimerSettings {
  return read<TimerSettings>(KEYS.settings, DEFAULT_SETTINGS);
}
export function saveSettings(settings: TimerSettings): void {
  write(KEYS.settings, settings);
}

export function loadSound(): SoundSettings {
  return read<SoundSettings>(KEYS.sound, DEFAULT_SOUND);
}
export function saveSound(sound: SoundSettings): void {
  write(KEYS.sound, sound);
}

export function loadPresets(): Preset[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEYS.presets);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Preset[]) : [];
  } catch {
    return [];
  }
}
export function savePresets(presets: Preset[]): void {
  write(KEYS.presets, presets);
}

/** Wipe all persisted timer data so the app falls back to defaults. */
export function clearStorage(): void {
  if (typeof window === "undefined") return;
  try {
    for (const key of Object.values(KEYS)) {
      window.localStorage.removeItem(key);
    }
  } catch {
    /* storage disabled — ignore */
  }
}
