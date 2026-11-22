import { useCallback, useEffect, useRef, useState } from 'react';
import { describe } from '../lib/errors.js';
import { useSession } from '../lib/session.jsx';
import { listRecentAudit } from '../api/session.js';
import ErrorBanner from '../components/ErrorBanner.jsx';
import Icon from './Icon.jsx';
import usePopupFocus from './usePopupFocus.js';

export default function Bell({ open, onToggle, onClose }) {
  const { can, saccoId, navigate } = useSession();
  const [result, setResult] = useState(null);
  const [requestVersion, setRequestVersion] = useState(0);
  const triggerRef = useRef(null);
  const wrapRef = useRef(null);

  const close = useCallback(() => {
    onClose();
    if (triggerRef.current) triggerRef.current.focus();
  }, [onClose]);
  const panelRef = usePopupFocus(open, close);
  const canViewAudit = can('audit.view');
  const resultKey = `${saccoId}:${canViewAudit}`;
  const currentResult = result && result.key === resultKey ? result : null;
  const loading = open && canViewAudit && saccoId != null && !currentResult;

  useEffect(() => {
    if (!open) return undefined;
    function onPointerDown(event) {
      if (wrapRef.current && !wrapRef.current.contains(event.target)) onClose();
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !canViewAudit || saccoId == null) return undefined;
    let active = true;
    listRecentAudit(saccoId)
      .then(items => {
        if (!active) return;
        setResult({ key: resultKey, entries: items, error: null });
      })
      .catch(error => {
        if (!active) return;
        setResult({ key: resultKey, entries: [], error: describe(error).text });
      });

    return () => { active = false; };
  }, [open, canViewAudit, saccoId, resultKey, requestVersion]);

  function retry() {
    setResult(null);
    setRequestVersion(version => version + 1);
  }

  function goToAudit(event) {
    event.preventDefault();
    close();
    navigate('/audit');
  }

  if (!open && !onToggle) return null;

  return (
    <div className="bell-wrap" ref={wrapRef}>
      <button
        ref={triggerRef}
        type="button"
        className="icon-btn"
        onClick={onToggle}
        aria-label="Notifications"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Icon name="bell" />
      </button>
      {open && (
        <div
          ref={panelRef}
          className="bell-menu"
          role="dialog"
          aria-label="Recent activity"
          tabIndex="-1"
        >
          <div className="bm-head flex items-center justify-between">
            <span>Recent activity</span>
            <button type="button" className="link-btn" onClick={close}>Close</button>
          </div>
          {loading && <p className="p-3 text-muted">Loading...</p>}
          {currentResult && currentResult.error && (
            <ErrorBanner onRetry={retry}>{currentResult.error}</ErrorBanner>
          )}
          {!loading && (!canViewAudit || saccoId == null || (currentResult && !currentResult.error && !currentResult.entries.length)) && (
            <p className="p-3 text-muted">Nothing new.</p>
          )}
          {currentResult && !currentResult.error && currentResult.entries.map(entry => (
            <a key={entry.id} href="/audit" onClick={goToAudit}>
              <strong>{entry.action || 'Recent activity'}</strong>
              <small>{[entry.target, entry.actor, entry.date || entry.created_at].filter(Boolean).join(' · ')}</small>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
