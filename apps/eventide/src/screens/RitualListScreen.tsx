import { useState } from 'react';
import { useNav } from '../nav.js';
import { useEngine } from '../engine/EngineContext.js';
import { FLOWS, MODULES, formatDuration, ritualsForKind } from '../modules.js';
import { Icon, TopBar } from '../components/ui.js';
import type { ModuleId, Ritual, RitualKind, RitualStep } from '@eventide/engine';

const BUILDABLE: ModuleId[] = ['candle', 'breath', 'meditation'];

function stepLabel(step: RitualStep): string {
  const name = MODULES[step.module as 'breath' | 'candle' | 'meditation']?.name ?? step.module;
  return `${name} · ${formatDuration(step.amount)}`;
}

/**
 * The list of saved chains for one end of the day. Morning and evening render
 * the same screen — only the copy and the flow's `kind` differ (see FLOWS).
 */
export function RitualListScreen({ kind }: { kind: RitualKind }) {
  const nav = useNav();
  const { rituals, setRituals, unlockAudio } = useEngine();
  const [building, setBuilding] = useState(false);
  const flow = FLOWS[kind];

  async function begin(ritual: Ritual) {
    // Unlock audio inside the tap so the chain's ambient bed can start.
    await unlockAudio();
    nav.push({ name: 'ritual-run', ritual });
  }

  const all = ritualsForKind(kind, rituals);

  function remove(id: string) {
    setRituals(rituals.filter((r) => r.id !== id));
  }

  return (
    <div className="shell view-enter">
      <TopBar />
      <header className="col" style={{ marginBottom: 24 }}>
        <span className="eyebrow">{flow.heroEyebrow}</span>
        <h1 className="display">{flow.listTitle}</h1>
        <p className="muted" style={{ marginTop: 10 }}>
          {flow.listIntro}
        </p>
      </header>

      <div className="col gap stagger">
        {all.map((ritual) => (
          <div key={ritual.id} className="card" style={{ padding: 22 }}>
            <div className="row between" style={{ marginBottom: 14 }}>
              <h2 style={{ fontSize: '1.5rem' }}>{ritual.name}</h2>
              {ritual.id !== flow.defaultRitual.id && (
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
          kind={kind}
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
  kind,
  onCancel,
  onSave,
}: {
  kind: RitualKind;
  onCancel: () => void;
  onSave: (ritual: Ritual) => void;
}) {
  const flow = FLOWS[kind];
  const [name, setName] = useState(flow.builderName);
  const [steps, setSteps] = useState<RitualStep[]>([{ ...flow.builderSeed }]);

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
              name: name.trim() || flow.builderName,
              kind,
              steps,
              dimToSleep: kind === 'evening',
            })
          }
        >
          Save
        </button>
      </div>
    </div>
  );
}
