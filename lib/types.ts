// Core domain types for the gym timer.

/** High-level phase shown to the user. */
export type Phase = "idle" | "getready" | "work" | "rest" | "complete";

/** Round category — supports warm-up, standard work and a final burnout round. */
export type RoundType = "warmup" | "work" | "burnout";

/** A single timed segment in the session timeline. */
export interface Segment {
  /** Segment phase (never "idle"/"complete" — those are session-level states). */
  phase: "getready" | "work" | "rest";
  /** Duration in seconds. */
  duration: number;
  /** Round number this segment belongs to (0 for the initial warm-up). */
  round: number;
  /** Total number of work rounds in the session. */
  totalRounds: number;
  /** Round type for styling/labelling. */
  roundType: RoundType;
  /** Optional exercise label, e.g. "Pads", "Burpees". */
  label?: string;
}

/** Audio/voice cues emitted by the timer engine. */
export type CueType =
  | "getReady"
  | "roundStart"
  | "roundEnd"
  | "restStart"
  | "tenSeconds"
  | "countdown"
  | "complete";

/** User-configurable session settings. */
export interface TimerSettings {
  title: string;
  rounds: number;
  workSeconds: number;
  restSeconds: number;
  /** Optional get-ready countdown before the first round (0 = disabled). */
  warmupSeconds: number;
  /** Manual mode: coach advances each phase by hand. */
  manualMode: boolean;
  /** Optional per-round exercise labels (index 0 = round 1). */
  roundLabels: string[];
  /** High-contrast dark theme for very bright gyms. */
  highContrast: boolean;
}

/** Sound preferences. */
export interface SoundSettings {
  muted: boolean;
  /** 0..1 master volume. */
  volume: number;
  /** Enable spoken voice cues (SpeechSynthesis). */
  voiceEnabled: boolean;
}

/** A saved or built-in preset. */
export interface Preset {
  id: string;
  name: string;
  builtin?: boolean;
  settings: TimerSettings;
}
