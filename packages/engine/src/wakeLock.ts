/**
 * Keeps the screen awake during a practice. Re-acquires automatically when the
 * tab returns to the foreground (the OS drops the lock on visibility change).
 * Silently no-ops where the Screen Wake Lock API is unavailable.
 */
interface WakeLockSentinelLike {
  released: boolean;
  release(): Promise<void>;
  addEventListener(type: 'release', cb: () => void): void;
}

interface WakeLockNavigator {
  wakeLock?: { request(type: 'screen'): Promise<WakeLockSentinelLike> };
}

export class WakeLock {
  private sentinel: WakeLockSentinelLike | null = null;
  private wanted = false;
  private boundVisibility: (() => void) | null = null;

  get supported(): boolean {
    return typeof navigator !== 'undefined' && 'wakeLock' in navigator;
  }

  async acquire(): Promise<void> {
    this.wanted = true;
    if (!this.supported) return;
    await this.request();
    if (!this.boundVisibility) {
      this.boundVisibility = () => {
        if (document.visibilityState === 'visible' && this.wanted) {
          void this.request();
        }
      };
      document.addEventListener('visibilitychange', this.boundVisibility);
    }
  }

  async release(): Promise<void> {
    this.wanted = false;
    if (this.boundVisibility) {
      document.removeEventListener('visibilitychange', this.boundVisibility);
      this.boundVisibility = null;
    }
    if (this.sentinel && !this.sentinel.released) {
      try {
        await this.sentinel.release();
      } catch {
        /* ignore */
      }
    }
    this.sentinel = null;
  }

  private async request(): Promise<void> {
    const nav = navigator as unknown as WakeLockNavigator;
    if (!nav.wakeLock) return;
    try {
      this.sentinel = await nav.wakeLock.request('screen');
      this.sentinel.addEventListener('release', () => {
        this.sentinel = null;
      });
    } catch {
      /* user agent refused or not visible — fine */
    }
  }
}
