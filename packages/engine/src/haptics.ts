import type { HapticPattern } from './types.js';

/** Named haptic patterns shared across modules (ms on/off/on/…). */
export const HAPTICS = {
  /** A single soft pulse — phase changes, a bead passing. */
  tap: [18] as HapticPattern,
  /** A gentle double — session start. */
  start: [24, 60, 24] as HapticPattern,
  /** A long, settling buzz — session complete. */
  complete: [40, 80, 40, 80, 120] as HapticPattern,
} as const;

let enabled = true;

export function setHapticsEnabled(on: boolean): void {
  enabled = on;
}

export function hapticsSupported(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
}

export function vibrate(pattern: HapticPattern): void {
  if (!enabled || !hapticsSupported()) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    /* not supported / blocked */
  }
}
