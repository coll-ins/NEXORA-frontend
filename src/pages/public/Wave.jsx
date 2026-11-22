/* Layered waves that drift sideways at different speeds. Decorative only.
 * The path repeats every 1200 units and the SVG is twice as wide as its box, so
 * sliding it by half its width loops without a visible jump. Colours come from
 * the theme's --wave-1..3 tokens. */
import './wave.css';

const PATH = 'M0 60 C200 0 400 0 600 60 S1000 120 1200 60 S1600 0 1800 60 S2200 120 2400 60 V120 H0Z';

export default function Wave({ className = '' }) {
  return (
    <div className={`wave ${className}`} aria-hidden="true">
      {[1, 2, 3].map(n => (
        <svg key={n} className={`wave-layer wave-${n}`} viewBox="0 0 2400 120" preserveAspectRatio="none">
          <path d={PATH} />
        </svg>
      ))}
    </div>
  );
}
