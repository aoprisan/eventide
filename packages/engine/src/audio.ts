import type { AmbientId } from './types.js';

/**
 * The shared audio service: gentle synthesized tone cues, a small ambient
 * mixer, and optional spoken cues. Everything is generated with the Web Audio
 * API — no external sound assets, so it works fully offline.
 *
 * iOS/Safari require an AudioContext to be created/resumed inside a user
 * gesture; call {@link unlock} from a tap handler before a session starts.
 */
export type ToneType = 'rise' | 'steady' | 'fall';

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private ambientNodes: AudioScheduledSourceNode[] = [];
  private currentAmbient: AmbientId | null = null;

  toneVolume = 0.5;
  ambientVolume = 0.4;

  /** Must be called from within a user gesture to satisfy autoplay policies. */
  async unlock(): Promise<void> {
    if (!this.ctx) {
      const Ctor =
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext ?? window.AudioContext;
      if (!Ctor) return;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = 1;
      this.master.connect(this.ctx.destination);
      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.value = 0;
      this.ambientGain.connect(this.master);
    }
    if (this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume();
      } catch {
        /* ignore — will retry on next gesture */
      }
    }
  }

  get ready(): boolean {
    return this.ctx != null && this.ctx.state === 'running';
  }

  /** A soft, enveloped sine tone. `rise`/`fall` glide in pitch. */
  playTone(type: ToneType): void {
    const ctx = this.ctx;
    const master = this.master;
    if (!ctx || !master || this.toneVolume <= 0) return;

    const t0 = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';

    const base = 396; // a calm, low-mid pitch
    if (type === 'rise') {
      osc.frequency.setValueAtTime(base, t0);
      osc.frequency.exponentialRampToValueAtTime(base * 1.5, t0 + 0.9);
    } else if (type === 'fall') {
      osc.frequency.setValueAtTime(base * 1.5, t0);
      osc.frequency.exponentialRampToValueAtTime(base, t0 + 0.9);
    } else {
      osc.frequency.setValueAtTime(base, t0);
    }

    const peak = 0.18 * this.toneVolume;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(peak, t0 + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.2);

    osc.connect(gain).connect(master);
    osc.start(t0);
    osc.stop(t0 + 1.3);
  }

  setAmbient(id: AmbientId | null): void {
    if (id === this.currentAmbient) return;
    this.stopAmbient();
    this.currentAmbient = id;
    if (!id) return;
    const ctx = this.ctx;
    const out = this.ambientGain;
    if (!ctx || !out) return;

    // Fade in.
    out.gain.cancelScheduledValues(ctx.currentTime);
    out.gain.setValueAtTime(out.gain.value, ctx.currentTime);
    out.gain.linearRampToValueAtTime(this.ambientVolume, ctx.currentTime + 2);

    this.ambientNodes = this.buildAmbient(ctx, out, id);
    this.ambientNodes.forEach((n) => n.start());
  }

  setAmbientVolume(v: number): void {
    this.ambientVolume = Math.max(0, Math.min(1, v));
    const ctx = this.ctx;
    if (this.ambientGain && this.currentAmbient && ctx) {
      this.ambientGain.gain.linearRampToValueAtTime(
        this.ambientVolume,
        ctx.currentTime + 0.3,
      );
    }
  }

  stopAmbient(): void {
    const ctx = this.ctx;
    if (this.ambientGain && ctx) {
      this.ambientGain.gain.cancelScheduledValues(ctx.currentTime);
      this.ambientGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.8);
    }
    const dying = this.ambientNodes;
    this.ambientNodes = [];
    this.currentAmbient = null;
    setTimeout(() => dying.forEach((n) => safeStop(n)), 1000);
  }

  /** Optional spoken cue (e.g. "breathe in"). Off unless the spec asks. */
  speak(text: string): void {
    if (typeof speechSynthesis === 'undefined') return;
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.85;
      u.pitch = 0.9;
      u.volume = Math.min(1, this.toneVolume + 0.3);
      speechSynthesis.speak(u);
    } catch {
      /* not supported */
    }
  }

  dispose(): void {
    this.stopAmbient();
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }

  /** Generate the ambient bed for an id using noise/oscillators. */
  private buildAmbient(
    ctx: AudioContext,
    out: GainNode,
    id: AmbientId,
  ): AudioScheduledSourceNode[] {
    switch (id) {
      case 'drone':
      case 'night':
      case 'dawn': {
        // Stacked detuned sines — a warm, slow drone. 'dawn' sits a fifth
        // higher and brighter than 'night', so morning reads as a lift.
        const freqs =
          id === 'night'
            ? [110, 164.81, 220]
            : id === 'dawn'
              ? [164.81, 246.94, 329.63]
              : [98, 146.83, 196];
        return freqs.map((f, i) => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.value = f;
          osc.detune.value = (i - 1) * 4;
          g.gain.value = 0.12 / freqs.length;
          osc.connect(g).connect(out);
          return osc;
        });
      }
      case 'rain':
      case 'ocean': {
        // Filtered white noise; ocean sways its filter slowly.
        const noise = makeNoiseSource(ctx);
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = id === 'rain' ? 1800 : 600;
        if (id === 'ocean') {
          const lfo = ctx.createOscillator();
          const lfoGain = ctx.createGain();
          lfo.frequency.value = 0.1;
          lfoGain.gain.value = 300;
          lfo.connect(lfoGain).connect(filter.frequency);
          noise.connect(filter).connect(out);
          return [noise, lfo];
        }
        noise.connect(filter).connect(out);
        return [noise];
      }
    }
  }
}

function makeNoiseSource(ctx: AudioContext): AudioBufferSourceNode {
  const seconds = 2;
  const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  // Brown-ish noise: integrate white noise for a softer, less hissy bed.
  let last = 0;
  for (let i = 0; i < data.length; i++) {
    const white = Math.random() * 2 - 1;
    last = (last + 0.02 * white) / 1.02;
    data[i] = last * 3.5;
  }
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.loop = true;
  return src;
}

function safeStop(n: AudioScheduledSourceNode): void {
  try {
    n.stop();
  } catch {
    /* already stopped */
  }
}
