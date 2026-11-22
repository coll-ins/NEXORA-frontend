import { useEffect, useRef } from 'react';
import { Logo } from '../../components/Logo.jsx';
import './scene3d.css';

/* Decorative 3D scene: a spinning NEXORA coin inside two tilted rings. Pure CSS transforms, no WebGL, so it costs no
 * bundle size. The pointer only sets --px/--py on the root; the scene tilts
 * towards it. Reduced motion stops the spin and the parallax. */
export default function Scene3D({ className = '' }) {
  const root = useRef(null);

  useEffect(() => {
    const el = root.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    function move(event) {
      el.style.setProperty('--px', (event.clientX / window.innerWidth - 0.5).toFixed(3));
      el.style.setProperty('--py', (event.clientY / window.innerHeight - 0.5).toFixed(3));
    }
    window.addEventListener('pointermove', move);
    return () => window.removeEventListener('pointermove', move);
  }, []);

  return (
    <div className={`scene3d ${className}`} ref={root} aria-hidden="true">
      <div className="s3-stage">
        <div className="s3-ring s3-ring-a" />
        <div className="s3-ring s3-ring-b" />
        <div className="s3-coin">
          <Logo className="s3-face" />
          <Logo className="s3-face s3-back" />
        </div>
        <div className="s3-shadow" />
      </div>
    </div>
  );
}
