import { Suspense, useEffect, useRef, useState } from 'react';
import Intro from '../pages/public/Intro.jsx';
import { useLocation, useOutlet } from 'react-router-dom';

const INTRO_MS = 4800;
const RISE_MS = 900;
const LIFT_MS = 1100;
const REDUCED_FADE_MS = 140;
/* The curtain (coin and wave) plays only when the app loads and when a person goes to the Overview.
 * Every other page change uses the quick fade, so a click shows its page at once. */
const CURTAIN_PATHS = ['/overview', '/pf-overview'];
const wantsCurtain = path => CURTAIN_PATHS.includes(path);

export default function RouteTransition() {
  const outlet = useOutlet();
  const location = useLocation();
  const [reducedMotion] = useState(() => (
    typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ));
  const initialPhase = reducedMotion ? 'idle' : 'intro';
  const [phase, setPhaseState] = useState(initialPhase);
  const [visibleOutlet, setVisibleOutlet] = useState(outlet);
  const [sequence, setSequence] = useState(0);
  const outletRef = useRef(outlet);
  const phaseRef = useRef(initialPhase);
  const locationKeyRef = useRef(location.key);
  const [quickMode, setQuickMode] = useState(false);
  const curtainRef = useRef(null);

  function setPhase(next) {
    phaseRef.current = next;
    setPhaseState(next);
  }

  useEffect(() => {
    outletRef.current = outlet;
    if (phaseRef.current === 'intro') setVisibleOutlet(outlet);
  }, [outlet, reducedMotion]);

  useEffect(() => {
    if (reducedMotion) return undefined;
    const exitTimer = window.setTimeout(() => setPhase('exit'), INTRO_MS - LIFT_MS);
    const finishTimer = window.setTimeout(() => setPhase('idle'), INTRO_MS);
    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(finishTimer);
    };
  }, [reducedMotion]);

  useEffect(() => {
    if (locationKeyRef.current === location.key) return undefined;
    locationKeyRef.current = location.key;
    const quick = !reducedMotion && !wantsCurtain(location.pathname);

    if (phaseRef.current === 'intro') {
      setVisibleOutlet(outlet);
      return undefined;
    }

    let cancelled = false;
    let frame = 0;
    const timers = [];
    const schedule = (callback, delay) => {
      timers.push(window.setTimeout(callback, delay));
    };

    if (reducedMotion || quick) {
      schedule(() => {
        if (quick) setQuickMode(true);
        setPhase('reduced-cover');
      }, 0);
      schedule(() => setPhase('reduced-reveal'), REDUCED_FADE_MS);
      schedule(() => {
        setPhase('idle');
        if (quick) { setVisibleOutlet(outletRef.current); setQuickMode(false); }
      }, REDUCED_FADE_MS * 2);
      return () => {
        cancelled = true;
        timers.forEach(window.clearTimeout);
      };
    }

    schedule(() => {
      if (cancelled) return;
      setSequence(value => value + 1);
      setPhase('entering');
      schedule(() => {
        if (cancelled) return;
        setVisibleOutlet(outletRef.current);
        setPhase('covered');
        frame = window.requestAnimationFrame(() => {
          if (cancelled) return;
          setPhase('exit');
          schedule(() => setPhase('idle'), LIFT_MS);
        });
      }, RISE_MS);
    }, 0);

    return () => {
      cancelled = true;
      timers.forEach(window.clearTimeout);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [location.key, location.pathname, outlet, reducedMotion]);

  const fast = reducedMotion || quickMode;
  return (
    <>
      <div
        className={fast ? 'route-content' : 'contents'}
        style={fast ? {
          opacity: phase === 'reduced-cover' ? 0 : 1,
          transition: `opacity ${REDUCED_FADE_MS}ms ease`,
        } : undefined}
      >
        <Suspense fallback={<div className="glass p-6 text-muted">Loading...</div>}>
          {fast ? outlet : visibleOutlet}
        </Suspense>
      </div>
      <Intro phase={phase} sequence={sequence} curtainRef={curtainRef} />
    </>
  );
}