import './visuals.css';

/**
 * The meditation guide: a quiet, self-breathing ring under a faint scatter of
 * stars. No pacing is imposed — the slow pulse is just somewhere soft to rest
 * the eyes.
 */
export function SilentVisual({ reduced }: { reduced: boolean }) {
  return (
    <div className="silent-wrap" aria-hidden>
      <div className="stars" />
      <div className={`silent-ring ${reduced ? 'silent-still' : ''}`} />
      <div className={`silent-ring silent-ring-2 ${reduced ? 'silent-still' : ''}`} />
      <div className="silent-core" />
    </div>
  );
}
