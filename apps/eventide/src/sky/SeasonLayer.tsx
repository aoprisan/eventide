import { useMemo, type CSSProperties } from 'react';
import type { Season } from './sky.js';
import './season.css';

/**
 * The seasonal weather of the app. Over the living sky it lays one quiet,
 * sleep-appropriate field of motion per season — never a snow-globe, always a
 * few slow things drifting at the edge of notice:
 *
 *   winter  · snow sifting down through a cool frost haze
 *   spring  · blossom petals tumbling on a soft breeze
 *   summer  · fireflies breathing in the warm dark
 *   autumn  · leaves turning as they fall
 *
 * Everything is dim and unhurried by design — this plays *under* the reading
 * surface as someone winds down, so it must soothe, not perform. Particle
 * layouts are seeded per season (deterministic, so a season always looks like
 * itself) and memoised, so React never reshuffles the field on a re-render.
 * `prefers-reduced-motion` is honoured in season.css: the field settles into a
 * still scatter rather than vanishing or freezing off-screen.
 */

type Kind = 'fall' | 'glow';
type Range = [number, number];

interface SeasonConfig {
  kind: Kind;
  shape: string;
  count: number;
  size: Range;
  /** seconds for a full top→bottom fall (fall) or a breath cycle (glow) */
  dur: Range;
  /** px of horizontal sway (fall) or wander radius (glow) */
  drift: Range;
  /** degrees of tumble over one fall (fall only) */
  spin: Range;
  opacity: Range;
  blur: Range;
}

const CONFIG: Record<Season, SeasonConfig> = {
  winter: { kind: 'fall', shape: 's-snow', count: 22, size: [3, 8], dur: [15, 28], drift: [10, 26], spin: [0, 0], opacity: [0.3, 0.8], blur: [0, 1.6] },
  spring: { kind: 'fall', shape: 's-petal', count: 16, size: [8, 14], dur: [13, 22], drift: [26, 58], spin: [240, 560], opacity: [0.4, 0.82], blur: [0, 0.5] },
  summer: { kind: 'glow', shape: 's-firefly', count: 16, size: [3, 6], dur: [6, 12], drift: [18, 40], spin: [0, 0], opacity: [0.25, 0.85], blur: [0, 0] },
  autumn: { kind: 'fall', shape: 's-leaf', count: 15, size: [10, 17], dur: [12, 21], drift: [28, 60], spin: [280, 640], opacity: [0.45, 0.85], blur: [0, 0.4] },
};

const SEED: Record<Season, number> = { winter: 0x5f7e, spring: 0x91ac, summer: 0x3d11, autumn: 0xc04e };

/** Small deterministic PRNG so each season's field is stable across renders. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Particle {
  outer: CSSProperties;
  inner: CSSProperties;
  shape: string;
}

function buildField(season: Season): Particle[] {
  const c = CONFIG[season];
  const rng = mulberry32(SEED[season]);
  const pick = ([lo, hi]: Range) => lo + (hi - lo) * rng();

  return Array.from({ length: c.count }, () => {
    const size = pick(c.size);
    const dur = pick(c.dur);
    const opacity = pick(c.opacity);
    const blur = pick(c.blur);

    if (c.kind === 'glow') {
      // Fireflies hold a fixed spot and breathe — drift + a soft opacity pulse.
      const inner: CSSProperties = {
        left: `${pick([2, 98])}%`,
        top: `${pick([8, 94])}%`,
        width: size,
        height: size,
        animationDuration: `${dur}s`,
        animationDelay: `${-pick([0, dur])}s`,
        ['--fx' as string]: `${pick([-1, 1]) * pick(c.drift)}px`,
        ['--fy' as string]: `${pick([-1, 1]) * pick(c.drift)}px`,
        ['--hi' as string]: opacity.toFixed(2),
        ['--lo' as string]: (opacity * 0.18).toFixed(2),
      };
      return { outer: { display: 'contents' }, inner, shape: c.shape };
    }

    // Falling particles: an outer element sways side to side while an inner
    // element falls and tumbles — two out-of-phase loops read as real drift.
    const sway = pick(c.drift);
    const swayDur = pick([3.5, 7]);
    const outer: CSSProperties = {
      left: `${pick([-4, 104])}%`,
      animationDuration: `${swayDur}s`,
      animationDelay: `${-pick([0, swayDur])}s`,
      ['--sway' as string]: `${sway}px`,
      ['--rest-y' as string]: `${pick([4, 92])}vh`,
    };
    const inner: CSSProperties = {
      width: size,
      height: season === 'autumn' || season === 'spring' ? size * 0.78 : size,
      opacity,
      animationDuration: `${dur}s`,
      animationDelay: `${-pick([0, dur])}s`,
      ['--spin' as string]: `${pick(c.spin)}deg`,
      ...(blur > 0.05 ? { filter: `blur(${blur.toFixed(2)}px)` } : null),
    };
    return { outer, inner, shape: c.shape };
  });
}

export function SeasonLayer({ season }: { season: Season }) {
  const field = useMemo(() => buildField(season), [season]);

  return (
    <div className={`season-layer season-${season}`} aria-hidden>
      <div className="season-veil" />
      {field.map((p, i) =>
        p.outer.display === 'contents' ? (
          <span key={i} className={`firefly ${p.shape}`} style={p.inner} />
        ) : (
          <span key={i} className="p" style={p.outer}>
            <span className={`p-fall ${p.shape}`} style={p.inner} />
          </span>
        ),
      )}
    </div>
  );
}
