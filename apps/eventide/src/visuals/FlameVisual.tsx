import './visuals.css';

/**
 * A trāṭaka candle: a slender taper of warm wax against the ink. The flame
 * flickers softly while the session runs and is snuffed — collapsing to an
 * ember, a wisp of smoke rising — when it ends.
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
      <div className="taper">
        <div className="wick" />
      </div>
      <div className="taper-base" />
    </div>
  );
}
