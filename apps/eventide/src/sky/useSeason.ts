import { useEffect, useState } from 'react';
import { seasonOf, type Season } from './sky.js';
import { activeDate } from './useSky.js';

/**
 * The season the atmosphere should wear right now. When `override` is set
 * (the user picked one in Settings) it wins outright; otherwise the season is
 * derived from the date and re-checked every minute and on return to the
 * foreground — so an app left open across a solstice quietly turns over without
 * a reload. Reads the same {@link activeDate} clock as the sky, so the tint and
 * the graphics never drift apart, and the `?sky=&doy=` dev preview moves both.
 */
export function useSeason(override?: Season): Season {
  const [season, setSeason] = useState<Season>(() => override ?? seasonOf(activeDate()));

  useEffect(() => {
    if (override) {
      setSeason(override);
      return;
    }
    const tick = () => setSeason(seasonOf(activeDate()));
    tick();
    const id = window.setInterval(tick, 60_000);
    const onVisible = () => {
      if (!document.hidden) tick();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [override]);

  return season;
}
