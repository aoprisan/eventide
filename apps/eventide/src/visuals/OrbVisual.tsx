import './visuals.css';

/**
 * The breath orb. Its size and glow are driven directly by the pacer's
 * amplitude (0 = empty lungs, 1 = full), so motion *is* the breath — the user
 * follows the orb rather than a number.
 */
export function OrbVisual({
  amplitude,
  reduced,
}: {
  amplitude: number;
  reduced: boolean;
}) {
  // Map fullness to a calm scale and luminosity range.
  const scale = reduced ? 0.9 : 0.55 + amplitude * 0.5;
  const glow = 0.35 + amplitude * 0.65;

  return (
    <div className="orb-wrap" aria-hidden>
      <div className="orb-aura" style={{ opacity: glow }} />
      <div
        className="orb"
        style={{
          transform: `scale(${scale})`,
          // a brighter teal core as the breath fills
          filter: `brightness(${0.8 + amplitude * 0.5})`,
        }}
      >
        <div className="orb-sheen" />
      </div>
      {/* the path the breath traces — a quiet guide ring */}
      <div className="orb-ring" style={{ transform: `scale(${0.55 + amplitude * 0.5})` }} />
    </div>
  );
}
