import { useEffect } from 'react';

/**
 * The hour's light, as one abstract horizon low on the page.
 *
 * Vesper draws no literal sky — no stars, moon, or weather. The whole sense
 * of time lives in a single band of light: violet in deep night, rose at
 * first light, pale straw through the day, ember at dusk. This hook lerps
 * between hour keyframes and writes the result to CSS custom properties;
 * the registered @property transitions turn each minute tick into a slow
 * drift of light rather than a cut.
 */

type Rgba = [number, number, number, number];
type Rgb = [number, number, number];

interface HourKey {
  /** Hour of day, fractional, ascending. */
  h: number;
  /** Bright heart of the horizon. */
  core: Rgba;
  /** Wide outer wash. */
  haze: Rgba;
  /** The hour lifted to a text-usable tone (the greeting wears it). */
  accent: Rgb;
  /** Overall presence of the horizon, 0–1. */
  strength: number;
}

const KEYS: HourKey[] = [
  { h: 0, core: [122, 110, 162, 0.3], haze: [64, 66, 104, 0.16], accent: [152, 146, 198], strength: 0.85 },
  { h: 4, core: [110, 106, 158, 0.28], haze: [58, 62, 100, 0.15], accent: [146, 144, 196], strength: 0.85 },
  { h: 5.5, core: [226, 148, 122, 0.3], haze: [142, 106, 136, 0.18], accent: [216, 150, 132], strength: 0.9 },
  { h: 7.5, core: [242, 188, 122, 0.34], haze: [176, 138, 108, 0.16], accent: [224, 176, 122], strength: 0.9 },
  { h: 10, core: [238, 218, 170, 0.2], haze: [158, 148, 128, 0.1], accent: [198, 184, 150], strength: 0.62 },
  { h: 15, core: [238, 214, 162, 0.22], haze: [158, 146, 124, 0.11], accent: [202, 184, 146], strength: 0.65 },
  { h: 17.5, core: [240, 160, 92, 0.36], haze: [168, 110, 90, 0.2], accent: [234, 162, 106], strength: 0.95 },
  { h: 19.5, core: [226, 122, 80, 0.4], haze: [138, 90, 118, 0.22], accent: [233, 142, 94], strength: 1 },
  { h: 21, core: [180, 112, 122, 0.34], haze: [100, 84, 130, 0.2], accent: [198, 140, 142], strength: 0.92 },
  { h: 22.5, core: [130, 112, 158, 0.3], haze: [68, 68, 106, 0.17], accent: [158, 148, 198], strength: 0.86 },
];

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function sample(hour: number): { core: Rgba; haze: Rgba; accent: Rgb; strength: number } {
  // Find the bracketing keyframes, wrapping midnight.
  let prev = KEYS[KEYS.length - 1];
  let next = KEYS[0];
  let span = 24 - prev.h + next.h;
  let t = hour >= prev.h ? (hour - prev.h) / span : (hour + 24 - prev.h) / span;
  for (let i = 0; i < KEYS.length - 1; i++) {
    if (hour >= KEYS[i].h && hour < KEYS[i + 1].h) {
      prev = KEYS[i];
      next = KEYS[i + 1];
      span = next.h - prev.h;
      t = (hour - prev.h) / span;
      break;
    }
  }
  const mix4 = (a: Rgba, b: Rgba): Rgba => [
    Math.round(lerp(a[0], b[0], t)),
    Math.round(lerp(a[1], b[1], t)),
    Math.round(lerp(a[2], b[2], t)),
    Number(lerp(a[3], b[3], t).toFixed(3)),
  ];
  const mix3 = (a: Rgb, b: Rgb): Rgb => [
    Math.round(lerp(a[0], b[0], t)),
    Math.round(lerp(a[1], b[1], t)),
    Math.round(lerp(a[2], b[2], t)),
  ];
  return {
    core: mix4(prev.core, next.core),
    haze: mix4(prev.haze, next.haze),
    accent: mix3(prev.accent, next.accent),
    strength: Number(lerp(prev.strength, next.strength, t).toFixed(3)),
  };
}

function apply() {
  const now = new Date();
  const hour = now.getHours() + now.getMinutes() / 60;
  const { core, haze, accent, strength } = sample(hour);
  const root = document.documentElement.style;
  root.setProperty('--horizon-core', `rgba(${core[0]}, ${core[1]}, ${core[2]}, ${core[3]})`);
  root.setProperty('--horizon-haze', `rgba(${haze[0]}, ${haze[1]}, ${haze[2]}, ${haze[3]})`);
  root.setProperty('--hour-accent', `rgb(${accent[0]}, ${accent[1]}, ${accent[2]})`);
  root.setProperty('--horizon-strength', String(strength));
}

/** Keeps the page's horizon light in step with the real clock. */
export function useHorizon(): void {
  useEffect(() => {
    apply();
    const t = setInterval(apply, 60_000);
    return () => clearInterval(t);
  }, []);
}
