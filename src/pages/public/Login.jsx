import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import AuthFx from './AuthFx.jsx';
import AuthScene from './AuthScene.jsx';
import EyeIcon from './EyeIcon.jsx';
import ErrorBanner from '../../components/ErrorBanner.jsx';
import ErrorPage from '../../components/ErrorPage.jsx';
import Field from '../../components/Field.jsx';
import { ROLES } from '../../lib/perms.js';
import { useSession } from '../../lib/session.jsx';
import { describe } from '../../lib/errors.js';
import { MOCK } from '../../lib/http.js';
import { resendVerificationRequest } from '../../api/auth.js';

export default function Login() {
  const { login, sessionEnded, clearSessionEnded } = useSession();
  const location = useLocation();
  /* Someone who came in through "Join with a code" needs an account first: the
   * join API ties the code to the signed-in user. Say so, instead of leaving them
   * on a sign-in page wondering why their code did not work. */
  const cameToJoin = Boolean(location.state && location.state.from === '/join');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('member');
  const [error, setError] = useState('');
  const [unverified, setUnverified] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [resending, setResending] = useState(false);
  const [lockedSeconds, setLockedSeconds] = useState(0);
  const [lockedEmail, setLockedEmail] = useState('');

  useEffect(() => {
    if (lockedSeconds <= 0) return undefined;
    const timer = window.setTimeout(() => setLockedSeconds(value => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [lockedSeconds]);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setUnverified(false);
    setResendMessage('');
    setSending(true);
    try {
      await login(email.trim(), password, role);
    } catch (failure) {
      setPassword('');
      if (
        failure
        && (failure.code === 'EMAIL_NOT_VERIFIED'
          || (failure.status === 403 && /verif/i.test(failure.message || '')))
      ) {
        setUnverified(true);
        setError('Open the link we sent to verify your email, or send it again.');
      } else if (failure && failure.status === 423) {
        setLockedEmail(email.trim().toLowerCase());
        setLockedSeconds(Math.max(0, Number(failure.retryAfter) || 900));
        setError('This account is locked for 15 minutes.');
      } else {
        setError(describe(failure, { context: 'login' }).text);
      }
    } finally {
      setSending(false);
    }
  }

  async function resendLink() {
    setResending(true);
    setResendMessage('');
    try {
      await resendVerificationRequest(email.trim());
      setResendMessage('If that address is registered, a new link is on its way.');
    } catch (failure) {
      setResendMessage(describe(failure).text);
    } finally {
      setResending(false);
    }
  }

  return (
    <main className="auth">
      <AuthFx effect="waves" />
      <div className="auth-inner">
        <div className="auth-copy">
          <h1 className="serif">Welcome <em>back.</em></h1>
          <p>Sign in to continue to your SACCO.</p>
          <AuthScene />
        </div>
        <form className="glass auth-card" onSubmit={submit}>
          <div className="eyebrow">Sign in</div>
          {cameToJoin && (
            <ErrorBanner kind="info">
              Sign in and we will take you straight to your join code. New here?{' '}
              <Link className="link-btn" to="/register">Create an account</Link>, then use the
              code your SACCO gave you.
            </ErrorBanner>
          )}
          {sessionEnded && (
            <ErrorPage code="401" onAction={action => {
              if (action === 'login') clearSessionEnded();
            }} />
          )}
          <h2 className="serif">Your SACCO awaits</h2>
          {error && (
            <ErrorBanner>
              {error}
              {lockedSeconds > 0 && (
                <span> Try again in {Math.ceil(lockedSeconds / 60)} minutes.</span>
              )}
              {failureIsLocked(error) && (
                <Link className="link-btn" to="/forgot">Forgot password</Link>
              )}
              {unverified && (
                <button className="link-btn" type="button" onClick={resendLink} disabled={resending}>
                  {resending ? 'Sending...' : 'Send the link again'}
                </button>
              )}
            </ErrorBanner>
          )}
          {resendMessage && <ErrorBanner kind="info">{resendMessage}</ErrorBanner>}
          <Field id="login-email" label="Email">
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={event => {
                const nextEmail = event.target.value;
                setEmail(nextEmail);
                if (lockedEmail && nextEmail.trim().toLowerCase() !== lockedEmail) {
                  setLockedSeconds(0);
                  setLockedEmail('');
                  setError('');
                }
              }}
            />
          </Field>
          <div className="relative">
            <Field id="login-password" label="Password">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                className="pr-12"
                onChange={event => setPassword(event.target.value)}
              />
            </Field>
            <button
              className="pw-eye absolute right-2 top-6 z-10 grid h-12 w-10 place-items-center rounded-full"
              type="button"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
              onClick={() => setShowPassword(value => !value)}
            >
              <EyeIcon off={showPassword} />
            </button>
          </div>
          {MOCK && (
            <Field id="login-role" label="Test role">
              <select value={role} onChange={event => setRole(event.target.value)}>
                {Object.entries(ROLES).map(([key, item]) => (
                  <option key={key} value={key}>{item.label}</option>
                ))}
              </select>
            </Field>
          )}
          <button className="btn" type="submit" disabled={sending || lockedSeconds > 0}>
            {sending ? 'Signing in...' : 'Sign in'}
          </button>
          <nav className="auth-links" aria-label="Account options">
            <Link to="/register">Create an account</Link>
            {/* /join needs a session (the API ties the code to the signed-in
              * account), so sending a visitor there from here just bounced back
              * to this page. The only step forward is the account, and it
              * carries the intent so sign-in finishes the journey at /join. */}
            <Link to="/register" state={{ from: '/join' }}>Join with a code</Link>
            <Link to="/forgot">Forgot password</Link>
          </nav>
        </form>
      </div>
    </main>
  );
}

function failureIsLocked(message) {
  return message === 'This account is locked for 15 minutes.';
}
