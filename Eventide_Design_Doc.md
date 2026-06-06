# Eventide — Design Document

*One calm app for the close of the day — and for the moments you don't trust yourself.*

**Tagline:** Practices for the turning of the day.

---

## 1. The core idea

Eventide unifies six things that look like separate apps but are, under the hood, the
same thing: **meditation, breathing, candle-watching, a dream journal, craving rescue,
contemplative repetition (prayer/mantra), and a chained nighttime ritual.**

Every one of these is the same primitive wearing a different costume — a **guided
session**:

> set an intention → run a timed, sensory-guided practice (breath pacer, animation,
> audio cues, wake-lock, haptics) → log the outcome → see patterns over time.

So Eventide is not five apps glued together. It is **one session engine** with a set of
**content modules** layered on top. Build the engine once; everything else is parameters
and copy.

Two reinforcing use-moments:

- **The evening** — a deliberate wind-down ("Tonight") that chains modules into a calm
  sequence before sleep, with a dream journal waiting in the morning.
- **The hard moment** — an always-one-tap rescue for a craving or a spike of agitation,
  inherited directly from Tide's "ride the wave."

The whole product is organized around one promise: *when the day is ending — or when you
need to steady yourself — open this and it will hold your attention for a few minutes.*

---

## 2. Name & positioning

**Eventide.** The close of day; also carries *tide*, making it a sibling to the existing
**Tide** craving app — a product family, with the urge-surfing engine flowing straight in.
Calm, evocative, and deliberately denomination-neutral.

Positioning: a **secular-but-soulful evening & self-regulation companion**. It sits at the
intersection of the sleep/wind-down category (Calm, Insight Timer) and the
craving/behavior-change category (Reframe, Sunnyside) — but local-first, private, and
without the subscription-wall hostility those apps are known for.

**What stays out of scope (deliberately):** the occult/esoteric apps (Drakonian's
Draconian/Qliphothic grimoire, the Santa Muerte app) are a distinct niche with their own
aesthetic and audience. They can *consume the same engine library*, but they ship as their
own products. Mixing Orthodox prayer and Qliphothic ritual in one app would alienate both
audiences and muddy the brand. Eventide stays neutral; the niche apps stay niche.

---

## 3. Who it's for

People who want a quiet, private, no-account place to **come down at the end of the day**
or **steady themselves in a hard moment**. They may be:

- winding down for sleep and wanting a small ritual instead of doomscrolling;
- working on a habit (overeating, alcohol, smoking/vaping) and needing in-the-moment help;
- keeping a dream journal or a contemplative practice;
- spiritual, secular, or somewhere in between — the app never assumes a tradition.

They value privacy, calm, and instant availability over social features and gamification.

---

## 4. Design principles

1. **One engine, many practices.** Consistency of *feel* across modules is the product.
   A breath session, a candle gaze, and a craving rescue should feel like one app.
2. **Calm is the product.** Slow motion, soft type, gentle haptics, dim palettes. The UI
   is a counterweight to agitation and a runway into sleep.
3. **One thumb, no wall.** The rescue button and "Tonight" are reachable on the first
   screen. No login, no account, no setup gate.
4. **Local-first and private.** All data on-device (IndexedDB + localStorage). No servers,
   no analytics, no accounts. Export is yours. (Inherited from all five source apps.)
5. **Logging is a side effect, never a chore.** Insights and streaks are *computed* from
   sessions you actually did — the Tide model.
6. **Neutral by default, personal by choice.** Spiritual content (prayer/mantra, lunar
   timing) is opt-in and tradition-agnostic; nothing is foregrounded that assumes belief.
7. **Earned, not nagged.** Reminders cluster around the user's own evening window and known
   risk hours, not generic daily pings.

---

## 5. The session engine (the heart)

A single reusable module that every practice is built on. Anatomy of a session:

```
SessionSpec {
  id, module                      // 'breath' | 'candle' | 'meditation' | 'dream'
                                  //   | 'craving' | 'repetition' | 'ritual'
  intention?: string              // optional one-line "why" / what you're feeling
  duration | reps | open-ended    // how the session ends
  pacing?: BreathPattern          // inhale/hold/exhale/hold, or a custom ratio
  guide: 'orb' | 'wave' | 'flame' | 'bead' | 'silent'   // the visual
  audio?: { tones, ambient, spoken }                    // Web Audio cues + mixer
  haptics?: pattern
  wakeLock: true                  // screen stays on during practice
  onComplete: (SessionResult)     // -> log + insights
}

SessionResult {
  module, startedAt, durationActual,
  intensityBefore?, intensityAfter?,   // craving / mood (1–10)
  outcome?: 'rode-it-out' | 'partial' | 'gave-in' | 'completed',
  note?, trigger?, location?, emotion?, // craving + journal fields
  dream?: { text, tags, aiInterpretation? }
}
```

Shared services the engine owns (each exists today in at least one source app; consolidate
to one implementation):

- **Timer / pacer** with smooth breath curves (4-7-8, box, coherent, nadi shodhana, custom).
- **Audio**: Web Audio tone cues (rising/steady/falling), an ambient mixer, optional spoken
  cues, AudioContext unlock + iOS silent-switch hint.
- **Wake-lock**, **haptics**, **reduced-motion** honoring.
- **Store**: append-only `sessions[]`; all stats derived from it.
- **AI layer (optional, BYO-agent)**: dream interpretation / reflection prompts on a
  bring-your-own-key/agent model, never required, never default-on.

---

## 6. Modules (content packs on the engine)

| Module | What it is | Key params | Visual | Reuse from |
|---|---|---|---|---|
| **Breath** | Paced breathing; presets + custom ratio builder | pattern, duration | orb / wave | aethenor (best version) |
| **Meditation** | Silent or ambient timed sit | duration, ambient mix | silent | rosary `useAmbientMixer` + aethenor |
| **Candle** | Trāṭaka fixed-gaze; flickering flame that snuffs at the end | duration | flame | aethenor |
| **Dream journal** | Morning capture; timestamp, tags, optional AI interpretation | text, tags | — | aethenor `dreamPrompt` + drakonian `journal` |
| **Craving rescue** | "Ride the wave" urge surfing; the in-moment hard-moment flow | habit, intensity, 4-Ds | wave | tide (whole flow) |
| **Repetition** | Tradition-neutral counted contemplation (Jesus Prayer, a mantra, an affirmation, or silence) | text, bead count | bead ring | rosary |
| **Ritual ("Tonight")** | Chains the above into a wind-down sequence | ordered module list | sequence | new thin layer; drakonian ritual model is the pattern |

Notes:

- **Repetition** is the neutral home for "praying." The user picks their own words (or none).
  It ships with a few presets across traditions plus secular affirmations; no tradition is
  privileged or assumed. Bead-counting, haptic-on-bead, and trace-the-ring interaction come
  straight from rosary.
- **Craving rescue** is the only module that's also a top-level button (not just part of an
  evening flow), because its whole value is being one tap away mid-urge.

---

## 7. "Tonight" — the ritual chain

The signature evening experience. The user assembles (or accepts a default) sequence, e.g.:

```
Candle gaze (2 min) → Coherent breathing (5 min) → Repetition / mantra (3 min)
  → Set tomorrow's intention (1 line) → Dim to sleep
```

The chain runs hands-free: each module flows into the next with a soft transition, audio
cues carry between them, and the screen darkens toward the end. A saved chain becomes
"your ritual," runnable in one tap. This is the piece none of the five apps has today — it's
the thin orchestration layer that makes the whole thing feel like *one* practice rather than
a menu of tools.

In the morning, a gentle prompt opens the **Dream journal** for capture.

---

## 8. Insights & data model

All insights computed from `sessions[]` (the Tide principle — no separate logging chore):

- **Practice streak** and total sessions / minutes.
- **Craving win-rate over time** (% ridden out, trending), urge **heatmap** by hour/day,
  **triggers** (stress, boredom, social, after meals, places), and **what helped** (which
  4-Ds correlated with riding it out).
- **Sleep-adjacent patterns**: which rituals preceded better-rated mornings.
- **Dream tags** over time.

Data model: single local store, append-only `sessions[]` + small `prefs` and `rituals`
objects. No server. Full JSON export/import. (Mirrors Tide's `tide.state.v1` and aethenor's
repo pattern, unified.)

---

## 9. Architecture & tech

Standardize on the strongest stack already in the portfolio:

- **React 18 + TypeScript + Vite**, **vite-plugin-pwa** (Workbox) — installable, offline,
  auto-updating. (rosary / health / aethenor stack.)
- **Local-first storage**: IndexedDB (sessions, dreams) + localStorage (prefs). No backend,
  no accounts, no analytics.
- **Engine as an internal package** (`@eventide/engine`) — timer, pacer, audio, wake-lock,
  haptics, store. Importable by Eventide *and* by the niche apps (Drakonian etc.), so the
  occult products share the same battle-tested core without merging their content.
- **Optional AI**: bring-your-own-agent for dream interpretation / reflection. Keys stay
  on-device; feature is off by default.
- Deploy as a PWA to GitHub Pages; optional Capacitor wrap for App Store / Play (athos, sm,
  psi-website already prove the Capacitor path in this portfolio).

Migration strategy: lift aethenor's breath + candle, tide's wave + insight engine, rosary's
bead + ambient mixer, and the two journal implementations into the shared engine; rebuild
the UI shell once around the "Tonight" chain.

---

## 10. MVP scope (and phases)

**MVP (v1) — the wind-down core**
- Session engine (timer, pacer, audio, wake-lock, haptics, store).
- Three modules: **Breath**, **Candle**, **Meditation**.
- **"Tonight"** chain (default + one custom).
- Basic insights (streak, minutes) + local export.
- Installable PWA, offline.

**v2 — the two anchors**
- **Craving rescue** (full Tide flow) as a top-level button + its insights.
- **Dream journal** (morning capture, tags).

**v3 — depth & personalization**
- **Repetition** module (neutral prayer/mantra) with presets.
- Optional AI dream/reflection layer (BYO-agent).
- Optional lunar/evening-window timing for reminders (from aethenor).
- Capacitor native builds.

**Later / separate track**
- Engine extraction into `@eventide/engine`; refactor Drakonian (and other niche apps) onto
  it. Eventide stays neutral; niche apps stay separate products on a shared core.

---

## 11. Monetization

Fits the strongest categories in the portfolio review: sleep/wind-down + craving change are
both proven subscription markets, and the unified app is a far stronger position than seven
scattered PWAs.

- **Free, generous tier**: the full session engine, Breath/Candle/Meditation, one saved
  ritual, local data. (Removes the "subscription-wall hostility" of incumbents.)
- **Eventide Plus (subscription)**: unlimited custom rituals, full craving insights/heatmaps,
  dream journal with AI interpretation, ambient sound packs, lunar/timing, cross-device
  encrypted export. ~$4–6/mo or a lifetime unlock.
- **Distribution**: PWA + App Store/Play via Capacitor; the craving-rescue use-case is a
  strong, searchable hook ("quit smoking / urge surfing") that pulls installs which then
  discover the wind-down product.

---

## 12. Open questions

1. **Prayer scope** — current call: include as a *tradition-neutral* "Repetition" module,
   opt-in, no tradition privileged. (Revisit if it muddies the secular positioning.)
2. **How much of Tide to absorb vs. keep Tide live** — Eventide could supersede Tide, or
   Tide stays a focused standalone and Eventide cross-links to it. Family branding supports
   either.
3. **AI layer** — keep strictly BYO-agent (privacy, zero cost) or offer a hosted option for
   non-technical users (adds backend + cost, breaks the no-server purity).
4. **Aesthetic** — Tide's deep blues/teals and "calm wave" language is the natural base; the
   candle/dream/ritual modules need a complementary night palette without going occult.
```
