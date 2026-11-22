import { useState } from 'react';
import { Link } from 'react-router-dom';
import ErrorBanner from '../../components/ErrorBanner.jsx';
import Field from '../../components/Field.jsx';
import { describe } from '../../lib/errors.js';
import { forgotPasswordRequest } from '../../api/auth.js';
import AuthFrame from './AuthFrame.jsx';

export default function Forgot() {
  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError('');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setFieldError('Enter a valid email address.');
      return;
    }
    setFieldError('');
    setSending(true);
    try {
      await forgotPasswordRequest(email.trim());
      setSent(true);
    } catch (failure) {
      setError(describe(failure).text);
    } finally {
      setSending(false);
    }
  }

  return (
    <AuthFrame
      eyebrow="Forgot password"
      effect="ripple"
      heading="Get back in"
      intro="Enter your email and we will send a reset link."
      onSubmit={submit}
    >
      {error && <ErrorBanner>{error}</ErrorBanner>}
      {sent && <ErrorBanner kind="info">If that address is registered, a reset link is on its way.</ErrorBanner>}
      <Field id="forgot-email" label="Email" error={fieldError}>
        <input type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} />
      </Field>
      <button className="btn" type="submit" disabled={sending}>
        {sending ? 'Sending...' : 'Send reset link'}
      </button>
      <nav className="auth-links" aria-label="Account options">
        <Link to="/login">Back to sign in</Link>
      </nav>
    </AuthFrame>
  );
}