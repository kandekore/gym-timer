"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CueType,
  Phase,
  Preset,
  Segment,
  SoundSettings,
  TimerSettings,
} from "@/lib/types";
import { DEFAULT_SETTINGS, DEFAULT_SOUND } from "@/lib/presets";
import {
  clearStorage,
  loadPresets,
  loadSettings,
  loadSound,
  savePresets,
  saveSettings,
  saveSound,
} from "@/lib/storage";
import { getSoundManager } from "@/lib/sound";
import { useIntervalTimer } from "@/hooks/useIntervalTimer";
import { useFullscreen } from "@/hooks/useFullscreen";
import { useWakeLock } from "@/hooks/useWakeLock";
import { TimerDisplay } from "@/components/TimerDisplay";
import { TimerControls } from "@/components/TimerControls";
import { ProgressBar } from "@/components/ProgressBar";
import { SessionSummary } from "@/components/SessionSummary";
import { SettingsDrawer } from "@/components/SettingsDrawer";

/** Full-screen background colour for the current phase. */
function backgroundClass(
  phase: Phase,
  isWarning: boolean,
  highContrast: boolean
): string {
  if (highContrast) return "bg-black";
  if (isWarning) return "bg-amber-500";
  switch (phase) {
    case "work":
      return "bg-emerald-600";
    case "rest":
      return "bg-blue-700";
    case "getready":
      return "bg-indigo-700";
    case "complete":
      return "bg-slate-900";
    default:
      return "bg-slate-900";
  }
}

export default function Home() {
  const [settings, setSettings] = useState<TimerSettings>(DEFAULT_SETTINGS);
  const [sound, setSound] = useState<SoundSettings>(DEFAULT_SOUND);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Map timer cues to actual sounds/voice.
  const onCue = useCallback(
    (cue: CueType, seg?: Segment) => {
      const sm = getSoundManager();
      switch (cue) {
        case "getReady":
          sm.speak("Get ready");
          break;
        case "roundStart":
          sm.play("bell");
          if (seg) sm.speak(`Round ${seg.round}`);
          break;
        case "roundEnd":
          sm.play("bell");
          break;
        case "restStart":
          sm.speak("Rest");
          break;
        case "tenSeconds":
          sm.play("knock");
          sm.speak("Ten seconds");
          break;
        case "countdown":
          sm.beep(880, 120);
          break;
        case "complete":
          sm.play("complete");
          sm.speak("Workout complete");
          break;
      }
    },
    []
  );

  // Wipe persisted data and restore factory defaults.
  const handleReset = useCallback(() => {
    clearStorage();
    setSettings(DEFAULT_SETTINGS);
    setSound(DEFAULT_SOUND);
    setPresets([]);
  }, []);

  const timer = useIntervalTimer({ settings, onCue });
  const fullscreen = useFullscreen();
  useWakeLock(timer.status === "running");

  // --- Load persisted state on mount ---
  useEffect(() => {
    setSettings(loadSettings());
    setSound(loadSound());
    setPresets(loadPresets());
    setHydrated(true);
  }, []);

  // --- Persist on change (after hydration so we never clobber stored data) ---
  useEffect(() => {
    if (hydrated) saveSettings(settings);
  }, [settings, hydrated]);
  useEffect(() => {
    if (hydrated) saveSound(sound);
  }, [sound, hydrated]);
  useEffect(() => {
    if (hydrated) savePresets(presets);
  }, [presets, hydrated]);

  // --- Push sound preferences into the audio engine ---
  useEffect(() => {
    const sm = getSoundManager();
    sm.setMuted(sound.muted);
    sm.setVolume(sound.volume);
    sm.setVoiceEnabled(sound.voiceEnabled);
  }, [sound]);

  // --- Unlock audio on the first user gesture (autoplay policies) ---
  useEffect(() => {
    const unlock = () => getSoundManager().unlock();
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  // --- Keyboard shortcuts: Space, R, F, N ---
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (showSettings) return;
      if (e.code === "Space") {
        e.preventDefault();
        timer.toggle();
      } else if (e.key === "r" || e.key === "R") {
        timer.reset();
      } else if (e.key === "f" || e.key === "F") {
        void fullscreen.toggle();
      } else if (e.key === "n" || e.key === "N") {
        timer.next();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [timer, fullscreen, showSettings]);

  const bg = backgroundClass(timer.phase, timer.isWarning, settings.highContrast);
  const textColor = timer.isWarning && !settings.highContrast
    ? "text-slate-900"
    : "text-white";
  // In fullscreen we strip the UI down to just the timer + progress bars.
  // Buttons are hidden; press Esc (or F) to leave fullscreen and get them back.
  // Keyboard shortcuts (Space/N/R/F) still control the timer while fullscreen.
  const minimal = fullscreen.isFullscreen;

  return (
    <main
      className={`relative flex min-h-[100dvh] flex-col ${bg} ${textColor} transition-colors duration-300`}
    >
      {/* Top bar */}
      {!minimal && (
        <header className="flex items-center justify-between gap-2 px-4 py-3 sm:px-6">
          <div className="min-w-0 truncate text-lg font-bold opacity-90 sm:text-2xl">
            {settings.title || "Gym Class Timer"}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSound({ ...sound, muted: !sound.muted })}
              aria-label={sound.muted ? "Unmute" : "Mute"}
              className="rounded-xl bg-black/20 px-3 py-2 text-lg font-bold hover:bg-black/30"
            >
              {sound.muted ? "🔇" : "🔊"}
            </button>
            <button
              onClick={() => void fullscreen.toggle()}
              aria-label="Toggle fullscreen"
              className="rounded-xl bg-black/20 px-3 py-2 text-lg font-bold hover:bg-black/30"
            >
              {fullscreen.isFullscreen ? "🡼" : "⛶"}
            </button>
            <button
              onClick={() => setShowSettings(true)}
              aria-label="Open settings"
              className="rounded-xl bg-black/20 px-3 py-2 text-lg font-bold hover:bg-black/30"
            >
              ⚙︎
            </button>
          </div>
        </header>
      )}

      {/* Center stage */}
      <section className="flex min-h-0 flex-1 flex-col items-center justify-center px-3 py-2 sm:px-4">
        {timer.status === "complete" ? (
          <SessionSummary
            totalDuration={timer.totalDuration}
            totalWork={timer.totalWork}
            totalRest={timer.totalRest}
            roundsCompleted={timer.roundsCompleted}
            totalRounds={timer.totalRounds}
            onClose={timer.reset}
          />
        ) : (
          <TimerDisplay
            phase={timer.phase}
            isWarning={timer.isWarning}
            remainingSeconds={timer.remainingSeconds}
            currentRound={timer.currentRound}
            totalRounds={timer.totalRounds}
            label={timer.currentSegment?.label}
            isFinalRound={timer.isFinalRound}
            awaiting={timer.awaiting}
            manual={timer.isManual}
            title={settings.title}
          />
        )}
      </section>

      {/* Bottom: progress + controls */}
      {timer.status !== "complete" && (
        <footer className="space-y-4 px-4 pb-5 sm:px-6">
          {timer.status !== "idle" && (
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-2">
              <ProgressBar label="This phase" value={timer.segmentProgress} />
              <ProgressBar label="Session" value={timer.overallProgress} />
            </div>
          )}
          {!minimal && (
            <div className="mx-auto w-full max-w-3xl">
              <TimerControls
                status={timer.status}
                manual={timer.isManual}
                onToggle={timer.toggle}
                onReset={timer.reset}
                onNext={timer.next}
                onSkipRound={timer.skipRound}
                onSkipRest={timer.skipRest}
                onAddRest={timer.addRest}
              />
            </div>
          )}
          {!minimal && (
            <p className="text-center text-xs opacity-70">
              Space = start/pause · N = next · R = reset · F = fullscreen
            </p>
          )}
        </footer>
      )}

      {/* Credits — hidden in the clean fullscreen display */}
      {!minimal && (
        <footer className="px-4 pb-4 text-center text-xs opacity-70 sm:text-sm">
          Developed by{" "}
          <a
            href="https://darrenk.uk"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold underline underline-offset-2 hover:opacity-100"
          >
            Darren Kandekore
          </a>
          {" · "}
          Hosting by{" "}
          <a
            href="https://hostdada.co.uk"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold underline underline-offset-2 hover:opacity-100"
          >
            Host Dada
          </a>
        </footer>
      )}

      <SettingsDrawer
        open={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onSettingsChange={setSettings}
        sound={sound}
        onSoundChange={setSound}
        presets={presets}
        onSavePreset={(p) => setPresets((prev) => [...prev, p])}
        onDeletePreset={(id) =>
          setPresets((prev) => prev.filter((p) => p.id !== id))
        }
        onReset={handleReset}
      />
    </main>
  );
}
