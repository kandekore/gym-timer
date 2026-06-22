"use client";

import { SoundSettings as SoundSettingsType } from "@/lib/types";
import { getSoundManager } from "@/lib/sound";
import { Button, Toggle } from "./ui";

interface Props {
  sound: SoundSettingsType;
  onChange: (s: SoundSettingsType) => void;
}

export function SoundSettings({ sound, onChange }: Props) {
  const set = (patch: Partial<SoundSettingsType>) =>
    onChange({ ...sound, ...patch });

  const test = (fn: () => void) => {
    const sm = getSoundManager();
    void sm.unlock();
    fn();
  };

  return (
    <div className="space-y-3">
      <Toggle
        label="Mute all sound"
        checked={sound.muted}
        onChange={(v) => set({ muted: v })}
      />
      <Toggle
        label="Voice cues"
        hint="Spoken “Round 1”, “Rest”, “Ten seconds”"
        checked={sound.voiceEnabled}
        onChange={(v) => set({ voiceEnabled: v })}
      />

      <div className="rounded-xl bg-slate-800/60 p-4 ring-1 ring-white/10">
        <div className="mb-2 flex items-center justify-between">
          <span className="font-semibold text-white">Volume</span>
          <span className="tabular-nums text-slate-300">
            {Math.round(sound.volume * 100)}%
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={sound.volume}
          onChange={(e) => set({ volume: Number(e.target.value) })}
          className="w-full accent-emerald-500"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="ghost"
          onClick={() => test(() => getSoundManager().play("bell"))}
        >
          🔔 Bell
        </Button>
        <Button
          variant="ghost"
          onClick={() => test(() => getSoundManager().play("knock"))}
        >
          🥁 Knock
        </Button>
        <Button
          variant="ghost"
          onClick={() => test(() => getSoundManager().play("complete"))}
        >
          🎉 Complete
        </Button>
        <Button
          variant="ghost"
          onClick={() => test(() => getSoundManager().speak("Ten seconds"))}
        >
          🗣 Voice
        </Button>
      </div>
      <p className="text-xs text-slate-400">
        Sounds are synthesized by default. Drop your own files into{" "}
        <code>/public/sounds</code> (bell.mp3, knock.mp3, complete.mp3) to
        override them.
      </p>
    </div>
  );
}
