import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import Icon from '../shell/Icon.jsx';

/*
 * Select: the website's own dropdown, the same cream panel as the SACCO switcher,
 * instead of the browser's grey list. Options are [{ value, label }]; the value
 * is handed back directly, so onChange takes the next value, not an event.
 *
 * Focus stays on the trigger (a combobox): ArrowDown / ArrowUp open it on the
 * current option and move the highlight, Home / End jump, Enter or Space picks,
 * Escape closes, and Tab leaves the field normally. The panel closes when focus
 * or a click goes elsewhere.
 */
export default function Select({
  id,
  value,
  options = [],
  onChange,
  disabled = false,
  className = '',
  'aria-invalid': invalid,
  'aria-describedby': describedBy,
}) {
  const autoId = useId();
  const listId = `${id || autoId}-list`;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [up, setUp] = useState(false);
  const [maxHeight, setMaxHeight] = useState(null);
  const wrapRef = useRef(null);
  const triggerRef = useRef(null);
  const listRef = useRef(null);

  const selectedIndex = options.findIndex(option => String(option.value) === String(value));
  const current = options[selectedIndex >= 0 ? selectedIndex : 0];

  function show(startAt) {
    setActive(Math.min(Math.max(startAt, 0), options.length - 1));
    setOpen(true);
  }

  function close(refocus) {
    setOpen(false);
    setUp(false);
    setMaxHeight(null);
    if (refocus && triggerRef.current) triggerRef.current.focus();
  }

  function choose(index) {
    const option = options[index];
    if (!option) return;
    close(true);
    if (String(option.value) !== String(value)) onChange(option.value);
  }

  useEffect(() => {
    if (!open) return undefined;
    const wrap = wrapRef.current;
    function onPointerDown(event) {
      if (wrap && !wrap.contains(event.target)) close(false);
    }
    // Tabbing to the next field closes the panel; focus keeps going where it was
    // headed because it never left the trigger.
    function onFocusOut(event) {
      if (wrap && !wrap.contains(event.relatedTarget)) close(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    if (wrap) wrap.addEventListener('focusout', onFocusOut);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      if (wrap) wrap.removeEventListener('focusout', onFocusOut);
    };
  }, [open]);

  // Place the panel from its real height, measured before the browser paints: on a
  // phone it opens upwards when there is more room above than below, and it is
  // capped to the room on that side so it fits a short screen too.
  useLayoutEffect(() => {
    if (!open) return;
    const list = listRef.current;
    const trigger = triggerRef.current;
    if (!list || !trigger) return;
    const height = list.getBoundingClientRect().height;
    const triggerBox = trigger.getBoundingClientRect();
    const below = window.innerHeight - triggerBox.bottom - 8;
    const above = triggerBox.top - 8;
    const placeUp = height > below && above > below;
    const room = Math.max(placeUp ? above : below, 0);
    setUp(placeUp);
    setMaxHeight(height > room ? Math.floor(room) : null);
  }, [open]);

  // Keep the highlighted option in view in a long list.
  useEffect(() => {
    if (!open || !listRef.current) return;
    const node = listRef.current.querySelector('.select-option.active');
    if (node) node.scrollIntoView({ block: 'nearest' });
  }, [open, active]);


  function onKeyDown(event) {
    if (event.key === 'Escape') {
      if (!open) return;
      event.preventDefault();
      close(true);
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) {
        show(selectedIndex >= 0 ? selectedIndex : 0);
        return;
      }
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setActive(previous => Math.min(Math.max(previous + step, 0), options.length - 1));
      return;
    }
    if (!open) return;
    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      setActive(event.key === 'Home' ? 0 : options.length - 1);
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      choose(active);
    }
  }

  return (
    <div
      className={`select${className ? ` ${className}` : ''}`}
      ref={wrapRef}
      onKeyDown={onKeyDown}
    >
      <button
        ref={triggerRef}
        id={id}
        type="button"
        className="select-trigger"
        disabled={disabled}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open ? `${listId}-${active}` : undefined}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        onClick={() => (open ? close(true) : show(selectedIndex >= 0 ? selectedIndex : 0))}
      >
        <span className="truncate">{current ? current.label : ''}</span>
        <Icon name="chevron" className="select-arrow size-4 shrink-0" />
      </button>
      {open && (
        <div
          ref={listRef}
          id={listId}
          className={`select-menu${up ? ' up' : ''}`}
          role="listbox"
          aria-labelledby={id}
          style={maxHeight ? { maxHeight: `${maxHeight}px` } : undefined}
        >
          {options.map((option, index) => (
            <button
              key={String(option.value)}
              id={`${listId}-${index}`}
              type="button"
              role="option"
              tabIndex="-1"
              aria-selected={String(option.value) === String(value)}
              className={`select-option${index === active ? ' active' : ''}`}
              onMouseDown={event => event.preventDefault()}
              onMouseEnter={() => setActive(index)}
              onClick={() => choose(index)}
            >
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
