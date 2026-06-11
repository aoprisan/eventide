import './visuals.css';

/**
 * The breath guide: a moonstone disc inside a hairline ring. The ring marks a
 * full inhale; the disc swells to meet it and falls away with the exhale, so
 * motion *is* the breath — the user follows the disc, not a number.
 */
export function OrbVisual({
  amplitude,
  reduced,
}: {
  amplitude: number;
  reduced: boolean;
}) {
  const scale = reduced ? 0.78 : 0.42 + amplitude * 0.52;
  const glow = 0.25 + amplitude * 0.6;

  return (
    <div className="orb-wrap" aria-hidden>
      <div className="orb-guide" />
      <div className="orb-halo" style={{ opacity: glow }} />
      <div
        className="orb-disc"
        style={{
          transform: `scale(${scale})`,
          filter: `brightness(${0.85 + amplitude * 0.4})`,
        }}
      />
    </div>
  );
}
