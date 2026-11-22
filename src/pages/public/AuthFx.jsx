import Wave from './Wave.jsx';
import './authfx.css';

/* One quiet background effect per account page, so each feels a little
 * different without competing with the form. 'waves' is the sea along the bottom of sign-in and register. All are CSS only, low contrast,
 * and switched off by reduced motion. */
export default function AuthFx({ effect }) {
  if (effect === 'waves') return <Wave className="wave-auth" />;
  return (
    <div className={`fx fx-${effect}`} aria-hidden="true">
      {effect === 'drift' && Array.from({ length: 9 }, (_, i) => <i key={i} style={{ '--i': i }} />)}
      {effect === 'ripple' && <><i /><i /><i /></>}
      {effect === 'aurora' && <><i /><i /></>}
    </div>
  );
}
