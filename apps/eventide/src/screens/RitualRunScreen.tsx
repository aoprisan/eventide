import { useEffect, useMemo, useState } from 'react';
import { useNav } from '../nav.js';
import { useEngine } from '../engine/EngineContext.js';
import { BREATH_PATTERNS, FLOWS, MODULES } from '../modules.js';
import { SessionScreen } from './SessionScreen.js';
import type { Ritual, RitualKind, SessionSpec } from '@eventide/engine';

type Phase =
  | { kind: 'running'; index: number }
  | { kind: 'transition'; index: number }
  | { kind: 'done' };

function ritualKind(ritual: Ritual): RitualKind {
  return ritual.kind ?? 'evening';
}

/**
 * The thin orchestration layer (design doc §7) for both ends of the day. Runs
 * each module into the next with a soft transition, carries one continuous
 * ambient bed across the whole chain, and shifts the light toward its goal —
 * darkening toward sleep in the evening, lifting toward the day in the morning.
 */
export function RitualRunScreen({ ritual }: { ritual: Ritual }) {
  const nav = useNav();
  const { audio, saveSession, unlockAudio } = useEngine();
  const [phase, setPhase] = useState<Phase>({ kind: 'running', index: 0 });
  const kind = ritualKind(ritual);
  const flow = FLOWS[kind];
  const morning = kind === 'morning';

  // One continuous ambient bed for the entire ritual.
  useEffect(() => {
    let active = true;
    void unlockAudio().then(() => {
      if (active) audio.setAmbient(flow.ambient);
    });
    return () => {
      active = false;
      audio.stopAmbient();
    };
  }, [audio, unlockAudio, flow.ambient]);

  const total = ritual.steps.length;
  const activeIndex = phase.kind === 'done' ? total : phase.index;
  // How far through the chain we are, for the veil. Evening deepens to black
  // toward sleep; morning warms gently as the light comes up, then clears.
  const progress = activeIndex / total;
  const veilOpacity = morning
    ? phase.kind === 'done'
      ? 0
      : Math.min(0.5, progress * 0.5)
    : ritual.dimToSleep
      ? phase.kind === 'done'
        ? 0.92
        : Math.min(0.82, progress * 0.82)
      : 0;

  const spec = useMemo<SessionSpec | null>(() => {
    if (phase.kind !== 'running') return null;
    return buildSpec(ritual, phase.index);
  }, [ritual, phase]);

  function handleDone(index: number) {
    if (index + 1 >= total) {
      setPhase({ kind: 'done' });
    } else {
      setPhase({ kind: 'transition', index });
    }
  }

  // Soft pause between steps, then mount the next one.
  useEffect(() => {
    if (phase.kind !== 'transition') return;
    const t = setTimeout(() => setPhase({ kind: 'running', index: phase.index + 1 }), 2600);
    return () => clearTimeout(t);
  }, [phase]);

  return (
    <>
      <div className={morning ? 'wake-veil' : 'dim-veil'} style={{ opacity: veilOpacity }} />

      {phase.kind === 'running' && spec && (
        <SessionScreen
          key={phase.index}
          spec={spec}
          title={`${stepName(ritual, phase.index)} · ${phase.index + 1} of ${total}`}
          chained
          onDone={(r) => {
            void saveSession(r);
            handleDone(phase.index);
          }}
        />
      )}

      {phase.kind === 'transition' && (
        <Interlude next={stepName(ritual, phase.index + 1)} />
      )}

      {phase.kind === 'done' && (
        <ChainComplete
          title={flow.completeTitle}
          body={flow.completeBody}
          onHome={() => nav.home()}
        />
      )}
    </>
  );
}

function Interlude({ next }: { next: string }) {
  return (
    <div className="shell center" style={{ textAlign: 'center' }}>
      <div className="col center gap-sm view-enter">
        <span className="overline">Next</span>
        <h2 className="serif-italic" style={{ fontSize: '2.2rem' }}>
          {next}
        </h2>
        <p className="faint">Stay where you are.</p>
      </div>
    </div>
  );
}

function ChainComplete({
  title,
  body,
  onHome,
}: {
  title: string;
  body: string;
  onHome: () => void;
}) {
  return (
    <div className="shell center" style={{ textAlign: 'center', position: 'relative', zIndex: 60 }}>
      <div className="col center gap" style={{ flex: 1, justifyContent: 'center' }}>
        <h1 className="display">{title}</h1>
        <p className="muted" style={{ maxWidth: 300 }}>
          {body}
        </p>
      </div>
      <button className="btn btn-quiet btn-block" onClick={onHome}>
        Done
      </button>
    </div>
  );
}

function stepName(ritual: Ritual, index: number): string {
  const step = ritual.steps[index];
  if (!step) return '';
  return MODULES[step.module as 'breath' | 'candle' | 'meditation']?.name ?? step.module;
}

function buildSpec(ritual: Ritual, index: number): SessionSpec {
  const step = ritual.steps[index];
  const info = MODULES[step.module as 'breath' | 'candle' | 'meditation'];
  const pacing = step.pacingId
    ? BREATH_PATTERNS.find((p) => p.id === step.pacingId)
    : info?.paced
      ? BREATH_PATTERNS[0]
      : undefined;
  return {
    id: `${ritual.id}-${index}`,
    module: step.module,
    guide: info?.guide ?? 'silent',
    end: { kind: 'duration', seconds: step.amount },
    wakeLock: true,
    // The chain owns the ambient bed, so steps don't manage it.
    audio: { tones: step.module === 'breath', ambient: null, spoken: false },
    ...(pacing ? { pacing } : {}),
    ...(step.intention ? { intention: step.intention } : {}),
  };
}
