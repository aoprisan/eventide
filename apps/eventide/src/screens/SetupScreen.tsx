import { useState } from 'react';
import { useNav } from '../nav.js';
import { useEngine } from '../engine/EngineContext.js';
import { AMBIENTS, BREATH_PATTERNS, MODULES, formatDuration } from '../modules.js';
import { Segmented, TopBar } from '../components/ui.js';
import type { AmbientId, SessionSpec } from '@eventide/engine';

export function SetupScreen({ module }: { module: 'breath' | 'candle' | 'meditation' }) {
  const info = MODULES[module];
  const nav = useNav();
  const { unlockAudio } = useEngine();

  const [duration, setDuration] = useState(info.defaultDuration);
  const [patternId, setPatternId] = useState(BREATH_PATTERNS[0].id);
  const [ambient, setAmbient] = useState<AmbientId | null>(info.defaultAmbient);
  const [intention, setIntention] = useState('');

  async function begin() {
    // Unlock audio inside this tap so it's ready before the session starts.
    await unlockAudio();
    const pacing = info.paced ? BREATH_PATTERNS.find((p) => p.id === patternId) : undefined;
    const spec: SessionSpec = {
      id: `${module}-${Date.now()}`,
      module,
      guide: info.guide,
      end: { kind: 'duration', seconds: duration },
      wakeLock: true,
      audio: { tones: info.paced, ambient, spoken: false },
      ...(pacing ? { pacing } : {}),
      ...(intention.trim() ? { intention: intention.trim() } : {}),
    };
    nav.push({ name: 'session', spec, title: info.name });
  }

  return (
    <div className="shell view-enter">
      <TopBar />
      <header className="col" style={{ marginBottom: 30 }}>
        <span className="overline overline-hour">{info.name}</span>
        <h1 className="setup-title">{info.tagline}</h1>
      </header>

      <div className="col" style={{ gap: 28 }}>
        <Segmented
          label="How long"
          value={duration}
          onChange={setDuration}
          options={info.durations.map((d) => ({ value: d, label: formatDuration(d) }))}
        />

        {info.paced && (
          <Segmented
            label="Rhythm"
            value={patternId}
            onChange={setPatternId}
            options={BREATH_PATTERNS.map((p) => ({ value: p.id, label: p.label }))}
          />
        )}

        <Segmented
          label="Sound"
          value={ambient}
          onChange={setAmbient}
          options={AMBIENTS.map((a) => ({ value: a.id, label: a.label }))}
        />

        <div className="col gap-sm">
          <div className="rule-head">
            <span className="overline">Intention — optional</span>
          </div>
          <input
            type="text"
            placeholder="What are you here for tonight?"
            value={intention}
            maxLength={120}
            onChange={(e) => setIntention(e.target.value)}
          />
        </div>
      </div>

      <div className="grow" />
      <button className="btn btn-primary btn-block" style={{ marginTop: 30 }} onClick={begin}>
        Begin
      </button>
    </div>
  );
}
