import { useEffect, useRef } from 'react';

/*
 * PhotoViewer: a dialog that shows one photo large.
 * Props: photo (url or null), name (text), onClose (function), onPick (function(file)).
 * Esc and a click outside the box close it. The photo stays on this device only.
 */
export default function PhotoViewer({ photo, name, onClose, onPick }) {
  const closeRef = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => {
    const opener = document.activeElement;
    if (closeRef.current) closeRef.current.focus();
    function onKey(event) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      if (opener && typeof opener.focus === 'function') opener.focus();
    };
  }, [onClose]);

  function choose(event) {
    const file = event.target.files && event.target.files[0];
    if (file && onPick) onPick(file);
    event.target.value = '';
  }

  return (
    <div
      className="fixed inset-0 z-70 flex items-center justify-center bg-ink/60 p-4"
      onMouseDown={event => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="glass flex w-full max-w-lg flex-col gap-4 p-6"
        role="dialog"
        aria-modal="true"
        aria-label="Profile photo"
      >
        <h2 className="font-serif">{name || 'Your photo'}</h2>
        {photo ? (
          <img
            className="mx-auto max-h-80 w-full rounded-xl object-contain"
            src={photo}
            alt={name ? 'Photo of ' + name : 'Your photo'}
          />
        ) : (
          <p className="text-muted">No photo yet. Choose one from this device.</p>
        )}
        <p className="text-muted">The photo stays on this device only. Nobody else sees it.</p>
        <div className="flex flex-wrap gap-3">
          <button className="btn" type="button" onClick={() => fileRef.current && fileRef.current.click()}>
            {photo ? 'Choose another photo' : 'Choose a photo'}
          </button>
          <button className="link-btn" type="button" ref={closeRef} onClick={onClose}>Close</button>
        </div>
        <input
          ref={fileRef}
          className="sr-only"
          type="file"
          accept="image/*"
          aria-label="Choose a photo from this device"
          onChange={choose}
        />
      </div>
    </div>
  );
}