import './visuals.css';

/**
 * A trāṭaka candle. The flame flickers softly while the session runs and is
 * snuffed — shrinking to an ember, a wisp of smoke rising — when it ends.
 */
export function FlameVisual({
  snuffed,
  reduced,
}: {
  snuffed: boolean;
  reduced: boolean;
}) {
  return (
    <div className="candle-wrap" aria-hidden>
      <div className={`flame ${snuffed ? 'flame-out' : ''} ${reduced ? 'flame-still' : ''}`}>
        <div className="flame-glow" />
        <div className="flame-body" />
        <div className="flame-core" />
      </div>
      <div className={`smoke ${snuffed ? 'smoke-rise' : ''}`} />
      <div className="candle-body">
        <div className="wick" />
      </div>
      <div className="candle-pool" />
    </div>
  );
}
