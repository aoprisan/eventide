import { useEngine } from '../engine/EngineContext.js';
import { TopBar } from '../components/ui.js';
import { computeInsights, type ModuleId, type StoredSession } from '@eventide/engine';
import { MODULES } from '../modules.js';

const DAY_MS = 86_400_000;
const TALLY_DAYS = 14;

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

/** The last `TALLY_DAYS` days, each marked lit if a session happened on it.
 *  Derived straight from `sessions[]` — no separate counter. */
function recentNights(sessions: StoredSession[]): Night[] {
  const today = dayIndex(Date.now());
  const lit = new Set(sessions.map((s) => dayIndex(s.startedAt)));
  return Array.from({ length: TALLY_DAYS }, (_, i) => {
    const day = today - (TALLY_DAYS - 1) + i;
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
      <header className="col" style={{ marginBottom: 28 }}>
        <span className="overline overline-hour">Insights</span>
        <h1 className="display" style={{ marginTop: 8 }}>
          Your practice
        </h1>
        <p className="faint" style={{ marginTop: 10 }}>
          Everything here is computed from sessions you actually did — never a separate
          chore.
        </p>
      </header>

      {!hasData ? (
        <div className="col text-center" style={{ padding: '40px 0', borderTop: '1px solid var(--line)' }}>
          <p className="serif-italic" style={{ fontSize: '1.4rem' }}>
            Nothing logged yet.
          </p>
          <p className="faint" style={{ marginTop: 8 }}>
            Finish a practice and your patterns will gather here.
          </p>
        </div>
      ) : (
        <>
          <section className="stat-feature">
            <div className="rule-head">
              <span className="overline">Current streak</span>
            </div>
            <div className="streak-num">
              {insights.currentStreak}
              <span className="unit">
                night{insights.currentStreak === 1 ? '' : 's'}
              </span>
            </div>

            {/* the last fourteen nights as a tally — lit on the days a
                session happened, a direct picture of the append-only log */}
            <div className="tally" aria-hidden>
              {nights.map((n, i) => (
                <span
                  key={i}
                  className={`tally-tick ${n.lit ? 'lit' : ''} ${n.isToday ? 'today' : ''}`}
                />
              ))}
            </div>
            <div className="tally-caption">
              <span>{TALLY_DAYS} nights ago</span>
              <span>Tonight</span>
            </div>

            <div className="mini-stats">
              <Mini num={insights.totalSessions} label="Sessions" />
              <Mini num={insights.totalMinutes} label="Minutes" unit="min" />
              <Mini num={insights.longestStreak} label="Longest" />
            </div>
          </section>

          {moduleRows.length > 0 && (
            <section className="col" style={{ marginTop: 32 }}>
              <div className="rule-head">
                <span className="overline">By practice</span>
              </div>
              <div className="index">
                {moduleRows.map((r, i) => (
                  <div key={r.id} className="index-row index-row-static">
                    <span className="index-num">{String(i + 1).padStart(2, '0')}</span>
                    <span className="index-name grow">
                      {MODULES[r.id as 'breath' | 'candle' | 'meditation'].name}
                    </span>
                    <span className="muted">
                      {r.sessions} · {Math.round(r.minutes)} min
                    </span>
                  </div>
                ))}
              </div>
            </section>
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
