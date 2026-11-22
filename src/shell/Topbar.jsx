/* Top bar: page title, search, bell and SACCO switcher. */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSession } from '../lib/session.jsx';
import Bell from './Bell.jsx';
import Icon from './Icon.jsx';
import Palette from './Palette.jsx';
import SaccoSwitcher from './SaccoSwitcher.jsx';

export default function Topbar({ title }) {
  const { switchSacco, panelRequest, clearPanelRequest } = useSession();
  const [localPanel, setLocalPanel] = useState(null);
  const searchRef = useRef(null);
  const openPanel = panelRequest === 'sacco:switcher' ? 'switcher' : localPanel;

  const closePanel = useCallback(() => {
    setLocalPanel(null);
    clearPanelRequest();
  }, [clearPanelRequest]);
  const togglePanel = useCallback(panel => {
    const activePanel = panelRequest === 'sacco:switcher' ? 'switcher' : localPanel;
    clearPanelRequest();
    setLocalPanel(activePanel === panel ? null : panel);
  }, [panelRequest, localPanel, clearPanelRequest]);

  useEffect(() => {
    function onKeyDown(event) {
      const target = event.target;
      const editing = target && (
        target.isContentEditable
        || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
      );
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k' && !editing) {
        event.preventDefault();
        clearPanelRequest();
        setLocalPanel('palette');
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [clearPanelRequest]);

  return (
    <header className="topbar glass">
      {/* On a phone the title has no room beside search, bell and the SACCO
        * switcher: it collapsed to a letter-wide column and wrapped word by
        * word. Every page repeats its heading in the card below, so the bar
        * drops it under 640px instead of squeezing it. */}
      <h1 className="page-title hidden min-w-0 flex-1 truncate sm:block">{title}</h1>

      <button
        ref={searchRef}
        type="button"
        className="switcher"
        onClick={() => togglePanel('palette')}
        aria-label="Search"
        aria-expanded={openPanel === 'palette'}
        aria-haspopup="dialog"
      >
        <Icon name="search" className="size-4 shrink-0" />
        <span className="hidden md:inline">Search</span>
        <span className="hidden lg:inline"><kbd className="kbd">Ctrl K</kbd></span>
      </button>

      <Bell
        open={openPanel === 'bell'}
        onToggle={() => togglePanel('bell')}
        onClose={closePanel}
      />

      <SaccoSwitcher
        open={openPanel === 'switcher'}
        onToggle={() => togglePanel('switcher')}
        onClose={closePanel}
        onSelect={switchSacco}
      />

      {openPanel === 'palette' && (
        <Palette
          open
          onClose={closePanel}
          triggerRef={searchRef}
        />
      )}
    </header>
  );
}