import { useCallback, useRef, useState } from 'react';
import { menuFor } from '../lib/perms.js';
import { useSession } from '../lib/session.jsx';
import Icon from './Icon.jsx';
import usePopupFocus from './usePopupFocus.js';

export default function Palette({ open, onClose, triggerRef }) {
  const { perms, navigate } = useSession();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const itemRefs = useRef([]);

  const close = useCallback(() => {
    onClose();
    if (triggerRef.current) triggerRef.current.focus();
  }, [onClose, triggerRef]);
  const panelRef = usePopupFocus(open, close);
  const routes = menuFor(perms).filter(route => (
    `${route.title} ${route.path}`.toLowerCase().includes(query.trim().toLowerCase())
  ));

  function choose(route) {
    close();
    navigate('/' + route.path);
  }

  function onKeyDown(event) {
    const activeElement = document.activeElement;
    const activeItem = itemRefs.current.indexOf(activeElement);
    if (event.key === 'ArrowDown' && routes.length && (
      activeElement === inputRef.current || activeItem >= 0
    )) {
      event.preventDefault();
      const next = activeElement === inputRef.current
        ? 0
        : (selectedIndex + 1) % routes.length;
      setSelectedIndex(next);
      itemRefs.current[next].focus();
    } else if (event.key === 'ArrowUp' && routes.length && (
      activeElement === inputRef.current || activeItem >= 0
    )) {
      event.preventDefault();
      const next = activeElement === inputRef.current
        ? routes.length - 1
        : (selectedIndex - 1 + routes.length) % routes.length;
      setSelectedIndex(next);
      itemRefs.current[next].focus();
    } else if (event.key === 'Enter' && routes.length && activeElement === inputRef.current) {
      event.preventDefault();
      choose(routes[selectedIndex] || routes[0]);
    }
  }

  if (!open) return null;

  return (
    <div
      className="modal"
      onMouseDown={event => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div
        ref={panelRef}
        className="palette-card"
        role="dialog"
        aria-modal="true"
        aria-label="Search pages"
        tabIndex="-1"
        onKeyDown={onKeyDown}
      >
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={event => {
            setQuery(event.target.value);
            setSelectedIndex(0);
          }}
          placeholder="Search pages..."
          aria-label="Search pages"
          autoComplete="off"
        />
        <div className="pal-list" role="listbox" aria-label="Pages you can open">
          {routes.length
            ? routes.map((route, index) => (
              <button
                key={route.path}
                ref={element => { itemRefs.current[index] = element; }}
                type="button"
                className={`pal-item${selectedIndex === index ? ' bg-ink/8' : ''}`}
                role="option"
                aria-selected={selectedIndex === index}
                onMouseEnter={() => setSelectedIndex(index)}
                onClick={() => choose(route)}
              >
                <span className="flex items-center gap-3">
                  <Icon name={route.icon} />
                  <span>{route.title}</span>
                </span>
                <small>/{route.path}</small>
              </button>
            ))
            : <p className="p-4 text-muted">No matching pages.</p>}
        </div>
        <div className="flex justify-end p-2">
          <button type="button" className="link-btn" onClick={close}>Close</button>
        </div>
      </div>
    </div>
  );
}
