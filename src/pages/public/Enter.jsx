import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import ErrorBanner from '../../components/ErrorBanner.jsx';
import ErrorPage from '../../components/ErrorPage.jsx';
import { homeFor } from '../../lib/perms.js';
import { describe } from '../../lib/errors.js';
import { useSession } from '../../lib/session.jsx';

function isSuspended(sacco) {
  return String(sacco && sacco.status || '').toLowerCase() === 'suspended';
}

function statusClass(sacco) {
  return isSuspended(sacco) ? 'bad' : 'up';
}

function WideErrorPage(props) {
  return (
    <div className="w-full">
      <ErrorPage {...props} />
    </div>
  );
}

export default function Enter() {
  const location = useLocation();
  const {
    enteredSaccoId,
    enterSacco,
    logout,
    navigate,
    perms,
    sacco,
    saccoId,
    saccos,
    switchSacco,
  } = useSession();
  const [digits, setDigits] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [pageError, setPageError] = useState('');
  const [forceChooser, setForceChooser] = useState(false);
  const [lockedSeconds, setLockedSeconds] = useState(0);
  const [lockedSaccoId, setLockedSaccoId] = useState(null);
  const [switching, setSwitching] = useState(false);
  const pinRefs = useRef([]);

  useEffect(() => {
    if (lockedSeconds <= 0) return undefined;
    const timer = window.setTimeout(() => setLockedSeconds(value => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [lockedSeconds]);

  const activeSaccos = useMemo(
    () => saccos.filter(item => item.membershipStatus === 'active'),
    [saccos],
  );
  const invitedSaccos = useMemo(
    () => saccos.filter(item => item.membershipStatus === 'invited'),
    [saccos],
  );
  const showChooser = forceChooser || (
    !location.state?.enterSelected
    && Boolean(location.state?.chooseSacco)
  );
  const currentIsEntered = enteredSaccoId != null
    && String(enteredSaccoId) === String(saccoId);
  const saccoLocked = lockedSaccoId != null
    && String(lockedSaccoId) === String(saccoId)
    && lockedSeconds > 0;

  useEffect(() => {
    if (location.pathname !== '/enter') return;
    if (!currentIsEntered || showChooser || location.state?.justJoined) return;
    navigate(location.state?.from || '/' + homeFor(perms), { replace: true });
  }, [currentIsEntered, showChooser, location.pathname, location.state, navigate, perms]);

  function setDigit(index, value) {
    const digit = value.replace(/\D/g, '').slice(-1);
    setDigits(previous => previous.map((item, current) => current === index ? digit : item));
    setError('');
    if (digit && index < pinRefs.current.length - 1) {
      pinRefs.current[index + 1]?.focus();
    }
  }

  function onPinPaste(event) {
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (!pasted) return;
    event.preventDefault();
    setDigits([...pasted, '', '', '', ''].slice(0, 4));
    setError('');
    pinRefs.current[Math.min(pasted.length, 3)]?.focus();
  }

  function onPinKeyDown(event, index) {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      pinRefs.current[index - 1]?.focus();
    }
  }

  async function chooseSacco(item) {
    setForceChooser(false);
    setError('');
    setDigits(['', '', '', '']);
    if (String(item.id) === String(saccoId)) {
      if (currentIsEntered) {
        navigate(location.state?.from || '/' + homeFor(perms), { replace: true });
      } else {
        navigate('/enter', {
          replace: true,
          state: { ...location.state, chooseSacco: false, enterSelected: true },
        });
      }
      return;
    }
    setSwitching(true);
    try {
      await switchSacco(item.id);
    } catch (failure) {
      setError(describe(failure).text);
    } finally {
      setSwitching(false);
    }
  }

  async function submitPin(event) {
    event.preventDefault();
    setError('');
    const pin = digits.join('');
    if (!/^\d{4}$/.test(pin)) {
      setError('Enter all four digits of your PIN.');
      return;
    }
    if (!saccoId || currentIsEntered) {
      navigate('/' + homeFor(perms), { replace: true });
      return;
    }
    setSwitching(true);
    try {
      const nextSession = await enterSacco(saccoId, pin);
      setDigits(['', '', '', '']);
      const target = location.state?.from || '/' + homeFor(nextSession.perms);
      navigate(target, { replace: true });
    } catch (failure) {
      setDigits(['', '', '', '']);
      if (failure && failure.code === 'PIN_LOCKED') {
        setLockedSaccoId(saccoId);
        setLockedSeconds(Math.max(0, Number(failure.retryAfter) || 900));
        setError('Too many wrong PINs. Try again in 15 minutes, or ask your admin to reset it.');
      } else if (failure && failure.code === 'PIN_WRONG') {
        const tries = String(failure.message || '').match(/(\d+)\s+tries?\s+(?:left|remaining)/i);
        setError(`That PIN is not right.${tries ? ` ${tries[1]} tries left.` : ''}`);
      } else if (failure && failure.status === 403) {
        setPageError('403');
      } else if (failure && failure.status === 423) {
        setPageError('423');
      } else {
        setError(describe(failure).text);
      }
    } finally {
      setSwitching(false);
    }
  }

  if (!activeSaccos.length) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col content-center gap-5 p-4 text-center md:p-6">
        <h1 className="font-serif text-3xl">You are not in a SACCO yet</h1>
        <p className="text-muted">
          Ask your SACCO admin or a staff member for a join code, then use it here.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <button className="btn" type="button" onClick={() => navigate('/join')}>
            Join with a code
          </button>
          <button className="btn ghost" type="button" onClick={() => void logout()}>
            Log out
          </button>
        </div>
        {invitedSaccos.map(item => (
          <section className="glass flex flex-col gap-2 text-left" key={item.id}>
            <h2 className="font-serif text-xl">Join {item.name}: you were invited</h2>
            <p className="text-muted">Enter your join code to set up your membership.</p>
            <button className="btn block" type="button" onClick={() => navigate('/join')}>
              Enter your join code
            </button>
          </section>
        ))}
      </div>
    );
  }

  if (showChooser) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-4 md:p-6">
        <header className="flex flex-col gap-2">
          <h1 className="font-serif text-3xl">Choose your SACCO</h1>
          <p className="text-muted">Choose a SACCO, then enter its PIN.</p>
        </header>
        {activeSaccos.map(item => (
          <button
            key={item.id}
            className="glass flex w-full items-center justify-between gap-3 text-left"
            type="button"
            disabled={switching}
            onClick={() => void chooseSacco(item)}
          >
            <span className="font-semibold">{item.name}</span>
            <span className={`chip ${statusClass(item)}`}>
              {isSuspended(item) ? 'Suspended' : 'Active'}
            </span>
          </button>
        ))}
        {invitedSaccos.map(item => (
          <section className="glass flex flex-col gap-2" key={item.id}>
            <h2 className="font-serif text-xl">Join {item.name}: you were invited</h2>
            <p className="text-muted">Enter your join code to set up your membership.</p>
            <button className="btn block" type="button" onClick={() => navigate('/join')}>
              Enter your join code
            </button>
          </section>
        ))}
      </div>
    );
  }

  if (pageError) {
    return (
      <WideErrorPage
        code={pageError}
        onAction={action => {
          if (action === 'switcher') {
            setPageError('');
            setForceChooser(true);
          } else if (action === 'account') {
            navigate('/account');
          } else if (action === 'home') {
            setPageError('');
            setForceChooser(activeSaccos.length > 1);
          } else if (action === 'back') {
            setPageError('');
          }
        }}
      />
    );
  }

  if (sacco && isSuspended(sacco)) {
    return (
      <WideErrorPage
        code="423"
        onAction={action => {
          if (action === 'switcher') setForceChooser(true);
          else if (action === 'account') navigate('/account');
        }}
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-xl p-4 md:p-6">
      <section className="glass flex flex-col gap-3">
        {location.state?.justJoined && <ErrorBanner kind="ok">You are in. Now enter your SACCO.</ErrorBanner>}
        <div className="eyebrow">Enter your SACCO</div>
        <h1 className="font-serif text-2xl">Enter your SACCO</h1>
        <p className="text-muted">{sacco ? sacco.name : 'Choose a SACCO to continue.'}</p>
        {error && <ErrorBanner>{error}</ErrorBanner>}
        {saccoLocked && (
          <ErrorBanner kind="warn">
            Try again in {Math.ceil(lockedSeconds / 60)} minutes.
          </ErrorBanner>
        )}
        {saccoId && (
          <form className="flex flex-col gap-3" onSubmit={submitPin}>
            <div className="pin-row" role="group" aria-label="Four-digit SACCO PIN">
              {digits.map((digit, index) => (
                <input
                  key={index}
                  ref={element => { pinRefs.current[index] = element; }}
                  className="h-12 w-12 shrink-0 rounded-lg border border-teal-2 bg-pop text-center text-xl text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-2"
                  type="password"
                  inputMode="numeric"
                  autoComplete={index === 0 ? 'one-time-code' : 'off'}
                  pattern="[0-9]"
                  maxLength={1}
                  value={digit}
                  aria-label={`PIN digit ${index + 1}`}
                  onChange={event => setDigit(index, event.target.value)}
                  onPaste={onPinPaste}
                  onKeyDown={event => onPinKeyDown(event, index)}
                  required
                />
              ))}
            </div>
            <button
              className="btn block"
              type="submit"
              disabled={switching || saccoLocked || digits.join('').length !== 4}
            >
              {switching ? 'Checking PIN...' : 'Continue'}
            </button>
          </form>
        )}
        {activeSaccos.length > 1 && (
          <button
            className="link-btn justify-self-center"
            type="button"
            onClick={() => {
              setError('');
              setDigits(['', '', '', '']);
              setForceChooser(true);
            }}
          >
            Not your SACCO? Choose another
          </button>
        )}
      </section>
    </div>
  );
}
