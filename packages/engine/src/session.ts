import { AudioEngine } from './audio.js';
import { PHASE_LABEL, sampleBreath } from './breath.js';
import { SessionClock } from './clock.js';
import { HAPTICS, vibrate } from './haptics.js';
import type { PacerFrame } from './breath.js';
import type { SessionResult, SessionSpec } from './types.js';
import { WakeLock } from './wakeLock.js';

export type SessionStatus = 'idle' | 'running' | 'paused' | 'complete';

/** A snapshot pushed to subscribers on every animation frame. */
export interface SessionFrame {
  status: SessionStatus;
  elapsed: number;
  /** 0–1 toward the session's end, or null for open-ended sessions. */
  progress: number | null;
  /** Seconds remaining for timed sessions, else null. */
  remaining: number | null;
  /** Completed reps for counted sessions. */
  reps: number;
  /** Breath pacer state, present only for paced sessions. */
  pacer: PacerFrame | null;
  /** Human-readable cue for the current moment ("Breathe in", "Hold"…). */
  cue: string;
}

export type FrameListener = (frame: SessionFrame) => void;
export type CompleteListener = (result: SessionResult) => void;

/**
 * Runs exactly one {@link SessionSpec}. Owns the timing, drives audio/haptics/
 * wake-lock as side effects, and on completion produces a {@link SessionResult}
 * (which the host persists). The controller itself does no storage — logging is
 * a side effect of finishing, never a separate path.
 */
export class SessionController {
  readonly spec: SessionSpec;
  private clock: SessionClock;
  private audio: AudioEngine | null;
  private wakeLock = new WakeLock();

  private status: SessionStatus = 'idle';
  private frameListeners = new Set<FrameListener>();
  private completeListeners = new Set<CompleteListener>();

  private startedAt = 0;
  private lastPhaseKind: string | null = null;
  private reps = 0;
  private lastRepCycle = -1;
  /** True only when this session itself started the ambient bed. */
  private ownsAmbient = false;

  constructor(spec: SessionSpec, audio?: AudioEngine) {
    this.spec = spec;
    this.audio = audio ?? null;
    this.clock = new SessionClock((elapsed) => this.onTick(elapsed));
  }

  subscribe(fn: FrameListener): () => void {
    this.frameListeners.add(fn);
    fn(this.snapshot(this.clock.elapsedSeconds));
    return () => this.frameListeners.delete(fn);
  }

  onComplete(fn: CompleteListener): () => void {
    this.completeListeners.add(fn);
    return () => this.completeListeners.delete(fn);
  }

  async start(): Promise<void> {
    if (this.status === 'running') return;
    if (this.status === 'idle') {
      this.startedAt = Date.now();
      if (this.spec.audio?.ambient && this.audio) {
        this.audio.setAmbient(this.spec.audio.ambient);
        this.ownsAmbient = true;
      }
      if (this.spec.wakeLock) await this.wakeLock.acquire();
      if (this.spec.haptics) vibrate(this.spec.haptics);
      else vibrate(HAPTICS.start);
    }
    this.status = 'running';
    this.clock.start();
    this.emit();
  }

  pause(): void {
    if (this.status !== 'running') return;
    this.status = 'paused';
    this.clock.pause();
    void this.wakeLock.release();
    this.emit();
  }

  async resume(): Promise<void> {
    if (this.status !== 'paused') return;
    if (this.spec.wakeLock) await this.wakeLock.acquire();
    this.status = 'running';
    this.clock.start();
  }

  /** Count one repetition (bead/mantra) for counted sessions. */
  tapRep(): void {
    if (this.status !== 'running') return;
    this.reps += 1;
    vibrate(HAPTICS.tap);
    if (this.spec.end.kind === 'reps' && this.reps >= this.spec.end.count) {
      this.finish('completed');
    } else {
      this.emit();
    }
  }

  /** End early; the host supplies the outcome it wants to log. */
  end(outcome: SessionResult['outcome'] = 'partial'): SessionResult {
    return this.finish(outcome);
  }

  private onTick(elapsed: number): void {
    if (this.status !== 'running') return;

    if (this.spec.pacing) {
      const frame = sampleBreath(this.spec.pacing, elapsed);
      if (frame.phase !== this.lastPhaseKind) {
        this.onPhaseChange(frame.phase);
        this.lastPhaseKind = frame.phase;
      }
      if (this.spec.end.kind === 'reps' && frame.cycle > this.lastRepCycle) {
        this.lastRepCycle = frame.cycle;
        this.reps = frame.cycle;
        if (this.reps >= this.spec.end.count) {
          this.finish('completed');
          return;
        }
      }
    }

    if (this.spec.end.kind === 'duration' && elapsed >= this.spec.end.seconds) {
      this.finish('completed');
      return;
    }

    this.emit();
  }

  private onPhaseChange(phase: PacerFrame['phase']): void {
    if (this.lastPhaseKind === null) {
      // First phase of the session — already cued by start().
    } else if (this.spec.audio?.tones && this.audio) {
      this.audio.playTone(phase === 'inhale' ? 'rise' : phase === 'exhale' ? 'fall' : 'steady');
    }
    if (phase === 'inhale' || phase === 'exhale') vibrate(HAPTICS.tap);
    if (this.spec.audio?.spoken && this.audio && this.lastPhaseKind !== null) {
      this.audio.speak(PHASE_LABEL[phase]);
    }
  }

  private finish(outcome: SessionResult['outcome']): SessionResult {
    const durationActual = this.clock.elapsedSeconds;
    this.status = 'complete';
    this.clock.stop();
    void this.wakeLock.release();
    // Only tear down the ambient bed if this session started it — a "Tonight"
    // chain owns a continuous bed across its steps.
    if (this.audio && this.ownsAmbient) this.audio.stopAmbient();
    vibrate(HAPTICS.complete);
    if (this.spec.audio?.tones && this.audio) this.audio.playTone('fall');

    const result: SessionResult = {
      module: this.spec.module,
      startedAt: this.startedAt || Date.now(),
      durationActual,
    };
    if (this.spec.intention) result.intention = this.spec.intention;
    if (outcome) result.outcome = outcome;

    this.emit();
    this.completeListeners.forEach((fn) => fn(result));
    return result;
  }

  private emit(): void {
    const frame = this.snapshot(this.clock.elapsedSeconds);
    this.frameListeners.forEach((fn) => fn(frame));
  }

  private snapshot(elapsed: number): SessionFrame {
    const pacer = this.spec.pacing ? sampleBreath(this.spec.pacing, elapsed) : null;
    let progress: number | null = null;
    let remaining: number | null = null;
    const end = this.spec.end;
    if (end.kind === 'duration') {
      progress = Math.min(1, elapsed / end.seconds);
      remaining = Math.max(0, end.seconds - elapsed);
    } else if (end.kind === 'reps') {
      progress = Math.min(1, this.reps / end.count);
    }

    let cue = '';
    if (pacer) cue = PHASE_LABEL[pacer.phase];
    else if (this.spec.module === 'candle') cue = 'Soften your gaze';
    else if (this.spec.module === 'meditation') cue = 'Rest your attention';

    return {
      status: this.status,
      elapsed,
      progress,
      remaining,
      reps: this.reps,
      pacer,
      cue,
    };
  }

  dispose(): void {
    this.clock.stop();
    void this.wakeLock.release();
    this.frameListeners.clear();
    this.completeListeners.clear();
  }
}
