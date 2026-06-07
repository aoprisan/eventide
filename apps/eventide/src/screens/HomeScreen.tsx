import { useNav } from '../nav.js';
import { useEngine } from '../engine/EngineContext.js';
import { FLOWS, MODULES } from '../modules.js';
import { Icon } from '../components/ui.js';
import { computeInsights, type RitualKind } from '@eventide/engine';

function greeting(): string {
  const h = new Date().getHours();
  if (h >= 21 || h < 4) return 'Late night';
  if (h >= 17) return 'Good evening';
  if (h >= 12) return 'Good afternoon';
  if (h >= 5) return 'Good morning';
  return 'Late night';
}

// Before midday the morning chain leads; after, the evening one does. Both are
// always one tap away — the order just follows the hour.
function flowOrder(): RitualKind[] {
  const h = new Date().getHours();
  return h >= 4 && h < 12 ? ['morning', 'evening'] : ['evening', 'morning'];
}

export function HomeScreen() {
  const nav = useNav();
  const { sessions } = useEngine();
  const insights = computeInsights(sessions);
  const order = flowOrder();

  return (
    <div className="shell view-enter">
      <header className="col" style={{ paddingTop: 18, paddingBottom: 30 }}>
        <span className="eyebrow eyebrow-phase">{greeting()}</span>
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

      <div className="col gap stagger">
        {order.map((kind, i) => {
          const flow = FLOWS[kind];
          return (
            <button
              key={kind}
              className={`tonight-hero view-enter${kind === 'morning' ? ' hero-morning' : ''}`}
              onClick={() => nav.push({ name: 'ritual-list', kind })}
            >
              <span className="moon-badge">
                <Icon name={flow.icon} size={26} />
              </span>
              <span className="eyebrow">{flow.heroEyebrow}</span>
              <h2 style={{ fontSize: i === 0 ? '2rem' : '1.6rem', marginTop: 6 }}>
                {flow.heroTitle}
              </h2>
              <p className="muted" style={{ marginTop: 8, maxWidth: 320 }}>
                {flow.heroSub}
              </p>
            </button>
          );
        })}
      </div>

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
