// Rasterize the Eventide mark to the PNG sizes the PWA manifest references.
// Run once after install: `node scripts/gen-icons.mjs`.
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import sharp from 'sharp';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(here, '../apps/eventide/public');

const sky = `
  <defs>
    <radialGradient id="sky" cx="35%" cy="25%" r="95%">
      <stop offset="0%" stop-color="#1a2440"/>
      <stop offset="60%" stop-color="#0a1020"/>
      <stop offset="100%" stop-color="#05070f"/>
    </radialGradient>
    <linearGradient id="moon" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f6d9a6"/>
      <stop offset="100%" stop-color="#d79a55"/>
    </linearGradient>
    <radialGradient id="glow" cx="62%" cy="36%" r="40%">
      <stop offset="0%" stop-color="#ecbd7e" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="#ecbd7e" stop-opacity="0"/>
    </radialGradient>
  </defs>`;

// `inset` controls the safe padding for maskable icons.
function markSvg(size, { rounded, inset }) {
  const s = size;
  const scale = (1 - inset * 2);
  const tx = s * inset;
  const rect = rounded
    ? `<rect width="${s}" height="${s}" rx="${s * 0.22}" fill="url(#sky)"/>`
    : `<rect width="${s}" height="${s}" fill="url(#sky)"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
    ${sky}
    ${rect}
    <g transform="translate(${tx} ${tx}) scale(${scale})">
      <circle cx="${s * 0.6}" cy="${s * 0.42}" r="${s * 0.34}" fill="url(#glow)"/>
      <path d="M ${s * 0.66} ${s * 0.16}
               a ${s * 0.26} ${s * 0.26} 0 1 0 ${s * 0.13} ${s * 0.47}
               a ${s * 0.32} ${s * 0.32} 0 0 1 ${-s * 0.13} ${-s * 0.62} z"
            fill="url(#moon)"/>
      <path d="M ${s * 0.1} ${s * 0.76}
               c ${s * 0.1} 0 ${s * 0.1} ${-s * 0.06} ${s * 0.2} ${-s * 0.06}
               s ${s * 0.1} ${s * 0.06} ${s * 0.2} ${s * 0.06}
               s ${s * 0.1} ${-s * 0.06} ${s * 0.2} ${-s * 0.06}
               s ${s * 0.1} ${s * 0.06} ${s * 0.2} ${s * 0.06}"
            fill="none" stroke="#79d6cd" stroke-width="${s * 0.035}"
            stroke-linecap="round" opacity="0.85"/>
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
