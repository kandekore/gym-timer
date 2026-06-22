# Gym Class Timer

A full-screen, installable interval timer for boxing, HIIT, Tabata and general
fitness classes. Built with Next.js (App Router), React, TypeScript and Tailwind
CSS. Readable from across a gym, touch-friendly, and works offline as a PWA.

## Features

- **Full-screen timer** with huge, gym-readable digits and phase colours
  (green = work, amber = last 10s, blue = rest, indigo = get ready).
- **Configurable sessions**: title, rounds, work/rest length, optional warm-up,
  and per-round exercise labels (Pads, Bag Work, Burpees, Core…).
- **Phases**: GET READY → WORK → REST → … → COMPLETE, with "Round 3 of 8" and a
  FINAL-round badge for the burnout round.
- **Sounds**: boxing bell at round start/end, knock at the 10-second warning, a
  completion fanfare, plus spoken voice cues. Mute toggle + volume. All sounds
  are synthesized by default — drop your own files in `public/sounds` to override.
- **Controls**: start, pause/resume, reset, skip round, skip rest, +30s rest,
  and a manual coach-controlled mode (advance each phase by hand).
- **Presets**: Boxing (12×3min/1min), HIIT (8×40/20s), Tabata (8×20/10s), plus
  your own saved presets (stored in `localStorage`).
- **Keyboard shortcuts**: `Space` start/pause · `N` next · `R` reset · `F` fullscreen.
- **Progress**: per-phase and whole-session progress bars.
- **Session summary**: total duration, work time, rest time, rounds completed.
- **PWA**: installable on tablet/desktop, with Screen Wake Lock so the screen
  stays on while a session runs.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000.

### Production build

```bash
npm run build
npm run start
```

> The service worker / install prompt only activates in the production build.

## Project structure

```
app/
  layout.tsx          Root layout, metadata, PWA manifest link, SW registration
  page.tsx            Main screen — wires settings, timer engine, sounds, UI
  globals.css         Tailwind layers + base styles
components/
  TimerDisplay.tsx    Big central time / phase / round readout
  TimerControls.tsx   Start / pause / reset / skip / add-rest buttons
  TimerSettings.tsx   Session config form (rounds, work, rest, labels…)
  PresetManager.tsx   Built-in + custom presets (save/apply/delete)
  SoundSettings.tsx   Mute, volume, voice, test buttons
  ProgressBar.tsx     Reusable progress bar
  SessionSummary.tsx  End-of-session stats
  SettingsDrawer.tsx  Slide-over panel holding the three settings tabs
  ServiceWorkerRegister.tsx
  ui.tsx              Shared Button / Toggle / Stepper primitives
hooks/
  useIntervalTimer.ts Core timer engine (deadline-based, accurate pause/resume)
  useFullscreen.ts    Fullscreen toggle
  useWakeLock.ts      Screen Wake Lock (graceful fallback)
lib/
  types.ts            Shared types
  presets.ts          Defaults + built-in presets
  segments.ts         Expands settings into a flat segment timeline
  sound.ts            Web Audio synth + file override + SpeechSynthesis
  storage.ts          localStorage load/save
  format.ts           Time formatting helpers
public/
  manifest.json       PWA manifest
  sw.js               Service worker
  icon.svg            App icon (replaceable)
  sounds/             Drop bell.mp3 / knock.mp3 / complete.mp3 here to override
```

## Customising sounds

See `public/sounds/README.md`. Replace any of the three files and the app uses
them instead of the built-in synthesized cues. Voice cues use the browser's
`SpeechSynthesis` API; the `speak()` abstraction in `lib/sound.ts` can later be
swapped for recorded clips.

## Notes

- Audio is unlocked on the first tap/keypress to satisfy browser autoplay rules.
- The timer uses an absolute-deadline clock, so pause/resume is exact and it
  self-corrects after background throttling.
- Wake Lock and Fullscreen fail silently on browsers that don't support them.

## Troubleshooting

### Dev server loads but nothing is clickable / buttons do nothing

If `npm run dev` shows the page but the timer is frozen and clicks are ignored,
open the browser console. If you see **`Uncaught SyntaxError: Invalid or
unexpected token`** (pointing at `webpack.js`), the **Console Ninja** VS Code
extension is the culprit. It instruments the Next.js dev bundle by patching
files inside `node_modules/next/dist` (`start-server.js`,
`compiled/webpack/bundle5.js`), which corrupts the dev runtime chunk and stops
React from hydrating — so every button is dead. (The production build is never
touched, which is why `npm run build && npm run start` works fine.)

> Note: the same broken hydration also makes the big timer digits render
> **tiny** (the digit auto-sizing runs in JS, which never executes). Fixing the
> hydration fixes both symptoms. **Production (`npm run build && npm run start`)
> is unaffected** — clicks work and the digits fill the screen.

**Fix:**

1. This repo ships a `.vscode/settings.json` that disables Console Ninja's
   Next.js/webpack instrumentation for this workspace. **Reload the VS Code
   window** so it takes effect: Command Palette (`⌘⇧P` / `Ctrl+Shift+P`) →
   **"Developer: Reload Window"**. (Alternatively run `npm run dev` from a plain
   Terminal outside VS Code, or use Command Palette → **"Console Ninja: Pause"**.)
2. Restore the clean Next files it already patched:

   ```bash
   rm -rf node_modules/next .next && npm install
   ```

3. Start again: `npm run dev`.

If dev still breaks, confirm the extension isn't re-patching: after starting the
dev server, `grep -rl console-ninja node_modules/next/dist` should print nothing.

### Port 3000 already in use / stale screen

A leftover dev server can keep serving outdated chunks (same blank/frozen
symptom). Kill it and restart:

```bash
pkill -f next-server
npm run dev
```
