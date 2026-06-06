import { useEngine } from '../engine/EngineContext.js';
import { TopBar } from '../components/ui.js';
import { computeInsights, type ModuleId, type StoredSession } from '@eventide/engine';
import { MODULES } from '../modules.js';

const DAY_MS = 86_400_000;
const RIBBON_DAYS = 14;

/** Local-midnight day index for an epoch-ms timestamp (mirrors the engine). */
function dayIndex(epochMs: number): number {
  const d = new Date(epochMs);
  d.setHours(0, 0, 0, 0);
  return Math.floor(d.getTime() / DAY_MS);
}

interface Night {
  lit: boolean;
  isToday: boolean;
}

/** The last `RIBBON_DAYS` days, each marked lit if a session happened on it.
 *  Derived straight from `sessions[]` — no separate counter. */
function recentNights(sessions: StoredSession[]): Night[] {
  const today = dayIndex(Date.now());
  const lit = new Set(sessions.map((s) => dayIndex(s.startedAt)));
  return Array.from({ length: RIBBON_DAYS }, (_, i) => {
    const day = today - (RIBBON_DAYS - 1) + i;
    return { lit: lit.has(day), isToday: day === today };
  });
}

export function InsightsScreen() {
  const { sessions } = useEngine();
  const insights = computeInsights(sessions);
  const hasData = sessions.length > 0;
  const nights = recentNights(sessions);

  const moduleRows = (['breath', 'candle', 'meditation'] as ModuleId[])
    .map((m) => ({ id: m, ...insights.perModule[m] }))
    .filter((r) => r.sessions > 0);

  return (
    <div className="shell view-enter">
      <TopBar />
      <header className="col" style={{ marginBottom: 26 }}>
        <span className="eyebrow">Insights</span>
        <h1 className="display">Your practice</h1>
        <p className="faint" style={{ marginTop: 10 }}>
          Everything here is computed from sessions you actually did — never a separate
          chore.
        </p>
      </header>

      {!hasData ? (
        <div className="card text-center" style={{ padding: 40 }}>
          <p className="serif-italic" style={{ fontSize: '1.4rem' }}>
            Nothing logged yet.
          </p>
          <p className="faint" style={{ marginTop: 8 }}>
            Finish a practice and your patterns will gather here.
          </p>
        </div>
      ) : (
        <>
          <div className="insight-hero">
            <span className="eyebrow">Current streak</span>
            <div className="streak-num" style={{ marginTop: 6 }}>
              {insights.currentStreak}
              <span className="unit">
                night{insights.currentStreak === 1 ? '' : 's'}
              </span>
            </div>

            <div className="nights-ribbon" aria-hidden>
              {nights.map((n, i) => (
                <span
                  key={i}
                  className={`night-dot ${n.lit ? 'lit' : ''} ${n.isToday ? 'today' : ''}`}
                />
              ))}
            </div>
            <div className="ribbon-caption">
              <span>{RIBBON_DAYS} nights ago</span>
              <span>Tonight</span>
            </div>

            <div className="mini-stats">
              <Mini num={insights.totalSessions} label="Sessions" />
              <Mini num={insights.totalMinutes} label="Minutes" unit="min" />
              <Mini num={insights.longestStreak} label="Longest" />
            </div>
          </div>

          {moduleRows.length > 0 && (
            <div className="col gap-sm" style={{ marginTop: 26 }}>
              <span className="eyebrow">By practice</span>
              {moduleRows.map((r) => (
                <div key={r.id} className="list-row card">
                  <span
                    className="grow"
                    style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem' }}
                  >
                    {MODULES[r.id as 'breath' | 'candle' | 'meditation'].name}
                  </span>
                  <span className="muted">
                    {r.sessions} · {Math.round(r.minutes)} min
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Mini({ num, label, unit }: { num: number; label: string; unit?: string }) {
  return (
    <div className="mini-stat">
      <div className="mini-num">
        {num}
        {unit && <span className="unit">{unit}</span>}
      </div>
      <div className="mini-label">{label}</div>
    </div>
  );
}
