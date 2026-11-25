import { useEffect, useRef, useState } from 'react';
import { sendChat } from '../api/assistant.js';
import { useSession } from '../lib/session.jsx';

const MAX_MESSAGE = 500;
const MAX_HISTORY = 6;

/* Floating help bot. Everything is React state: nothing is stored. Keyed by the
 * signed-in person, so a logout or account switch remounts it and the next user
 * never sees the last chat (an answer still in flight lands on the old, unmounted one).
 * Messages are rendered as plain text nodes, never as HTML. */
export default function ChatWidget() {
  const { user } = useSession();
  const owner = user ? user.id : null;
  return <ChatPanel key={owner === null ? 'anonymous' : owner} owner={owner} />;
}

function ChatPanel({ owner }) {
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const button = useRef(null);
  const input = useRef(null);
  const end = useRef(null);

  useEffect(() => {
    if (open) input.current?.focus();
  }, [open]);

  useEffect(() => {
    end.current?.scrollIntoView?.({ block: 'end' });
  }, [turns, busy]);

  const close = () => {
    setOpen(false);
    button.current?.focus();
  };

  // On the document, not the panel: Send disables itself and focus falls to the page.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = event => {
      if (event.key === 'Escape' && !event.defaultPrevented) {
        setOpen(false);
        button.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  async function submit(event) {
    event.preventDefault();
    const message = draft.trim();
    if (!message || busy) return;
    const history = turns.slice(-MAX_HISTORY);
    setTurns(list => [...list, { role: 'user', text: message }]);
    setDraft('');
    setError('');
    setBusy(true);
    try {
      const { reply } = await sendChat(message, history);
      setTurns(list => [...list, { role: 'assistant', text: reply }]);
    } catch (failure) {
      setTurns(list => list.slice(0, -1)); // a question with no answer would leave two user turns in a row
      setError(failure.message || 'The assistant could not answer.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3">
      {open && (
        <section
          className="glass flex max-h-[70vh] w-[min(22rem,calc(100vw-2rem))] flex-col gap-2 p-3"
          role="dialog"
          aria-label="NEXORA assistant"
        >
          <header className="flex items-center justify-between gap-2">
            <h2 className="font-serif text-lg">Ask NEXORA</h2>
            <button className="link-btn" type="button" onClick={close}>Close</button>
          </header>
          <p className="text-muted text-xs">
            AI assistant: answers may be wrong. Do not type passwords, PINs or ID numbers.
            {owner ? ' It can see your own SACCOs and balances.' : ' Sign in to ask about your own account.'}
          </p>
          <ol className="flex min-h-24 flex-1 flex-col gap-2 overflow-y-auto" aria-live="polite">
            {turns.map((turn, index) => (
              <li
                key={index}
                className={`max-w-[85%] whitespace-pre-wrap rounded-xl px-3 py-2 text-sm ${
                  turn.role === 'user' ? 'self-end bg-[var(--teal)] text-white' : 'self-start bg-white/60'
                }`}
              >
                {turn.text}
              </li>
            ))}
            {busy && <li className="text-muted self-start text-sm">Thinking...</li>}
            <li ref={end} aria-hidden="true" />
          </ol>
          {error && <p className="text-sm" role="alert">{error}</p>}
          <form className="flex gap-2" onSubmit={submit}>
            <input
              ref={input}
              className="min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm"
              value={draft}
              maxLength={MAX_MESSAGE}
              onChange={event => setDraft(event.target.value)}
              placeholder="Ask a question"
              aria-label="Your question"
            />
            <button className="btn" type="submit" disabled={busy || !draft.trim()}>Send</button>
          </form>
        </section>
      )}
      <button
        ref={button}
        className="btn"
        type="button"
        aria-expanded={open}
        aria-label={open ? 'Close the assistant' : 'Open the assistant'}
        onClick={() => (open ? close() : setOpen(true))}
      >
        {open ? 'Close' : 'Ask NEXORA'}
      </button>
    </div>
  );
}
