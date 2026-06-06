import { useEffect } from 'react';
import { skyAt } from './sky.js';

/**
 * Dev/QA only: `?sky=<hour>&doy=<dayOfYear>` pins the sky to a simulated moment
 * so the whole day-and-year cycle can be previewed without waiting. Inert (and
 * therefore harmless in production) whenever the param is absent.
 */
function simulatedDate(): Date | null {
  if (typeof location === 'undefined') return null;
  const p = new URLSearchParams(location.search);
  const sky = p.get('sky');
  if (sky === null) return null;
  const hour = parseFloat(sky);
  const d = new Date();
  const doy = p.get('doy');
  if (doy !== null) {
    const jan1 = new Date(d.getFullYear(), 0, 1);
    jan1.setDate(parseInt(doy, 10));
    d.setMonth(jan1.getMonth(), jan1.getDate());
  }
  d.setHours(Math.floor(hour), Math.round((hour % 1) * 60), 0, 0);
  return d;
}

/**
 * Drives the living sky. Resolves the current {@link skyAt} state into CSS
 * custom properties on :root (the `.sky`, `.skystars`, and `.moon` layers read
 * them), keeps the PWA status-bar colour in step, and re-resolves every minute
 * and whenever the app returns to the foreground. The colour vars are animated
 * in CSS, so each tick is a soft drift rather than a cut.
 */
export function useSky(): void {
  useEffect(() => {
    const root = document.documentElement;
    const meta = document.querySelector('meta[name="theme-color"]');

    const sim = simulatedDate();
    function apply() {
      const s = skyAt(sim ?? new Date());
      root.style.setProperty('--sky-top', s.top);
      root.style.setProperty('--sky-mid', s.mid);
      root.style.setProperty('--sky-bottom', s.bottom);
      root.style.setProperty('--sky-glow', s.glow);
      root.style.setProperty('--sky-glow-x', s.glowX);
      root.style.setProperty('--sky-glow-y', s.glowY);
      root.style.setProperty('--star-opacity', String(s.starOpacity));
      root.style.setProperty('--moon-opacity', String(s.moonOpacity));
      root.dataset.phase = s.phase;
      root.dataset.season = s.season;
      meta?.setAttribute('content', s.bottom);
    }

    apply();
    const id = window.setInterval(apply, 60_000);
    const onVisible = () => {
      if (!document.hidden) apply();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);
}
