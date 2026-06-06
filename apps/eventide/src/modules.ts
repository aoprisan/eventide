import {
  BREATH_PRESETS,
  type AmbientId,
  type GuideVisual,
  type ModuleId,
  type Ritual,
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
  { id: 'rain', label: 'Rain' },
  { id: 'ocean', label: 'Ocean' },
  { id: 'drone', label: 'Drone' },
];

export const BREATH_PATTERNS = BREATH_PRESETS;

export function formatDuration(seconds: number): string {
  const m = Math.round(seconds / 60);
  return `${m} min`;
}

/** The default "Tonight" chain (design doc §7). Always present; uneditable id. */
export const DEFAULT_RITUAL: Ritual = {
  id: 'default',
  name: 'Wind-down',
  dimToSleep: true,
  steps: [
    { module: 'candle', amount: 120 },
    { module: 'breath', amount: 300, pacingId: 'coherent' },
    { module: 'meditation', amount: 180 },
  ],
};
