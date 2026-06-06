import type { ModuleId, StoredSession } from './types.js';

/**
 * All insights are *computed* from the append-only session log (design doc §8).
 * These are pure functions over `StoredSession[]` — there are no separate stat
 * counters anywhere in the system.
 */
export interface Insights {
  totalSessions: number;
  totalMinutes: number;
  /** Consecutive days (ending today or yesterday) with at least one session. */
  currentStreak: number;
  longestStreak: number;
  perModule: Record<ModuleId, { sessions: number; minutes: number }>;
  /** % of craving sessions ridden out, or null if none logged yet. */
  cravingWinRate: number | null;
}

const DAY_MS = 86_400_000;

/** Local-midnight day index for an epoch-ms timestamp. */
function dayIndex(epochMs: number): number {
  const d = new Date(epochMs);
  d.setHours(0, 0, 0, 0);
  return Math.floor(d.getTime() / DAY_MS);
}

function emptyPerModule(): Insights['perModule'] {
  const modules: ModuleId[] = [
    'breath',
    'candle',
    'meditation',
    'dream',
    'craving',
    'repetition',
    'ritual',
  ];
  const out = {} as Insights['perModule'];
  for (const m of modules) out[m] = { sessions: 0, minutes: 0 };
  return out;
}

export function computeInsights(
  sessions: StoredSession[],
  todayMs: number = Date.now(),
): Insights {
  const perModule = emptyPerModule();
  let totalSeconds = 0;
  let cravingTotal = 0;
  let cravingRodeOut = 0;

  for (const s of sessions) {
    totalSeconds += s.durationActual;
    const bucket = perModule[s.module];
    bucket.sessions += 1;
    bucket.minutes += s.durationActual / 60;
    if (s.module === 'craving') {
      cravingTotal += 1;
      if (s.outcome === 'rode-it-out') cravingRodeOut += 1;
    }
  }

  const { currentStreak, longestStreak } = computeStreaks(sessions, todayMs);

  return {
    totalSessions: sessions.length,
    totalMinutes: Math.round(totalSeconds / 60),
    currentStreak,
    longestStreak,
    perModule,
    cravingWinRate: cravingTotal ? cravingRodeOut / cravingTotal : null,
  };
}

function computeStreaks(
  sessions: StoredSession[],
  todayMs: number,
): { currentStreak: number; longestStreak: number } {
  if (sessions.length === 0) return { currentStreak: 0, longestStreak: 0 };

  const days = [...new Set(sessions.map((s) => dayIndex(s.startedAt)))].sort(
    (a, b) => a - b,
  );

  // Longest run of consecutive days anywhere in the history.
  let longest = 1;
  let run = 1;
  for (let i = 1; i < days.length; i++) {
    if (days[i] === days[i - 1] + 1) {
      run += 1;
      longest = Math.max(longest, run);
    } else {
      run = 1;
    }
  }

  // Current streak: count back from today (or yesterday, to be forgiving).
  const today = dayIndex(todayMs);
  const last = days[days.length - 1];
  let current = 0;
  if (last === today || last === today - 1) {
    current = 1;
    for (let i = days.length - 2; i >= 0; i--) {
      if (days[i] === days[i + 1] - 1) current += 1;
      else break;
    }
  }

  return { currentStreak: current, longestStreak: longest };
}
