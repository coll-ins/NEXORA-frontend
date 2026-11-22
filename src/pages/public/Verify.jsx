import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import ErrorBanner from '../../components/ErrorBanner.jsx';
import { describe } from '../../lib/errors.js';
import { verifyEmailRequest } from '../../api/auth.js';
import AuthFrame from './AuthFrame.jsx';

export default function Verify() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [status, setStatus] = useState(token ? 'working' : 'missing');
  const [error, setError] = useState('');
  const started = useRef(false);

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true;
    verifyEmailRequest(token)
      .then(() => setStatus('ok'))
      .catch(failure => {
        setError(describe(failure).text);
        setStatus('error');
      });
  }, [token]);

  return (
    <AuthFrame eyebrow="Verify your email" effect="drift" heading="Confirming your email">
      {status === 'working' && <p className="text-muted">Checking your link...</p>}
      {status === 'ok' && (
        <>
          <ErrorBanner kind="ok">Your email is confirmed. You can sign in now.</ErrorBanner>
          <Link className="btn" to="/login">Go to sign in</Link>
        </>
      )}
      {status === 'error' && (
        <>
          <ErrorBanner>{error}</ErrorBanner>
          <Link className="btn ghost" to="/login">Go to sign in</Link>
        </>
      )}
      {status === 'missing' && (
        <>
          <ErrorBanner>This link is not complete. Open it again from your email.</ErrorBanner>
          <Link className="btn ghost" to="/login">Go to sign in</Link>
        </>
      )}
    </AuthFrame>
  );
}