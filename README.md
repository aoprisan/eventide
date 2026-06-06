# Eventide

*Practices for the turning of the day.*

A calm, private, local-first PWA for winding down at the close of the day — built as
**one session engine** with content modules layered on top, per
[`Eventide_Design_Doc.md`](./Eventide_Design_Doc.md).

## What's here (MVP — design doc §10, v1)

- **`@eventide/engine`** — the reusable, branding-free session engine: timer/pacer with
  smooth breath curves, Web Audio (synthesized tone cues + ambient mixer + optional spoken
  cues), screen wake-lock, haptics, reduced-motion handling, an **append-only IndexedDB
  session store**, and **insights derived entirely from `sessions[]`**.
- **`@eventide/app`** — the React PWA shell: **Breath**, **Candle**, and **Meditation**
  modules, the hands-free **"Tonight"** ritual chain (default + custom, with carried audio
  and dim-to-sleep), basic insights, full JSON export/import, and an installable,
  offline-capable PWA.

Craving rescue, dream journal, repetition, and the optional BYO-agent AI layer are later
phases (v2/v3) and are intentionally not built yet.

## Layout

```
packages/engine/   @eventide/engine — framework-agnostic core (no React, no branding)
apps/eventide/     @eventide/app    — the React + Vite PWA
scripts/           one-off tooling (PWA icon generation)
```

## Commands

```bash
npm install            # install all workspaces
npm run icons          # (re)generate PWA PNG icons from the SVG mark
npm run dev            # dev server (Vite) for the app
npm run typecheck      # tsc -b across the workspace
npm run build          # build engine + app (PWA, offline)
npm run preview        # serve the production build locally
```

## Architecture notes

The one idea that governs everything: every practice is the *same primitive* — a guided
session described by a `SessionSpec` and producing a `SessionResult` (engine §5). Timing,
audio, and storage live in the engine so all modules feel like one app. Before adding
behavior to a module, check whether it belongs in the shared engine instead.

The engine is published with its `exports` pointing at TypeScript source so the app's
bundler compiles it directly during dev; `npm run build` also emits declarations via
project references. It carries no Eventide-specific content, so other niche apps can embed
it without inheriting the brand.
