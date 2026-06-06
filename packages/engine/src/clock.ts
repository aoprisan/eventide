/**
 * A pause-aware monotonic clock built on requestAnimationFrame.
 * Reports elapsed *active* seconds (paused time is excluded) and ticks the
 * host on every animation frame so visuals stay smooth.
 */
export type ClockTick = (elapsedSeconds: number) => void;

const now = (): number =>
  typeof performance !== 'undefined' ? performance.now() : Date.now();

export class SessionClock {
  private rafId: number | null = null;
  private startStamp = 0;
  private accumulated = 0; // ms of active time banked before the current run segment
  private running = false;
  private tick: ClockTick;

  constructor(tick: ClockTick) {
    this.tick = tick;
  }

  get elapsedSeconds(): number {
    const live = this.running ? now() - this.startStamp : 0;
    return (this.accumulated + live) / 1000;
  }

  get isRunning(): boolean {
    return this.running;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.startStamp = now();
    this.loop();
  }

  pause(): void {
    if (!this.running) return;
    this.accumulated += now() - this.startStamp;
    this.running = false;
    this.cancel();
    // One final tick so the UI reflects the paused position.
    this.tick(this.elapsedSeconds);
  }

  toggle(): void {
    this.running ? this.pause() : this.start();
  }

  stop(): void {
    this.running = false;
    this.cancel();
  }

  reset(): void {
    this.stop();
    this.accumulated = 0;
    this.startStamp = 0;
  }

  private loop = (): void => {
    if (!this.running) return;
    this.tick(this.elapsedSeconds);
    if (typeof requestAnimationFrame !== 'undefined') {
      this.rafId = requestAnimationFrame(this.loop);
    }
  };

  private cancel(): void {
    if (this.rafId != null && typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(this.rafId);
    }
    this.rafId = null;
  }
}
