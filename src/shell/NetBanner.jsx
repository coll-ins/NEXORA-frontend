import { useEffect, useState } from 'react';
import ErrorBanner from '../components/ErrorBanner.jsx';
import { describe } from '../lib/errors.js';

const NETWORK_STATUS_EVENT = 'nexora:network-status';
const ERROR_ACTION_LAYOUT = `
  main > div:has(> [role="alert"] > .mt-2.flex) {
    width: 100%;
    grid-template-columns: minmax(0, 1fr);
  }
  main > div:has(> [role="alert"] > .mt-2.flex) > [role="alert"] {
    width: 100%;
    justify-self: stretch;
    grid-template-columns: minmax(0, 1fr);
  }
  main > div:has(> [role="alert"] > .mt-2.flex) > [role="alert"] > .mt-2.flex {
    width: 100%;
    max-width: 100%;
    justify-self: stretch;
    flex-wrap: nowrap;
  }
`;

export default function NetBanner() {
  const [offline, setOffline] = useState(
    () => typeof navigator !== 'undefined' && !navigator.onLine,
  );

  useEffect(() => {
    function onOffline() {
      setOffline(true);
    }

    function onOnline() {
      setOffline(false);
    }

    function onNetworkStatus(event) {
      if (event.detail && event.detail.status === 0) {
        setOffline(true);
      } else if (navigator.onLine) {
        setOffline(false);
      }
    }

    window.addEventListener('offline', onOffline);
    window.addEventListener('online', onOnline);
    window.addEventListener(NETWORK_STATUS_EVENT, onNetworkStatus);
    return () => {
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('online', onOnline);
      window.removeEventListener(NETWORK_STATUS_EVENT, onNetworkStatus);
    };
  }, []);

  return (
    <>
      <style>{ERROR_ACTION_LAYOUT}</style>
      {offline && (
        <div className="fixed inset-x-0 top-0 z-[100] flex justify-center px-3 pt-3">
          <div className="w-full max-w-2xl">
            <ErrorBanner kind="warn">
              {describe({ status: 0 }, { mode: 'page' }).text}
            </ErrorBanner>
          </div>
        </div>
      )}
    </>
  );
}
