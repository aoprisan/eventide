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

function dateline(): string {
  return new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'long' });
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
      <header className="masthead">
        <div className="row between">
          <span className="overline overline-hour">{greeting()}</span>
          <span className="overline">{dateline()}</span>
        </div>
        <h1 className="display" style={{ marginTop: 22 }}>
          The turning
          <br />
          of the day
        </h1>
        {insights.currentStreak > 0 && (
          <p className="muted" style={{ marginTop: 14 }}>
            <span className="serif-italic" style={{ color: 'var(--ember)' }}>
              {insights.currentStreak} day{insights.currentStreak > 1 ? 's' : ''}
            </span>{' '}
            of practice. {insights.totalMinutes} minutes, all yours.
          </p>
        )}
      </header>

      <div className="col stagger" style={{ gap: 14 }}>
        {order.map((kind) => {
          const flow = FLOWS[kind];
          return (
            <button
              key={kind}
              className={`passage${kind === 'morning' ? ' passage-morning' : ''}`}
              onClick={() => nav.push({ name: 'ritual-list', kind })}
            >
              <span className="passage-body">
                <span className="overline passage-eyebrow">{flow.heroEyebrow}</span>
                <span className="passage-title">{flow.heroTitle}</span>
                <span className="passage-sub">{flow.heroSub}</span>
              </span>
              <span className="passage-arrow">
                <Icon name="arrow" size={20} />
              </span>
            </button>
          );
        })}
      </div>

      <section className="col" style={{ marginTop: 36 }}>
        <div className="rule-head">
          <span className="overline">Or a single practice</span>
        </div>
        <div className="index stagger">
          {(['breath', 'candle', 'meditation'] as const).map((id, i) => {
            const m = MODULES[id];
            return (
              <button
                key={id}
                className="index-row"
                onClick={() => nav.push({ name: 'setup', module: id })}
              >
                <span className="index-num">{String(i + 1).padStart(2, '0')}</span>
                <span className="col grow" style={{ textAlign: 'left' }}>
                  <span className="index-name">{m.name}</span>
                  <span className="index-tag">{m.tagline}</span>
                </span>
                <span className="index-go">
                  <Icon name="arrow" size={18} />
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="grow" />

      <footer className="footer-links">
        <button className="link-btn" onClick={() => nav.push({ name: 'insights' })}>
          Insights
        </button>
        <span className="footer-dot">·</span>
        <button className="link-btn" onClick={() => nav.push({ name: 'settings' })}>
          Settings
        </button>
      </footer>
    </div>
  );
}
