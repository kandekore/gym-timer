// Sound system for the gym timer.
//
// Design goals:
//  - Works out of the box with NO audio files: all cues are synthesized with
//    the Web Audio API (bell / knock / completion fanfare).
//  - If you drop real files into /public/sounds (bell.mp3, knock.mp3,
//    complete.mp3) they are loaded and used automatically instead of the synth.
//  - Voice cues use the browser SpeechSynthesis API. The `speak()` method is a
//    clean abstraction, so recorded voice files could replace it later.
//  - Browser autoplay restrictions are handled via unlock() on first gesture.

export type SoundName = "bell" | "knock" | "complete";

const FILES: Record<SoundName, string> = {
  bell: "/sounds/bell.mp3",
  knock: "/sounds/knock.mp3",
  complete: "/sounds/complete.mp3",
};

export class SoundManager {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private buffers: Partial<Record<SoundName, AudioBuffer>> = {};
  private loadStarted = false;

  private muted = false;
  private volume = 1;
  private voiceEnabled = true;

  /** Lazily create the AudioContext (must happen after a user gesture). */
  private ensureCtx(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.volume;
      this.master.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  /** Call on the first user interaction to satisfy autoplay policies. */
  async unlock(): Promise<void> {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    if (ctx.state === "suspended") {
      try {
        await ctx.resume();
      } catch {
        /* ignore */
      }
    }
    void this.loadFiles();
  }

  /** Attempt to load override audio files; silently fall back to synth. */
  private async loadFiles(): Promise<void> {
    if (this.loadStarted) return;
    this.loadStarted = true;
    const ctx = this.ensureCtx();
    if (!ctx) return;
    await Promise.all(
      (Object.keys(FILES) as SoundName[]).map(async (name) => {
        try {
          const res = await fetch(FILES[name]);
          if (!res.ok) return;
          const data = await res.arrayBuffer();
          this.buffers[name] = await ctx.decodeAudioData(data);
        } catch {
          /* file missing or not decodable — synth will be used */
        }
      })
    );
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
  }
  setVolume(volume: number): void {
    this.volume = Math.min(1, Math.max(0, volume));
    if (this.master) this.master.gain.value = this.volume;
  }
  setVoiceEnabled(enabled: boolean): void {
    this.voiceEnabled = enabled;
  }

  /** Play a named cue (file if available, otherwise synthesized). */
  play(name: SoundName): void {
    if (this.muted) return;
    const ctx = this.ensureCtx();
    if (!ctx || !this.master) return;
    if (ctx.state === "suspended") void ctx.resume();

    const buffer = this.buffers[name];
    if (buffer) {
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.connect(this.master);
      src.start();
      return;
    }
    this.synth(name);
  }

  /** Short configurable beep — used for the 3-2-1 countdown ticks. */
  beep(freq = 880, durationMs = 120, type: OscillatorType = "triangle"): void {
    if (this.muted) return;
    this.ensureCtx();
    this.tone(freq, 0, durationMs, type, 0.4);
  }

  /** Speak a short phrase. Swappable for recorded clips in future. */
  speak(text: string): void {
    if (this.muted || !this.voiceEnabled) return;
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.volume = Math.min(1, this.volume);
      u.rate = 1.05;
      u.pitch = 1;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch {
      /* speech unsupported — ignore */
    }
  }

  // --- Synthesis helpers -------------------------------------------------

  /** Schedule a single decaying oscillator tone through the master gain. */
  private tone(
    freq: number,
    startOffset: number,
    durationMs: number,
    type: OscillatorType = "sine",
    peak = 0.6
  ): void {
    const ctx = this.ctx;
    if (!ctx || !this.master) return;
    const t0 = ctx.currentTime + startOffset;
    const dur = durationMs / 1000;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  /**
   * One strike of a metallic bell, built from inharmonic partials (the ratios
   * that make a struck bell sound like a bell rather than a pure tone) with a
   * sharp attack and a long exponential ring-out.
   */
  private bellStrike(t0: number, fundamental = 540, gain = 0.22, decay = 1.7): void {
    const ctx = this.ctx;
    if (!ctx || !this.master) return;
    // ratio, relative amplitude, relative decay
    const partials: Array<[number, number, number]> = [
      [1.0, 1.0, 1.0],
      [2.0, 0.6, 0.9],
      [2.41, 0.5, 0.7], // inharmonic — gives the metallic "clang"
      [2.99, 0.35, 0.6],
      [4.16, 0.28, 0.45],
      [5.43, 0.2, 0.32],
      [12.6, 0.12, 0.06], // bright "ting" attack transient
    ];
    for (const [ratio, amp, decayMul] of partials) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = fundamental * ratio;
      const peak = gain * amp;
      const d = decay * decayMul;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(peak, t0 + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
      osc.connect(g);
      g.connect(this.master);
      osc.start(t0);
      osc.stop(t0 + d + 0.05);
    }
  }

  private synth(name: SoundName): void {
    const ctx = this.ctx;
    if (!ctx) return;
    switch (name) {
      case "bell": {
        // Classic boxing "ding — ding — ding" to start/end a round.
        const base = ctx.currentTime; // capture once for stable scheduling
        this.bellStrike(base + 0.0, 540, 0.24);
        this.bellStrike(base + 0.42, 540, 0.22);
        this.bellStrike(base + 0.84, 540, 0.2);
        break;
      }
      case "knock":
        // Low, short percussive blip for the 10-second warning.
        this.tone(200, 0, 90, "square", 0.5);
        break;
      case "complete":
        // Rising arpeggio fanfare.
        this.tone(523, 0, 180, "triangle", 0.5);
        this.tone(659, 0.18, 180, "triangle", 0.5);
        this.tone(784, 0.36, 160, "triangle", 0.5);
        this.tone(1047, 0.52, 400, "triangle", 0.55);
        break;
    }
  }
}

// Module-level singleton so every component shares one audio graph.
let instance: SoundManager | null = null;
export function getSoundManager(): SoundManager {
  if (!instance) instance = new SoundManager();
  return instance;
}
