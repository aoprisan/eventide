// Rasterize the Eventide mark to the PNG sizes the PWA manifest references.
// Run once after install: `node scripts/gen-icons.mjs`.
//
// The mark is the Vesper emblem: the evening star as an ember disc over a
// hairline horizon, its reflection beneath — warm ink, no literal sky.
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import sharp from 'sharp';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(here, '../apps/eventide/public');

const defs = `
  <defs>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#e98e5e" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="#e98e5e" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="star" cx="42%" cy="38%" r="70%">
      <stop offset="0%" stop-color="#ffd9b0"/>
      <stop offset="55%" stop-color="#e98e5e"/>
      <stop offset="100%" stop-color="#b9602f"/>
    </radialGradient>
    <linearGradient id="refl" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#e98e5e" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="#e98e5e" stop-opacity="0"/>
    </linearGradient>
  </defs>`;

// `inset` controls the safe padding for maskable icons.
function markSvg(size, { rounded, inset }) {
  const s = size;
  const scale = 1 - inset * 2;
  const tx = s * inset;
  const rect = rounded
    ? `<rect width="${s}" height="${s}" rx="${s * 0.22}" fill="#0d0b09"/>`
    : `<rect width="${s}" height="${s}" fill="#0d0b09"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
    ${defs}
    ${rect}
    <g transform="translate(${tx} ${tx}) scale(${scale})">
      <circle cx="${s * 0.5}" cy="${s * 0.45}" r="${s * 0.35}" fill="url(#glow)"/>
      <circle cx="${s * 0.5}" cy="${s * 0.45}" r="${s * 0.15}" fill="url(#star)"/>
      <path d="M ${s * 0.14} ${s * 0.69} h ${s * 0.72}"
            stroke="#ede5d8" stroke-opacity="0.4"
            stroke-width="${s * 0.025}" stroke-linecap="round"/>
      <rect x="${s * 0.46}" y="${s * 0.72}" width="${s * 0.08}" height="${s * 0.17}"
            rx="${s * 0.04}" fill="url(#refl)"/>
    </g>
  </svg>`;
}

async function render(name, size, opts) {
  const svg = Buffer.from(markSvg(size, opts));
  const png = await sharp(svg).png().toBuffer();
  await writeFile(resolve(outDir, name), png);
  console.log('wrote', name);
}

await render('icon-192.png', 192, { rounded: true, inset: 0 });
await render('icon-512.png', 512, { rounded: true, inset: 0 });
await render('icon-512-maskable.png', 512, { rounded: false, inset: 0.16 });
await render('apple-touch-icon.png', 180, { rounded: false, inset: 0 });
