import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import ErrorBanner from '../../components/ErrorBanner.jsx';
import Field from '../../components/Field.jsx';
import { describe } from '../../lib/errors.js';
import { useSession } from '../../lib/session.jsx';
import { resetPasswordRequest } from '../../api/auth.js';
import EyeIcon from './EyeIcon.jsx';
import AuthFrame from './AuthFrame.jsx';

export default function Reset() {
  const { navigate, toast } = useSession();
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [again, setAgain] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showAgain, setShowAgain] = useState(false);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  async function submit(event) {
    event.preventDefault();
    const next = {};
    if (password.length < 8) next.password = 'Use at least 8 characters.';
    if (again !== password) next.again = 'The two passwords do not match.';
    setErrors(next);
    setError('');
    if (Object.keys(next).length > 0) return;
    setSending(true);
    try {
      await resetPasswordRequest(token, password);
      toast('Password changed. Sign in with the new one.');
      navigate('/login', { replace: true });
    } catch (failure) {
      setError(describe(failure).text);
      setSending(false);
    }
  }

  if (!token) {
    return (
      <AuthFrame eyebrow="Reset password" heading="This link is not complete">
        <ErrorBanner>Open the link from your email again, or ask for a new one.</ErrorBanner>
        <Link className="btn" to="/forgot">Ask for a new link</Link>
      </AuthFrame>
    );
  }

  return (
    <AuthFrame
      eyebrow="Reset password"
      effect="sweep"
      heading="Choose a new password"
      intro="Use at least 8 characters."
      onSubmit={submit}
    >
      {error && (
        <ErrorBanner>
          {error} <Link className="link-btn" to="/forgot">Ask for a new link</Link>
        </ErrorBanner>
      )}
      <div className="relative">
        <Field id="reset-password" label="New password" error={errors.password}>
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
        <Field id="reset-again" label="New password again" error={errors.again}>
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
          aria-label={showAgain ? 'Hide password' : 'Show password'}
          aria-pressed={showAgain}
          onClick={() => setShowAgain(value => !value)}
        >
          <EyeIcon off={showAgain} />
        </button>
      </div>
      <button className="btn" type="submit" disabled={sending}>
        {sending ? 'Saving...' : 'Save new password'}
      </button>
    </AuthFrame>
  );
}
