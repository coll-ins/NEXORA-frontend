import { useEffect } from 'react';
import ErrorBanner from '../components/ErrorBanner.jsx';
import ErrorPage from '../components/ErrorPage.jsx';
import { describe } from '../lib/errors.js';
import { homeFor } from '../lib/perms.js';
import { useSession } from '../lib/session.jsx';

const NETWORK_STATUS_EVENT = 'nexora:network-status';

export default function PageState({ status, error, reload, onAction }) {
  const session = useSession();
  const pageError = status === 'error'
    ? describe(error, { mode: 'page' })
    : null;
  const page = pageError && pageError.page;

  useEffect(() => {
    if (status === 'error' && page === 'offline') {
      window.dispatchEvent(new CustomEvent(NETWORK_STATUS_EVENT, {
        detail: { status: 0 },
      }));
    } else if ((status === 'ready' || status === 'empty') && navigator.onLine) {
      window.dispatchEvent(new CustomEvent(NETWORK_STATUS_EVENT, {
        detail: { status: 200 },
      }));
    }
  }, [status, page]);

  useEffect(() => {
    if (status !== 'error' || page !== 'offline' || typeof reload !== 'function') {
      return undefined;
    }
    window.addEventListener('online', reload);
    return () => window.removeEventListener('online', reload);
  }, [status, page, reload]);

  if (status !== 'error') return null;

  function handleAction(action) {
    const handler = onAction || session.onErrorAction;
    if (handler) {
      handler(action);
      return;
    }
    if (action === 'retry') {
      if (reload) reload();
    } else if (action === 'home') {
      session.navigate('/' + homeFor(session.perms));
    } else if (action === 'back') {
      const historyIndex = window.history.state && window.history.state.idx;
      session.navigate(Number.isInteger(historyIndex) && historyIndex > 0
        ? -1
        : '/' + homeFor(session.perms));
    } else if (action === 'login') {
      session.navigate('/login');
    } else if (action === 'landing') {
      session.navigate('/');
    } else if (action === 'switcher') {
      session.navigate('/overview', { open: 'sacco:switcher' });
    } else if (action === 'account') {
      session.navigate('/account');
    }
  }

  if (page) {
    return (
      <ErrorPage
        code={page}
        wait={pageError.wait}
        onAction={handleAction}
      />
    );
  }

  return (
    <ErrorBanner onRetry={reload}>
      {describe(error).text}
    </ErrorBanner>
  );
}
