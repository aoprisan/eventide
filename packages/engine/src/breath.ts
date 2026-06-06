import type { BreathPattern, BreathPhase, BreathPhaseKind } from './types.js';

/** Built-in breath presets. The custom builder produces the same shape. */
export const BREATH_PRESETS: BreathPattern[] = [
  {
    id: 'coherent',
    label: 'Coherent (5·5)',
    phases: [
      { kind: 'inhale', seconds: 5 },
      { kind: 'exhale', seconds: 5 },
    ],
  },
  {
    id: 'box',
    label: 'Box (4·4·4·4)',
    phases: [
      { kind: 'inhale', seconds: 4 },
      { kind: 'hold', seconds: 4 },
      { kind: 'exhale', seconds: 4 },
      { kind: 'holdEmpty', seconds: 4 },
    ],
  },
  {
    id: '478',
    label: 'Relaxing (4·7·8)',
    phases: [
      { kind: 'inhale', seconds: 4 },
      { kind: 'hold', seconds: 7 },
      { kind: 'exhale', seconds: 8 },
    ],
  },
  {
    id: 'calming',
    label: 'Calming (4·6)',
    phases: [
      { kind: 'inhale', seconds: 4 },
      { kind: 'exhale', seconds: 6 },
    ],
  },
];

export function makeCustomPattern(
  inhale: number,
  hold: number,
  exhale: number,
  holdEmpty: number,
): BreathPattern {
  const phases: BreathPhase[] = [{ kind: 'inhale', seconds: inhale }];
  if (hold > 0) phases.push({ kind: 'hold', seconds: hold });
  phases.push({ kind: 'exhale', seconds: exhale });
  if (holdEmpty > 0) phases.push({ kind: 'holdEmpty', seconds: holdEmpty });
  const fmt = [inhale, hold, exhale, holdEmpty].filter((n) => n > 0).join('·');
  return { id: 'custom', label: `Custom (${fmt})`, phases };
}

export function patternById(id: string | undefined): BreathPattern | undefined {
  if (!id) return undefined;
  return BREATH_PRESETS.find((p) => p.id === id);
}

export function cycleSeconds(pattern: BreathPattern): number {
  return pattern.phases.reduce((s, p) => s + p.seconds, 0);
}

/** A cosine ease so the orb's motion has no hard edges at phase joins. */
function easeInOut(t: number): number {
  return 0.5 - 0.5 * Math.cos(Math.PI * Math.max(0, Math.min(1, t)));
}

export interface PacerFrame {
  phase: BreathPhaseKind;
  /** Progress within the current phase, 0–1. */
  phaseProgress: number;
  /** Seconds remaining in the current phase. */
  phaseRemaining: number;
  /** Lung "fullness" 0 (empty) → 1 (full), smoothly eased. Drives the orb. */
  amplitude: number;
  /** Which cycle we are in (0-based). */
  cycle: number;
}

/**
 * Sample the breath pattern at an absolute elapsed time (seconds).
 * Pure function — the same input always yields the same frame.
 */
export function sampleBreath(pattern: BreathPattern, elapsed: number): PacerFrame {
  const cycleLen = cycleSeconds(pattern) || 1;
  const cycle = Math.floor(elapsed / cycleLen);
  let t = elapsed - cycle * cycleLen;

  for (const phase of pattern.phases) {
    if (t < phase.seconds || phase === pattern.phases[pattern.phases.length - 1]) {
      const clamped = Math.min(t, phase.seconds);
      const phaseProgress = phase.seconds > 0 ? clamped / phase.seconds : 1;
      const eased = easeInOut(phaseProgress);
      let amplitude: number;
      switch (phase.kind) {
        case 'inhale':
          amplitude = eased;
          break;
        case 'hold':
          amplitude = 1;
          break;
        case 'exhale':
          amplitude = 1 - eased;
          break;
        case 'holdEmpty':
          amplitude = 0;
          break;
      }
      return {
        phase: phase.kind,
        phaseProgress,
        phaseRemaining: Math.max(0, phase.seconds - clamped),
        amplitude,
        cycle,
      };
    }
    t -= phase.seconds;
  }
  // Unreachable (loop always returns on the last phase), but keeps types happy.
  return { phase: 'inhale', phaseProgress: 0, phaseRemaining: 0, amplitude: 0, cycle };
}

export const PHASE_LABEL: Record<BreathPhaseKind, string> = {
  inhale: 'Breathe in',
  hold: 'Hold',
  exhale: 'Breathe out',
  holdEmpty: 'Hold',
};
