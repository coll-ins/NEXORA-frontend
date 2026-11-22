import { useEffect, useRef } from 'react';
import { Logo } from '../../components/Logo.jsx';
import './authscene.css';

/* Sign-in and register fill their empty left side with a small 3D piece: three
 * glass layers (a ledger, a chart, a progress ring) stacked like the app's own
 * records, with the coin turning above them. CSS transforms only. The stack
 * leans a little towards the pointer. */
export default function AuthScene() {
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
    <div className="a3d" ref={root} aria-hidden="true">
      <div className="a3d-stack">
        <div className="a3d-plate a3d-ledger" />
        <div className="a3d-plate a3d-bars"><i /><i /><i /><i /><i /></div>
        <div className="a3d-plate a3d-ring"><b /></div>
      </div>
      <div className="a3d-coin">
        <Logo className="a3d-face" />
        <Logo className="a3d-face a3d-back" />
      </div>
    </div>
  );
}
