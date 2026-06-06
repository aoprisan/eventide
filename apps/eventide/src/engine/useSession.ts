import { useEffect, useMemo, useRef, useState } from 'react';
import {
  SessionController,
  type SessionFrame,
  type SessionResult,
  type SessionSpec,
} from '@eventide/engine';
import { useEngine } from './EngineContext.js';

const IDLE_FRAME: SessionFrame = {
  status: 'idle',
  elapsed: 0,
  progress: null,
  remaining: null,
  reps: 0,
  pacer: null,
  cue: '',
};

export interface UseSession {
  frame: SessionFrame;
  start: () => Promise<void>;
  pause: () => void;
  resume: () => Promise<void>;
  tapRep: () => void;
  end: (outcome?: SessionResult['outcome']) => SessionResult;
}

/**
 * Bridges a {@link SessionController} into React for one {@link SessionSpec}.
 * The controller is the source of truth; this just mirrors its frames into
 * state and forwards the completed result to `onComplete`.
 */
export function useSession(
  spec: SessionSpec,
  onComplete: (result: SessionResult) => void,
): UseSession {
  const { audio } = useEngine();
  const [frame, setFrame] = useState<SessionFrame>(IDLE_FRAME);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const controller = useMemo(
    () => new SessionController(spec, audio),
    // A spec change means a genuinely new session.
    [spec, audio],
  );

  useEffect(() => {
    const unsubFrame = controller.subscribe(setFrame);
    const unsubComplete = controller.onComplete((result) =>
      onCompleteRef.current(result),
    );
    return () => {
      unsubFrame();
      unsubComplete();
      controller.dispose();
    };
  }, [controller]);

  return {
    frame,
    start: () => controller.start(),
    pause: () => controller.pause(),
    resume: () => controller.resume(),
    tapRep: () => controller.tapRep(),
    end: (outcome) => controller.end(outcome),
  };
}
