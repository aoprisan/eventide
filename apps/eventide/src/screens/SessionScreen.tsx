import { useEffect, useRef, useState } from 'react';
import { useNav } from '../nav.js';
import { useEngine } from '../engine/EngineContext.js';
import { useSession } from '../engine/useSession.js';
import { reduceMotion, type SessionResult, type SessionSpec } from '@eventide/engine';
import { Icon } from '../components/ui.js';
import { OrbVisual } from '../visuals/OrbVisual.js';
import { FlameVisual } from '../visuals/FlameVisual.js';
import { SilentVisual } from '../visuals/SilentVisual.js';

function clock(seconds: number): string {
  const s = Math.max(0, Math.ceil(seconds));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

/**
 * Runs a single SessionSpec to completion. The visual is chosen by the spec's
 * guide; the cue, countdown, and controls are the same shell for every module —
 * the consistency of feel the design doc is built around.
 */
export function SessionScreen({
  spec,
  title,
  onDone,
  chained,
}: {
  spec: SessionSpec;
  title: string;
  /** When part of "Tonight", the chain handles persistence + advancement. */
  onDone?: (result: SessionResult) => void;
  chained?: boolean;
}) {
  const nav = useNav();
  const { saveSession, prefs } = useEngine();
  const reduced = reduceMotion(prefs.reducedMotion);
  const [result, setResult] = useState<SessionResult | null>(null);
  const savedRef = useRef(false);

  const { frame, start, pause, resume, end } = useSession(spec, (r) => {
    setResult(r);
    if (onDone) {
      onDone(r);
    } else if (!savedRef.current) {
      savedRef.current = true;
      void saveSession(r);
    }
  });

  // Begin once the screen settles. The preceding tap already unlocked audio.
  useEffect(() => {
    const t = setTimeout(() => void start(), 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const done = frame.status === 'complete' || result != null;
  const running = frame.status === 'running';

  if (done && !chained) {
    return <Completion title={title} result={result} onHome={() => nav.home()} />;
  }
  if (done && chained) {
    // The chain renders its own transition; keep the stage calm meanwhile.
    return <div className="shell" />;
  }

  const amplitude = frame.pacer?.amplitude ?? 0;

  return (
    <div className="shell view-enter">
      {/* the session's progress: a hairline of ember filling along the top edge */}
      {frame.progress != null && (
        <div className="session-progress" aria-hidden>
          <span style={{ width: `${frame.progress * 100}%` }} />
        </div>
      )}

      <div className="row between" style={{ paddingTop: 6 }}>
        <button className="icon-btn" aria-label="End" onClick={() => end('partial')}>
          <Icon name="close" />
        </button>
        <span className="overline">{title}</span>
        <span style={{ width: 44 }} />
      </div>

      {spec.intention && (
        <p className="serif-italic muted text-center" style={{ marginTop: 4 }}>
          “{spec.intention}”
        </p>
      )}

      <div className="session-stage">
        {spec.guide === 'orb' && <OrbVisual amplitude={amplitude} reduced={reduced} />}
        {spec.guide === 'flame' && <FlameVisual snuffed={done} reduced={reduced} />}
        {spec.guide === 'silent' && <SilentVisual reduced={reduced} />}

        <div className="col center gap-sm">
          <div className="cue">{frame.cue}</div>
          {frame.remaining != null && <div className="countdown">{clock(frame.remaining)}</div>}
        </div>
      </div>

      <div className="session-controls">
        <button
          className="btn btn-quiet control-pill"
          onClick={() => (running ? pause() : void resume())}
        >
          <Icon name={running ? 'pause' : 'play'} size={18} />
          {running ? 'Pause' : 'Resume'}
        </button>
      </div>
    </div>
  );
}

function Completion({
  title,
  result,
  onHome,
}: {
  title: string;
  result: SessionResult | null;
  onHome: () => void;
}) {
  const mins = result ? Math.max(1, Math.round(result.durationActual / 60)) : 0;
  return (
    <div className="shell view-enter center" style={{ textAlign: 'center' }}>
      <div className="col center gap" style={{ flex: 1, justifyContent: 'center' }}>
        <span className="overline overline-hour">{title} complete</span>
        <h1 className="display" style={{ maxWidth: 360 }}>
          Well done
        </h1>
        <p className="muted" style={{ maxWidth: 320 }}>
          {mins} quiet minute{mins > 1 ? 's' : ''}. Let the calm stay with you.
        </p>
      </div>
      <button className="btn btn-quiet btn-block" onClick={onHome}>
        Home
      </button>
    </div>
  );
}
