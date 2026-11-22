/* Shell: fixed sidebar + sticky top bar + scrolling content, plus the phone/tablet drawer (R2).
 * Under 64rem the stylesheet slides .side off screen; `open` on .app slides it in and shows .scrim.
 * The router (R3) passes `path` and the page as children.
 * LogoDefs is NOT rendered here: render it once in App.jsx (the harness already does). */
import { useEffect, useRef, useState } from 'react';
import { useSession } from '../lib/session.jsx';
import { menuFor } from '../lib/perms.js';
import { Logo } from '../components/Logo.jsx';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';
import Bell from './Bell.jsx';

export default function Shell({ path, title, children, ...topbarActions }) {
  const { perms } = useSession();
  const current = menuFor(perms).find(r => r.path === path);
  const [open, setOpen] = useState(false);
  const [mobileBellOpen, setMobileBellOpen] = useState(false);
  const btnRef = useRef(null);
  const wasOpen = useRef(false);

  // Esc closes; Tab stays inside the drawer while it is open.
  useEffect(() => {
    if (!open) return undefined;
    function onKey(e) {
      if (e.key === 'Escape') {
        setOpen(false);
        return;
      }
      if (e.key !== 'Tab') return;
      const items = document.querySelectorAll('.side a, .side button');
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  // Focus moves into the drawer on open and back to the menu button on close.
  useEffect(() => {
    if (open) {
      wasOpen.current = true;
      const first = document.querySelector('.side .side-nav a');
      if (first) first.focus();
    } else if (wasOpen.current) {
      wasOpen.current = false;
      if (btnRef.current) btnRef.current.focus();
    }
  }, [open]);

  // Clicking a menu item or the logo closes the drawer.
  function onClickCapture(e) {
    if (open && e.target.closest('.side-nav a, .brand')) setOpen(false);
  }

  return (
    <div className={open ? 'app on open' : 'app on'} onClickCapture={onClickCapture}>
      <div className="mbar">
        <button
          type="button"
          className="menu-btn"
          ref={btnRef}
          onClick={() => setOpen(o => !o)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          <svg className="ic" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="grid size-9 shrink-0 place-items-center" aria-hidden="true">
          <Logo className="mark size-8" />
        </span>
        <span className="min-w-0 flex-1 truncate font-semibold">{title || (current ? current.title : '')}</span>
        <Bell
          open={mobileBellOpen}
          onToggle={() => setMobileBellOpen(value => !value)}
          onClose={() => setMobileBellOpen(false)}
        />
      </div>
      <div className="scrim" onClick={() => setOpen(false)} aria-hidden="true" />
      <Sidebar path={path} />
      <div className="content">
        <Topbar title={title || (current ? current.title : '')} {...topbarActions} />
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
