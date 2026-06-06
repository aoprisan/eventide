# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Status

This repository currently contains only `Eventide_Design_Doc.md` — there is no code yet. The design doc is the source of truth for what to build. When implementing, follow the stack and architecture it specifies (Section 9) rather than introducing alternatives. There is no build/test/lint tooling yet; scaffold it per the decisions below when starting implementation.

## The one architectural idea that governs everything

Eventide is **one session engine with content modules layered on top** — not several features glued together. The seven practices (breath, candle, meditation, dream journal, craving rescue, repetition/mantra, and the "Tonight" ritual chain) are all the *same primitive*: a guided session that runs

> set intention → run a timed, sensory-guided practice → log a result → derive insights.

Before adding behavior to any single module, check whether it belongs in the shared engine instead. Consistency of *feel* across modules is the product; divergent per-module implementations of timing, audio, or storage are the main thing to avoid.

The two core data shapes are `SessionSpec` (input: module, intention, duration/reps, pacing, guide visual, audio, haptics, wakeLock) and `SessionResult` (output: timing, before/after intensity, outcome, notes, dream fields). These are defined in Section 5 of the design doc — treat them as the engine's central contract.

## Intended stack (Section 9)

- **React 18 + TypeScript + Vite**, with **vite-plugin-pwa** (Workbox) for an installable, offline, auto-updating PWA.
- **Local-first storage, no backend**: IndexedDB for `sessions[]` and dreams, localStorage for `prefs`. No servers, no accounts, no analytics.
- **Engine as an internal package** (`@eventide/engine`) owning: timer/pacer, Web Audio (tone cues + ambient mixer + optional spoken cues, with AudioContext unlock), wake-lock, haptics, reduced-motion handling, and the append-only session store. It is meant to be importable by *other* (niche) apps too, so keep it free of Eventide-specific branding/content.
- **Optional AI** is strictly bring-your-own-agent/key, kept on-device, off by default. Never make any feature depend on it.
- Deploy as PWA to GitHub Pages; optional Capacitor wrap later for App Store / Play.

## Data model invariants

- A single local store: append-only **`sessions[]`** plus small `prefs` and `rituals` objects.
- **All insights are computed/derived from `sessions[]`** — streaks, minutes, craving win-rate, urge heatmaps, dream tags. Do not maintain separate stat counters or a parallel logging path; logging is a side effect of doing a session, never its own chore.
- Full JSON export/import of the local store is a first-class feature.

## Module-specific notes that aren't obvious from code

- **Craving rescue** is the only module that is *also* a top-level one-tap button (not just part of an evening flow) — its value is being reachable mid-urge. "Tonight" is the other first-screen entry point. No login/account/setup gate precedes either.
- **Repetition** is the deliberately tradition-neutral home for "prayer/mantra": the user supplies their own words (or none), presets span traditions plus secular affirmations, and **no tradition is privileged or assumed**. Keep the brand neutral — occult/esoteric content ships as *separate* products on the shared engine, never inside Eventide.
- **"Tonight"** is a thin orchestration layer that chains modules hands-free (soft transitions, audio carried between modules, screen dimming toward the end). It is the one piece with no prior implementation to lift from.

## Build phasing (Section 10)

MVP is the wind-down core: engine + Breath/Candle/Meditation + the "Tonight" chain + basic insights + installable offline PWA. Craving rescue and dream journal come in v2; repetition, optional AI, and Capacitor builds in v3. Don't pull later-phase scope forward unless asked.
