/**
 * A living sky. The app's atmosphere tracks three real things at once:
 *
 *  - **time of day** — a continuous arc from deep night through dawn, the
 *    sunrise band, midday, the golden hour, sunset, and dusk back to night;
 *  - **the day's own sunrise/sunset** — every keyframe is anchored to them, so
 *    the long light of midsummer and the short days of winter both read true;
 *  - **the season** — a tint over the whole palette (cool in winter, fresh in
 *    spring, warm in summer, amber in autumn) plus a touch more starlight on
 *    the long winter nights.
 *
 * Privacy first (design doc §4): there is **no geolocation**. Sunrise and
 * sunset are approximated from the date at an assumed mid-northern latitude.
 * It is an *atmosphere*, not an almanac — close enough to feel right, and it
 * asks the user for nothing.
 *
 * Everything stays in a dim, legible register: the sky changes temperature and
 * where its light comes from, never brightness enough to break moonlight-white
 * type on glass. Night is the home key, and the home key is a starry sky.
 */

export type Season = 'winter' | 'spring' | 'summer' | 'autumn';

export interface SkyState {
  /** Vertical gradient stops, top → horizon. */
  top: string;
  mid: string;
  bottom: string;
  /** The sun/ambient glow, an rgba() string. */
  glow: string;
  /** Where the glow sits — it travels east→west across the day. */
  glowX: string;
  glowY: string;
  /** 0 (none) → 1 (full field), for the starfield and moon. */
  starOpacity: number;
  moonOpacity: number;
  phase: string;
  season: Season;
  /**
   * The hour's light, lifted to a legible accent — cool periwinkle at deep
   * night and midday, warm amber through the sunrise/golden/sunset bands. The
   * chrome borrows it so the *moment of day* shows in the UI, not just the sky.
   */
  accent: string;
  /** Same accent as bare `r, g, b` channels, for `rgba(var(--…), a)` use. */
  accentRgb: string;
}

const LAT_DEG = 40; // assumed mid-northern latitude — kept private, never measured
const DEG = Math.PI / 180;

function dayOfYear(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d.getTime() - start.getTime()) / 86_400_000);
}

/**
 * The season as people actually feel it — **meteorological**, by calendar
 * month: spring is Mar–May, summer Jun–Aug, autumn Sep–Nov, winter Dec–Feb.
 * (We deliberately don't use the astronomical solstice/equinox boundaries: a
 * warm day in early June should wear summer, not the spring it technically
 * still is until the 21st.) The sky's light still tracks the real solar arc via
 * {@link sunTimes}; only the seasonal *tint* keys off the month.
 */
export function seasonOf(d: Date): Season {
  const m = d.getMonth();
  if (m >= 2 && m <= 4) return 'spring';
  if (m >= 5 && m <= 7) return 'summer';
  if (m >= 8 && m <= 10) return 'autumn';
  return 'winter';
}

/**
 * Approximate local sunrise/sunset in fractional hours, from the date alone.
 * Solar declination drives the day length; the equation of time and longitude
 * are ignored (local noon ≈ 12:00) — fine for atmosphere.
 */
export function sunTimes(d: Date): { sunrise: number; sunset: number } {
  const n = dayOfYear(d);
  const decl = -23.44 * Math.cos(DEG * (360 / 365) * (n + 10)); // degrees
  const cosH = Math.max(-1, Math.min(1, -Math.tan(LAT_DEG * DEG) * Math.tan(decl * DEG)));
  const half = Math.acos(cosH) / DEG / 15; // hours from noon to sunset
  return { sunrise: 12 - half, sunset: 12 + half };
}

interface Pal {
  top: string;
  mid: string;
  bottom: string;
  glow: [number, number, number, number];
  gx: number;
  gy: number;
  star: number;
}

// Palettes are deliberately deep — even "midday" is a dim azure, so white type
// on glass stays readable. What changes is hue, where the light sits, and stars.
const NIGHT: Pal =     { top: '#05070f', mid: '#090f1e', bottom: '#0c1326', glow: [38, 50, 92, 0.3], gx: 50, gy: 118, star: 1 };
const DAWN: Pal =      { top: '#10142e', mid: '#231a3a', bottom: '#3a2842', glow: [228, 150, 120, 0.3], gx: 18, gy: 104, star: 0.5 };
const SUNRISE: Pal =   { top: '#1c2348', mid: '#492f54', bottom: '#8a5444', glow: [242, 168, 108, 0.42], gx: 18, gy: 104, star: 0.1 };
const MORNING: Pal =   { top: '#19305a', mid: '#234a6e', bottom: '#274f6c', glow: [150, 192, 222, 0.26], gx: 32, gy: -12, star: 0 };
const MIDDAY: Pal =    { top: '#1d3c66', mid: '#23527c', bottom: '#1f3e60', glow: [186, 210, 234, 0.3], gx: 50, gy: -16, star: 0 };
const AFTERNOON: Pal = { top: '#203456', mid: '#3a3a64', bottom: '#4a3f60', glow: [222, 192, 150, 0.26], gx: 72, gy: -6, star: 0 };
const GOLDEN: Pal =    { top: '#243056', mid: '#5a3d54', bottom: '#9c6040', glow: [243, 176, 104, 0.44], gx: 84, gy: 104, star: 0 };
const SUNSET: Pal =    { top: '#1b2348', mid: '#502f4d', bottom: '#8a4636', glow: [236, 120, 92, 0.42], gx: 84, gy: 106, star: 0.16 };
const DUSK: Pal =      { top: '#0e1430', mid: '#231a3e', bottom: '#2a2348', glow: [184, 110, 142, 0.26], gx: 82, gy: 106, star: 0.6 };

function keyframes(sr: number, ss: number): { t: number; pal: Pal }[] {
  const noon = (sr + ss) / 2;
  return [
    { t: 0, pal: NIGHT },
    { t: sr - 1.2, pal: NIGHT },
    { t: sr - 0.4, pal: DAWN },
    { t: sr, pal: SUNRISE },
    { t: sr + 1.3, pal: MORNING },
    { t: noon, pal: MIDDAY },
    { t: ss - 1.6, pal: AFTERNOON },
    { t: ss - 0.8, pal: GOLDEN },
    { t: ss, pal: SUNSET },
    { t: ss + 0.7, pal: DUSK },
    { t: ss + 1.7, pal: NIGHT },
    { t: 24, pal: NIGHT },
  ].sort((a, b) => a.t - b.t);
}

const SEASON_TINT: Record<Season, { rgb: [number, number, number]; w: number; starBoost: number }> = {
  winter: { rgb: [120, 150, 200], w: 0.1, starBoost: 0.12 },
  spring: { rgb: [120, 190, 180], w: 0.08, starBoost: 0 },
  summer: { rgb: [210, 170, 120], w: 0.08, starBoost: -0.05 },
  autumn: { rgb: [200, 140, 90], w: 0.1, starBoost: 0 },
};

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

function lerpHex(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const r = Math.round(lerp((pa >> 16) & 255, (pb >> 16) & 255, t));
  const g = Math.round(lerp((pa >> 8) & 255, (pb >> 8) & 255, t));
  const bl = Math.round(lerp(pa & 255, pb & 255, t));
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + bl).toString(16).slice(1);
}

function tintHex(hex: string, rgb: [number, number, number], w: number): string {
  const p = parseInt(hex.slice(1), 16);
  const r = Math.round(lerp((p >> 16) & 255, rgb[0], w));
  const g = Math.round(lerp((p >> 8) & 255, rgb[1], w));
  const b = Math.round(lerp(p & 255, rgb[2], w));
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

/**
 * The hour's glow colour, lifted to a vivid-but-soft accent: scale every
 * channel until the brightest reaches ~210, preserving the hue while pulling a
 * dim ambient light up to something type and glints can wear. Cool light stays
 * cool, warm light stays warm — the accent simply tracks the sky's temperature.
 */
function accentFromGlow(r: number, g: number, b: number): [number, number, number] {
  const peak = Math.max(r, g, b, 1);
  const k = 210 / peak;
  return [Math.round(r * k), Math.round(g * k), Math.round(b * k)];
}

function phaseName(t: number, sr: number, ss: number): string {
  if (t < sr - 0.4 || t >= ss + 1.7) return 'night';
  if (t < sr) return 'dawn';
  if (t < sr + 1.3) return 'sunrise';
  if (t < ss - 1.6) return 'day';
  if (t < ss - 0.8) return 'afternoon';
  if (t < ss) return 'golden';
  if (t < ss + 0.7) return 'sunset';
  return 'dusk';
}

/**
 * The full sky for a given moment. Pure — same instant in, same sky out.
 * Pass `seasonOverride` to pin the seasonal tint (and the graphics layer that
 * reads it) to a chosen season instead of the one derived from the date.
 */
export function skyAt(d: Date = new Date(), seasonOverride?: Season): SkyState {
  const t = d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600;
  const { sunrise: sr, sunset: ss } = sunTimes(d);
  const kf = keyframes(sr, ss);

  let i = 0;
  while (i < kf.length - 1 && t > kf[i + 1].t) i++;
  const a = kf[i];
  const b = kf[Math.min(i + 1, kf.length - 1)];
  const span = b.t - a.t || 1;
  const f = Math.max(0, Math.min(1, (t - a.t) / span));

  const pal: Pal = {
    top: lerpHex(a.pal.top, b.pal.top, f),
    mid: lerpHex(a.pal.mid, b.pal.mid, f),
    bottom: lerpHex(a.pal.bottom, b.pal.bottom, f),
    glow: [
      lerp(a.pal.glow[0], b.pal.glow[0], f),
      lerp(a.pal.glow[1], b.pal.glow[1], f),
      lerp(a.pal.glow[2], b.pal.glow[2], f),
      lerp(a.pal.glow[3], b.pal.glow[3], f),
    ],
    gx: lerp(a.pal.gx, b.pal.gx, f),
    gy: lerp(a.pal.gy, b.pal.gy, f),
    star: lerp(a.pal.star, b.pal.star, f),
  };

  const season = seasonOverride ?? seasonOf(d);
  const tint = SEASON_TINT[season];
  const star = Math.max(0, Math.min(1, pal.star + tint.starBoost * pal.star));
  const [gr, gg, gb, ga] = pal.glow;
  const [ar, ag, ab] = accentFromGlow(gr, gg, gb);

  return {
    top: tintHex(pal.top, tint.rgb, tint.w),
    mid: tintHex(pal.mid, tint.rgb, tint.w * 0.7),
    bottom: pal.bottom,
    glow: `rgba(${Math.round(gr)}, ${Math.round(gg)}, ${Math.round(gb)}, ${ga.toFixed(3)})`,
    glowX: `${pal.gx.toFixed(1)}%`,
    glowY: `${pal.gy.toFixed(1)}%`,
    starOpacity: star,
    moonOpacity: star * 0.9,
    phase: phaseName(t, sr, ss),
    season,
    accent: `rgb(${ar}, ${ag}, ${ab})`,
    accentRgb: `${ar}, ${ag}, ${ab}`,
  };
}
