/*
 * useAsync: load something and always know which of four states the page is in. Same file for everyone.
 *
 *   const { status, data, error, reload } = useAsync(() => listLoans(saccoId), [saccoId]);
 *   if (status === 'loading') return <Loading />;
 *   if (status === 'error')   return <ErrorBanner onRetry={reload}>{describe(error, { mode: 'page' }).text}</ErrorBanner>;
 *   if (status === 'empty')   return <Empty title="No loans are waiting for a decision." />;
 *   return <List items={data} />;
 *
 * `empty` means the request worked and returned nothing (an empty array, or an object whose first array is empty).
 * Pass { isEmpty: d => ... } when your data has another shape.
 */
import { useCallback, useEffect, useState } from 'react';

const defaultEmpty = d => {
  if (Array.isArray(d)) return d.length === 0;
  if (d && typeof d === 'object') { const a = Object.values(d).find(Array.isArray); return a ? a.length === 0 : false; }
  return d == null;
};

export function useAsync(fn, deps = [], { isEmpty = defaultEmpty } = {}) {
  const [state, set] = useState({ status: 'loading', data: null, error: null });
  const run = useCallback(() => {
    let live = true;
    set(s => ({ status: 'loading', data: s.data, error: null }));
    Promise.resolve().then(fn).then(
      data => { if (live) set({ status: isEmpty(data) ? 'empty' : 'ready', data, error: null }); },
      error => { if (live) set({ status: 'error', data: null, error }); }
    );
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/use-memo
  }, deps);
  useEffect(run, [run]);
  return { ...state, reload: run };
}
