import './visuals.css';

/**
 * The meditation guide: a distant lamp resting on a still horizon, its
 * reflection beneath. No pacing is imposed — the slow pulse is just
 * somewhere soft to rest the eyes.
 */
export function SilentVisual({ reduced }: { reduced: boolean }) {
  return (
    <div className="lake-wrap" aria-hidden>
      <div className={`lake-ring ${reduced ? 'lake-still' : ''}`} />
      <div className={`lake-ring lake-ring-2 ${reduced ? 'lake-still' : ''}`} />
      <div className={`lake-lamp ${reduced ? 'lake-still' : ''}`} />
      <div className="lake-line" />
      <div className={`lake-reflection ${reduced ? 'lake-still' : ''}`} />
    </div>
  );
}
