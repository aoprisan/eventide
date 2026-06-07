/**
 * The engine's central contract (design doc §5).
 *
 * Every practice in the product is the *same primitive* — a guided session
 * described by a {@link SessionSpec} and producing a {@link SessionResult}.
 * Keep this file free of any app-specific branding or content: the engine is
 * meant to be embedded by other apps too.
 */

/** Which content module a session belongs to. */
export type ModuleId =
  | 'breath'
  | 'candle'
  | 'meditation'
  | 'dream'
  | 'craving'
  | 'repetition'
  | 'ritual';

/** The visual a session renders. The engine is visual-agnostic; this is a hint
 *  the host app uses to pick a renderer. */
export type GuideVisual = 'orb' | 'wave' | 'flame' | 'bead' | 'silent';

/** One phase of a breath cycle. */
export type BreathPhaseKind = 'inhale' | 'hold' | 'exhale' | 'holdEmpty';

export interface BreathPhase {
  kind: BreathPhaseKind;
  /** Duration of this phase in seconds. */
  seconds: number;
}

/** A repeating breath pattern (4-7-8, box, coherent, custom, …). */
export interface BreathPattern {
  id: string;
  label: string;
  phases: BreathPhase[];
}

/** Built-in synthesized ambient beds. No external audio assets required. */
export type AmbientId = 'rain' | 'drone' | 'ocean' | 'night' | 'dawn';

export interface AudioSpec {
  /** Tone cues at phase/session boundaries (rising/steady/falling). */
  tones?: boolean;
  /** Ambient bed to mix under the session, or null for silence. */
  ambient?: AmbientId | null;
  /** Spoken phase cues via SpeechSynthesis (optional, off by default). */
  spoken?: boolean;
}

/** A haptic pattern as a vibration timing array (ms on/off/on/…). */
export type HapticPattern = number[];

/** How a session decides it is finished. */
export type SessionEnd =
  | { kind: 'duration'; seconds: number }
  | { kind: 'reps'; count: number }
  | { kind: 'open' };

/**
 * The input to the engine. Describes a single guided session end-to-end.
 */
export interface SessionSpec {
  id: string;
  module: ModuleId;
  /** Optional one-line "why" / what you're feeling. */
  intention?: string;
  /** How the session ends. */
  end: SessionEnd;
  /** Breath cadence, when the module is paced. */
  pacing?: BreathPattern;
  guide: GuideVisual;
  audio?: AudioSpec;
  haptics?: HapticPattern;
  /** Keep the screen awake for the duration of the practice. */
  wakeLock?: boolean;
}

export type SessionOutcome = 'rode-it-out' | 'partial' | 'gave-in' | 'completed';

export interface DreamEntry {
  text: string;
  tags: string[];
  aiInterpretation?: string;
}

/**
 * The output of the engine — the single shape every insight is derived from.
 * Stored append-only; never mutated after write.
 */
export interface SessionResult {
  module: ModuleId;
  /** Epoch ms. */
  startedAt: number;
  /** Actual elapsed practice time in seconds (excludes paused time). */
  durationActual: number;
  intention?: string;
  /** Craving / mood scales, 1–10. */
  intensityBefore?: number;
  intensityAfter?: number;
  outcome?: SessionOutcome;
  note?: string;
  /** Craving + journal context. */
  trigger?: string;
  location?: string;
  emotion?: string;
  dream?: DreamEntry;
}

/** A persisted session: a {@link SessionResult} plus storage metadata. */
export interface StoredSession extends SessionResult {
  /** Stable unique id assigned at write time. */
  id: string;
  /** Schema version of the record, for forward migration. */
  v: number;
}

/** Which end of the day a ritual orchestrates. Evening winds down toward
 *  sleep; morning lifts toward the day. */
export type RitualKind = 'evening' | 'morning';

/** A saved chain — an ordered list of module steps. */
export interface RitualStep {
  module: ModuleId;
  /** Seconds for timed steps; reps for counted steps. */
  amount: number;
  pacingId?: string;
  intention?: string;
}

export interface Ritual {
  id: string;
  name: string;
  steps: RitualStep[];
  /** Which end of the day this chain belongs to. Defaults to 'evening'. */
  kind?: RitualKind;
  /** Whether the screen should dim toward the end of the chain (evening). */
  dimToSleep?: boolean;
}

/** Small key-value preferences, stored outside the append-only log. */
export interface Prefs {
  reducedMotion?: 'system' | 'on' | 'off';
  ambientVolume?: number;
  toneVolume?: number;
  haptics?: boolean;
  /** Evening window for gentle reminders, "HH:MM". */
  eveningStart?: string;
  /** BYO-agent endpoint/key for the optional AI layer (kept on device). */
  ai?: { enabled: boolean; endpoint?: string; key?: string };
  /** Last theme, etc. — host-app specific extras tolerated. */
  [key: string]: unknown;
}

/** The full exportable shape of the local store. */
export interface StoreExport {
  schema: 'eventide.store';
  v: number;
  exportedAt: number;
  sessions: StoredSession[];
  rituals: Ritual[];
  prefs: Prefs;
}
