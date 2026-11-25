/*
 * Harness: runs YOUR pages alone, signed in as any role, with no API and no shell. Copy the whole dev/ folder to frontend/src/dev/.
 * Same files for everyone. You only ever add ONE file of your own: src/dev/registry.<yourname>.js (see registry.example.js).
 *
 * Open it with:   npm run dev   then go to   http://localhost:5173/dev.html
 *
 * What you can do in it:
 *   - pick a role at the top and see exactly what that person sees (the page list shows which pages that role may open)
 *   - pick SACCO "Suspended" to check the 423 page
 *   - click a page in the left list to open it
 *   - links between pages (navigate('/loans', { open: 'loan:2045' })) work, so you can test dashboard rows that open a record
 */
import { Component, useEffect, useMemo, useRef, useState } from 'react';
import { SessionContext } from '../lib/session.jsx';
import { ROLES, guardRoute, homeFor } from '../lib/perms.js';
import { LogoDefs } from '../components/Logo.jsx';
import ErrorPage from '../components/ErrorPage.jsx';
import { syncAppearance } from '../lib/appearance.js';
import { me, mySaccos } from '../mocks/data.js';

const modules = import.meta.glob('./registry.*.js', { eager: true });
// eslint-disable-next-line react-refresh/only-export-components
export const PAGES = Object.values(modules).flatMap(m => m.default || []);

class Boundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(e) { console.error('Page crashed:', e); }
  render() { return this.state.failed ? <ErrorPage code="500" onAction={() => this.setState({ failed: false })} /> : this.props.children; }
}

export default function Harness() {
  const [role, setRole] = useState('admin');
  const [suspended, setSuspended] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [path, setPath] = useState(() => (location.hash.slice(1) || (PAGES[0] && PAGES[0].path) || ''));
  const [toastMsg, setToast] = useState(null);
  const openRef = useRef('');
  const perms = ROLES[role].perms;
  const sacco = role === 'platform' ? null : { ...mySaccos[suspended ? 2 : 0] };

  const session = useMemo(() => ({
    user: { id: 'harness-' + role, email: me.email, name: me.name, initials: me.initials },   // one person per role, so each keeps their own look
    profilePhoto, setProfilePhoto,
    role, perms, can: p => perms.includes(p),
    saccoId: sacco ? sacco.id : null, sacco,
    navigate: (to, opts = {}) => { openRef.current = opts.open || ''; const p = to.replace(/^\//, ''); location.hash = p; setPath(p); },
    takeOpen: kind => { const o = openRef.current; if (o.startsWith(kind + ':')) { openRef.current = ''; return o.slice(kind.length + 1); } return null; },
    toast: (text, kind) => { setToast({ text, kind }); setTimeout(() => setToast(null), 2800); }
  }), [role, suspended, profilePhoto]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { syncAppearance(session.user.id); }, [session.user.id]);   // load THIS person's colours, font and text size

  const current = PAGES.find(p => p.path === path);
  const denied = current && guardRoute(perms, path);
  const blocked = suspended && sacco && path !== 'account' ? '423' : denied;
  const Page = current && current.Component;

  return (
    <SessionContext.Provider value={session}>
      <LogoDefs />
      <div className="mesh" aria-hidden="true"><div className="blob b1" /><div className="blob b2" /><div className="blob b3" /></div>
      <div style={{ padding: '1rem', display: 'grid', gap: '1rem' }}>
        <div className="glass" style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <b className="serif">Dev harness</b>
          <label>Signed in as&nbsp;
            <select value={role} onChange={e => setRole(e.target.value)}>
              {Object.entries(ROLES).map(([k, r]) => <option key={k} value={k}>{r.label}</option>)}
            </select>
          </label>
          <label>SACCO&nbsp;
            <select value={suspended ? 'suspended' : 'active'} onChange={e => setSuspended(e.target.value === 'suspended')}>
              <option value="active">Alpha SACCO (active)</option><option value="suspended">Gamma SACCO (suspended)</option>
            </select>
          </label>
          <span className="muted">Start page for this role: <b>{homeFor(perms)}</b></span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(11rem, 14rem) minmax(0, 1fr)', gap: '1rem', alignItems: 'start' }}>
          <nav className="glass" aria-label="Pages in the harness" style={{ display: 'grid', gap: '.3rem' }}>
            {PAGES.length === 0 && <span className="muted">No pages yet. Add src/dev/registry.&lt;yourname&gt;.js (see registry.example.js).</span>}
            {PAGES.map(p => {
              const no = guardRoute(perms, p.path);
              return <button key={p.path} type="button" className={`chip pick`} aria-pressed={p.path === path} onClick={() => { location.hash = p.path; setPath(p.path); }} title={no ? 'This role cannot open this page' : ''} style={{ justifyContent: 'space-between', opacity: no ? .5 : 1 }}>{p.title}{no ? ' (no access)' : ''}</button>;
            })}
          </nav>
          <main style={{ minWidth: 0 }}>
            {!current ? <ErrorPage code="404" onAction={() => {}} />
              : blocked ? <ErrorPage code={blocked} onAction={() => {}} />
              // eslint-disable-next-line react-hooks/static-components
              : <Boundary key={path + role}><Page /></Boundary>}
          </main>
        </div>
      </div>
      <div className={`toast${toastMsg ? ' show' : ''}${toastMsg && toastMsg.kind === 'err' ? ' err' : ''}`} role="status">{toastMsg ? toastMsg.text : ''}</div>
    </SessionContext.Provider>
  );
}
