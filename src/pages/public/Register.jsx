import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import ErrorBanner from '../../components/ErrorBanner.jsx';
import Field from '../../components/Field.jsx';
import { describe } from '../../lib/errors.js';
import { registerRequest, resendVerificationRequest } from '../../api/auth.js';
import EyeIcon from './EyeIcon.jsx';
import AuthFrame from './AuthFrame.jsx';

export default function Register() {
  const location = useLocation();
  /* Arriving from "Join with a code": keep that intent alive through the
   * account step and the verification link, so signing in lands on /join. */
  const joinIntent = Boolean(location.state && location.state.from === '/join');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [again, setAgain] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showAgain, setShowAgain] = useState(false);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [note, setNote] = useState('');
  const [resending, setResending] = useState(false);

  async function submit(event) {
    event.preventDefault();
    const next = {};
    if (!name.trim()) next.name = 'Enter your full name.';
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) next.email = 'Enter a valid email address.';
    if (password.length < 8) next.password = 'Use at least 8 characters.';
    if (again !== password) next.again = 'The two passwords do not match.';
    setErrors(next);
    setError('');
    if (Object.keys(next).length > 0) return;
    setSending(true);
    try {
      await registerRequest(name.trim(), email.trim(), password);
      setDone(true);
    } catch (failure) {
      setError(describe(failure).text);
    } finally {
      setSending(false);
    }
  }

  async function resend() {
    setResending(true);
    setNote('');
    try {
      await resendVerificationRequest(email.trim());
      setNote('If that address is registered, a new link is on its way.');
    } catch (failure) {
      setNote(describe(failure).text);
    } finally {
      setResending(false);
    }
  }

  if (done) {
    return (
      <AuthFrame
        eyebrow="Create an account"
        effect="drift"
        heading="Check your email"
        intro="We sent a link to confirm your address."
      >
        <ErrorBanner kind="info">
          Open the link in your email, then sign in
          {joinIntent ? ' and we will take you to your join code.' : '.'}
        </ErrorBanner>
        {note && <ErrorBanner kind="info">{note}</ErrorBanner>}
        <button className="btn ghost" type="button" onClick={resend} disabled={resending}>
          {resending ? 'Sending...' : 'Send the link again'}
        </button>
        <nav className="auth-links" aria-label="Account options">
          <Link to="/login" state={joinIntent ? { from: '/join' } : undefined}>
            Go to sign in
          </Link>
        </nav>
      </AuthFrame>
    );
  }

  return (
    <AuthFrame
      eyebrow="Create an account"
      effect="waves"
      scene
      heading="Make your account"
      intro="You join a SACCO with a code after this."
      onSubmit={submit}
    >
      {error && <ErrorBanner>{error}</ErrorBanner>}
      <Field id="reg-name" label="Full name" error={errors.name}>
        <input type="text" autoComplete="name" value={name} onChange={event => setName(event.target.value)} />
      </Field>
      <Field id="reg-email" label="Email" error={errors.email}>
        <input type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} />
      </Field>
      <div className="relative">
        <Field id="reg-password" label="Password" error={errors.password}>
          <input
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
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
      <div className="relative">
        <Field id="reg-again" label="Password again" error={errors.again}>
          <input
            type={showAgain ? 'text' : 'password'}
            autoComplete="new-password"
            value={again}
            className="pr-12"
            onChange={event => setAgain(event.target.value)}
          />
        </Field>
        <button
          className="pw-eye absolute right-2 top-6 z-10 grid h-12 w-10 place-items-center rounded-full"
          type="button"
          aria-label={showAgain ? 'Hide password' : 'Show password'
          }
          aria-pressed={showAgain}
          onClick={() => setShowAgain(value => !value)}
        >
          <EyeIcon off={showAgain} />
        </button>
      </div>
      <button className="btn" type="submit" disabled={sending}>
        {sending ? 'Creating...' : 'Create account'}
      </button>
      <nav className="auth-links" aria-label="Account options">
        <Link to="/login">I already have an account</Link>
      </nav>
    </AuthFrame>
  );
}
