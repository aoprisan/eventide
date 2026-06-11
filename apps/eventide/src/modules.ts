import {
  BREATH_PRESETS,
  type AmbientId,
  type GuideVisual,
  type ModuleId,
  type Ritual,
  type RitualKind,
  type RitualStep,
} from '@eventide/engine';

/** Catalog metadata for the three MVP modules. Pure data — no behavior. */
export interface ModuleInfo {
  id: ModuleId;
  name: string;
  tagline: string;
  guide: GuideVisual;
  /** Duration choices offered at setup, in seconds. */
  durations: number[];
  defaultDuration: number;
  /** Whether the module is breath-paced (shows the pattern picker). */
  paced: boolean;
  defaultAmbient: AmbientId | null;
}

export const MODULES: Record<'breath' | 'candle' | 'meditation', ModuleInfo> = {
  breath: {
    id: 'breath',
    name: 'Breath',
    tagline: 'Let a slow rhythm carry you down',
    guide: 'orb',
    durations: [120, 300, 600, 900],
    defaultDuration: 300,
    paced: true,
    defaultAmbient: null,
  },
  candle: {
    id: 'candle',
    name: 'Candle',
    tagline: 'Rest your gaze on a single flame',
    guide: 'flame',
    durations: [120, 300, 600],
    defaultDuration: 300,
    paced: false,
    defaultAmbient: 'drone',
  },
  meditation: {
    id: 'meditation',
    name: 'Meditation',
    tagline: 'A quiet, timed sit',
    guide: 'silent',
    durations: [300, 600, 900, 1200],
    defaultDuration: 600,
    paced: false,
    defaultAmbient: 'night',
  },
};

export const AMBIENTS: { id: AmbientId | null; label: string }[] = [
  { id: null, label: 'Silence' },
  { id: 'night', label: 'Night' },
  { id: 'dawn', label: 'Dawn' },
  { id: 'rain', label: 'Rain' },
  { id: 'ocean', label: 'Ocean' },
  { id: 'drone', label: 'Drone' },
];

export const BREATH_PATTERNS = BREATH_PRESETS;

export function formatDuration(seconds: number): string {
  const m = Math.round(seconds / 60);
  return `${m} min`;
}

/** The default evening "Tonight" chain (design doc §7). Uneditable id. */
export const DEFAULT_RITUAL: Ritual = {
  id: 'default',
  name: 'Wind-down',
  kind: 'evening',
  dimToSleep: true,
  steps: [
    { module: 'candle', amount: 120 },
    { module: 'breath', amount: 300, pacingId: 'coherent' },
    { module: 'meditation', amount: 180 },
  ],
};

/** The default morning chain — the waking counterpart to "Tonight". Box breath
 *  to clear sleep, then a short sit to set the day's intention. Uneditable id. */
export const DEFAULT_MORNING_RITUAL: Ritual = {
  id: 'default-morning',
  name: 'Wake-up',
  kind: 'morning',
  dimToSleep: false,
  steps: [
    { module: 'breath', amount: 180, pacingId: 'box' },
    { module: 'meditation', amount: 120 },
  ],
};

/**
 * Everything that differs between the evening ("Tonight") and morning flows.
 * Both run on the exact same orchestration — only the copy, light, and audio
 * change — so the two ends of the day stay one consistent primitive.
 */
export interface FlowInfo {
  kind: RitualKind;
  defaultRitual: Ritual;
  heroEyebrow: string;
  heroTitle: string;
  heroSub: string;
  /** List screen. */
  listTitle: string;
  listIntro: string;
  /** One continuous ambient bed carried across the chain. */
  ambient: AmbientId | null;
  /** The step the "build your own" form seeds with. */
  builderSeed: RitualStep;
  builderName: string;
  /** Closing screen when the chain finishes. */
  completeTitle: string;
  completeBody: string;
}

export const FLOWS: Record<RitualKind, FlowInfo> = {
  evening: {
    kind: 'evening',
    defaultRitual: DEFAULT_RITUAL,
    heroEyebrow: 'Tonight',
    heroTitle: 'Begin the wind-down',
    heroSub: 'A calm sequence to carry you toward sleep, hands-free.',
    listTitle: 'Your rituals',
    listIntro:
      'A chain runs hands-free — each practice flows into the next, and the screen softens toward sleep.',
    ambient: 'night',
    builderSeed: { module: 'breath', amount: 300, pacingId: 'coherent' },
    builderName: 'My ritual',
    completeTitle: 'Sleep well',
    completeBody: 'The day is closed. Set the phone down and let the dark do the rest.',
  },
  morning: {
    kind: 'morning',
    defaultRitual: DEFAULT_MORNING_RITUAL,
    heroEyebrow: 'Morning',
    heroTitle: 'Rise into the day',
    heroSub: 'A short sequence to clear sleep and set an intention, hands-free.',
    listTitle: 'Your morning rituals',
    listIntro:
      'A chain runs hands-free — each practice flows into the next, and the light lifts as you wake.',
    ambient: 'dawn',
    builderSeed: { module: 'breath', amount: 180, pacingId: 'box' },
    builderName: 'My morning',
    completeTitle: 'Good morning',
    completeBody: 'You set the tone. Carry the quiet with you into the day.',
  },
};

/** The default ritual for a flow plus the user's saved rituals of that kind.
 *  Rituals with no `kind` are treated as evening (the original behavior). */
export function ritualsForKind(kind: RitualKind, saved: Ritual[]): Ritual[] {
  return [
    FLOWS[kind].defaultRitual,
    ...saved.filter((r) => (r.kind ?? 'evening') === kind),
  ];
}
