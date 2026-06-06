/**
 * @eventide/engine — a reusable guided-session engine.
 *
 * One primitive (a session) with shared services around it: timer/pacer, audio,
 * wake-lock, haptics, reduced-motion, and an append-only store from which all
 * insights are derived. Free of any app-specific branding or content so other
 * practice apps can embed it.
 */
export * from './types.js';
export * from './breath.js';
export { SessionClock } from './clock.js';
export { AudioEngine } from './audio.js';
export type { ToneType } from './audio.js';
export { WakeLock } from './wakeLock.js';
export { HAPTICS, vibrate, setHapticsEnabled, hapticsSupported } from './haptics.js';
export { reduceMotion, onMotionChange } from './motion.js';
export type { MotionPref } from './motion.js';
export { Store } from './store.js';
export { computeInsights } from './insights.js';
export type { Insights } from './insights.js';
export { SessionController } from './session.js';
export type {
  SessionStatus,
  SessionFrame,
  FrameListener,
  CompleteListener,
} from './session.js';
