import { useNav } from '../nav.js';
import { useEngine } from '../engine/EngineContext.js';
import { MODULES } from '../modules.js';
import { Icon } from '../components/ui.js';
import { computeInsights } from '@eventide/engine';

function greeting(): string {
  const h = new Date().getHours();
  if (h >= 21 || h < 4) return 'Late night';
  if (h >= 17) return 'Good evening';
  if (h >= 12) return 'Good afternoon';
  if (h >= 5) return 'Good morning';
  return 'Late night';
}

export function HomeScreen() {
  const nav = useNav();
  const { sessions } = useEngine();
  const insights = computeInsights(sessions);

  return (
    <div className="shell view-enter">
      <header className="col" style={{ paddingTop: 18, paddingBottom: 30 }}>
        <span className="eyebrow">{greeting()}</span>
        <h1 className="display" style={{ marginTop: 8 }}>
          The turning
          <br />
          of the day
        </h1>
        {insights.currentStreak > 0 && (
          <p className="muted" style={{ marginTop: 14 }}>
            <span className="serif-italic" style={{ color: 'var(--amber)' }}>
              {insights.currentStreak} day{insights.currentStreak > 1 ? 's' : ''}
            </span>{' '}
            of practice. {insights.totalMinutes} minutes, all yours.
          </p>
        )}
      </header>

      <button
        className="tonight-hero view-enter"
        onClick={() => nav.push({ name: 'tonight' })}
      >
        <span className="moon-badge">
          <Icon name="moon" size={26} />
        </span>
        <span className="eyebrow">Tonight</span>
        <h2 style={{ fontSize: '2rem', marginTop: 6 }}>Begin the wind-down</h2>
        <p className="muted" style={{ marginTop: 8, maxWidth: 320 }}>
          A calm sequence to carry you toward sleep, hands-free.
        </p>
      </button>

      <div className="col" style={{ marginTop: 30, gap: 14 }}>
        <span className="eyebrow">Or a single practice</span>
        <div className="tile-grid stagger">
          {(['breath', 'candle', 'meditation'] as const).map((id) => {
            const m = MODULES[id];
            return (
              <button
                key={id}
                className="tile"
                onClick={() => nav.push({ name: 'setup', module: id })}
                style={id === 'meditation' ? { gridColumn: '1 / -1' } : undefined}
              >
                <span className="tile-name">{m.name}</span>
                <span className="tile-tag">{m.tagline}</span>
                <span className={`tile-glyph glyph-${m.guide === 'orb' ? 'orb' : m.guide === 'flame' ? 'flame' : 'silent'}`} />
              </button>
            );
          })}
        </div>
      </div>

      <div className="grow" />

      <footer className="row between" style={{ paddingTop: 28 }}>
        <button className="btn btn-ghost" onClick={() => nav.push({ name: 'insights' })}>
          <Icon name="chart" size={18} /> Insights
        </button>
        <button className="icon-btn" aria-label="Settings" onClick={() => nav.push({ name: 'settings' })}>
          <Icon name="gear" />
        </button>
      </footer>
    </div>
  );
}
