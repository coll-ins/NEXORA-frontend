/*
 * session.jsx: the ONE thing every page talks to. Copy to frontend/src/lib/session.jsx. Same file for everyone.
 *
 * A page never imports the router, the shell or the API client's token code. It asks useSession() for what it needs:
 *
 *   const { perms, can, saccoId, user, navigate, toast, takeOpen } = useSession();
 *
 * Who provides it:
 *   - the real app: Ryan's <Shell> wraps every signed-in page in <SessionContext.Provider value={...}>
 *   - the dev harness (src/dev/Harness.jsx): wraps your page with a fake signed-in person, so you can build alone
 * Because both provide the same shape, a page that works in the harness works in the app.
 *
 * Shape of the value:
 *   user        { id, email, name, initials }
 *   role        'admin' | 'secretary' | 'finance' | 'loans' | 'member' | 'platform'   (for LABELS only, never for decisions)
 *   perms       string[]     permission names, e.g. 'loan.approve'
 *   can(p)      true if perms includes p
 *   saccoId     number | null   (null for a platform owner)
 *   sacco       { id, name, status } | null
 *   navigate(path, { open })  go to a page, e.g. navigate('/loans', { open: 'loan:2045' }). Paths have no SACCO prefix: the shell adds it.
 *   takeOpen(kind)            returns the id a link asked this page to open ('loan:2045' -> '2045') once, then clears it
 *   toast(text, kind?)        kind = 'err' for an error toast
 */
import { createContext, useContext } from 'react';

export const SessionContext = createContext(null);

export function useSession() {
  const s = useContext(SessionContext);
  if (!s) throw new Error('useSession() needs a <SessionContext.Provider>. Wrap the page in the Shell, or run it in the dev harness.');
  return s;
}
