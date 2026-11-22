/* Sidebar. Uses the shared classes from nexora.css: .side .side-top .side-nav .profile .avatar.
 * .side is fixed and stays in view; on a short window the menu fades and scrolls inside it (nexora-2.css).
 * Under 64rem the stylesheet slides it off screen; R2 opens it as a drawer. */
import { useSession } from '../lib/session.jsx';
import { ROLES, homeFor, menuFor } from '../lib/perms.js';
import { Logo } from '../components/Logo.jsx';
import Icon from './Icon.jsx';

function go(e, navigate, to) {
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return; // let "open in new tab" work
  e.preventDefault();
  navigate(to);
}

export default function Sidebar({ path }) {
  const { perms, role, user, navigate } = useSession();
  const items = menuFor(perms);
  const home = '/' + homeFor(perms);

  return (
    <aside className="side glass" aria-label="Sidebar">
      <div className="side-top">
        <a className="brand" href={home} aria-label="NEXORA home" onClick={e => go(e, navigate, home)}>
          <Logo className="mark" />
          <span className="brand-text">NEXORA</span>
        </a>
      </div>

      <nav className="side-nav" aria-label="Main menu">
        {items.map(r => (
          <a
            key={r.path}
            href={'/' + r.path}
            aria-current={r.path === path ? 'page' : undefined}
            onClick={e => go(e, navigate, '/' + r.path)}
          >
            <Icon name={r.icon} />
            <span>{r.title}</span>
          </a>
        ))}
      </nav>

      <a
        className="profile glass"
        href="/account"
        aria-label="Account settings"
        aria-current={path === 'account' ? 'page' : undefined}
        onClick={e => go(e, navigate, '/account')}
      >
        <div className="profile-top">
          <span className="avatar" aria-hidden="true">{user.initials}</span>
          <div className="min-w-0">
            <div className="profile-name truncate">{user.name}</div>
            <div className="profile-meta truncate">{(ROLES[role] && ROLES[role].label) || role}</div>
          </div>
        </div>
      </a>
    </aside>
  );
}