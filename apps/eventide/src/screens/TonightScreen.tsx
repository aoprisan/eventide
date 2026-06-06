import { useState } from 'react';
import { useNav } from '../nav.js';
import { useEngine } from '../engine/EngineContext.js';
import { DEFAULT_RITUAL, MODULES, formatDuration } from '../modules.js';
import { Icon, TopBar } from '../components/ui.js';
import type { ModuleId, Ritual, RitualStep } from '@eventide/engine';

const BUILDABLE: ModuleId[] = ['candle', 'breath', 'meditation'];

function stepLabel(step: RitualStep): string {
  const name = MODULES[step.module as 'breath' | 'candle' | 'meditation']?.name ?? step.module;
  return `${name} · ${formatDuration(step.amount)}`;
}

export function TonightScreen() {
  const nav = useNav();
  const { rituals, setRituals, unlockAudio } = useEngine();
  const [building, setBuilding] = useState(false);

  async function begin(ritual: Ritual) {
    // Unlock audio inside the tap so the chain's ambient bed can start.
    await unlockAudio();
    nav.push({ name: 'tonight-run', ritual });
  }

  const all: Ritual[] = [DEFAULT_RITUAL, ...rituals];

  function remove(id: string) {
    setRituals(rituals.filter((r) => r.id !== id));
  }

  return (
    <div className="shell view-enter">
      <TopBar />
      <header className="col" style={{ marginBottom: 24 }}>
        <span className="eyebrow">Tonight</span>
        <h1 className="display">Your rituals</h1>
        <p className="muted" style={{ marginTop: 10 }}>
          A chain runs hands-free — each practice flows into the next, and the screen
          softens toward sleep.
        </p>
      </header>

      <div className="col gap stagger">
        {all.map((ritual) => (
          <div key={ritual.id} className="card" style={{ padding: 22 }}>
            <div className="row between" style={{ marginBottom: 14 }}>
              <h2 style={{ fontSize: '1.5rem' }}>{ritual.name}</h2>
              {ritual.id !== 'default' && (
                <button className="icon-btn" aria-label="Delete" onClick={() => remove(ritual.id)}>
                  <Icon name="trash" size={18} />
                </button>
              )}
            </div>
            <div className="step-chips" style={{ marginBottom: 18 }}>
              {ritual.steps.map((s, i) => (
                <span key={i} className="chip">
                  {stepLabel(s)}
                </span>
              ))}
            </div>
            <button className="btn btn-primary btn-block" onClick={() => void begin(ritual)}>
              <Icon name="play" size={18} /> Begin
            </button>
          </div>
        ))}
      </div>

      {building ? (
        <Builder
          onCancel={() => setBuilding(false)}
          onSave={(r) => {
            setRituals([...rituals, r]);
            setBuilding(false);
          }}
        />
      ) : (
        <button
          className="btn btn-ghost btn-block"
          style={{ marginTop: 18 }}
          onClick={() => setBuilding(true)}
        >
          <Icon name="plus" size={18} /> Build your own
        </button>
      )}
    </div>
  );
}

function Builder({
  onCancel,
  onSave,
}: {
  onCancel: () => void;
  onSave: (ritual: Ritual) => void;
}) {
  const [name, setName] = useState('My ritual');
  const [steps, setSteps] = useState<RitualStep[]>([{ module: 'breath', amount: 300 }]);

  function addStep() {
    setSteps((s) => [...s, { module: 'candle', amount: 120 }]);
  }
  function update(i: number, patch: Partial<RitualStep>) {
    setSteps((s) => s.map((st, idx) => (idx === i ? { ...st, ...patch } : st)));
  }
  function removeStep(i: number) {
    setSteps((s) => s.filter((_, idx) => idx !== i));
  }

  return (
    <div className="card view-enter" style={{ padding: 22, marginTop: 18 }}>
      <span className="eyebrow">New ritual</span>
      <input
        type="text"
        value={name}
        maxLength={40}
        onChange={(e) => setName(e.target.value)}
        style={{ marginTop: 12, marginBottom: 18 }}
      />
      <div className="col gap-sm">
        {steps.map((step, i) => (
          <div key={i} className="row gap-sm">
            <select
              className="builder-select"
              value={step.module}
              onChange={(e) => update(i, { module: e.target.value as ModuleId })}
            >
              {BUILDABLE.map((m) => (
                <option key={m} value={m}>
                  {MODULES[m as 'breath' | 'candle' | 'meditation'].name}
                </option>
              ))}
            </select>
            <select
              className="builder-select"
              value={step.amount}
              onChange={(e) => update(i, { amount: Number(e.target.value) })}
            >
              {[60, 120, 180, 300, 600].map((d) => (
                <option key={d} value={d}>
                  {formatDuration(d)}
                </option>
              ))}
            </select>
            {steps.length > 1 && (
              <button className="icon-btn" aria-label="Remove step" onClick={() => removeStep(i)}>
                <Icon name="close" size={18} />
              </button>
            )}
          </div>
        ))}
      </div>
      <button className="btn btn-ghost btn-block" style={{ marginTop: 14 }} onClick={addStep}>
        <Icon name="plus" size={18} /> Add a step
      </button>
      <div className="row gap-sm" style={{ marginTop: 16 }}>
        <button className="btn btn-ghost grow" onClick={onCancel}>
          Cancel
        </button>
        <button
          className="btn btn-primary grow"
          onClick={() =>
            onSave({
              id: `ritual-${Date.now()}`,
              name: name.trim() || 'My ritual',
              steps,
              dimToSleep: true,
            })
          }
        >
          Save
        </button>
      </div>
    </div>
  );
}
