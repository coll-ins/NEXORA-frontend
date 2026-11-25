import { useState } from 'react';
import { useSession } from '../lib/session.jsx';
import { useAsync } from '../lib/useAsync.js';
import { getDarajaSettings, saveDarajaSettings } from '../api/people.js';
import { describe } from '../lib/errors.js';
import ErrorBanner from './ErrorBanner.jsx';
import Field from './Field.jsx';

const BLANK = { shortcode: '', consumer_key: '', consumer_secret: '', passkey: '' };

/* The SACCO's own M-Pesa prompt (STK push) credentials, sandbox only. Saved encrypted; never shown again. */
export default function DarajaCard() {
  const { saccoId, can, toast } = useSession();
  const load = useAsync(() => (can('sacco.update') ? getDarajaSettings(saccoId) : Promise.resolve(null)), [saccoId]);
  const [form, setForm] = useState(BLANK);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  if (!load.data) return null;

  async function save(e) {
    e.preventDefault(); setBusy(true); setError(null);
    try { await saveDarajaSettings(saccoId, form); setForm(BLANK); toast('M-Pesa credentials saved'); load.reload(); }
    catch (err) { setError(describe(err, { context: 'settings' }).text); }
    finally { setBusy(false); }
  }
  const set = key => ({ id: `daraja-${key}`, value: form[key], onChange: e => setForm({ ...form, [key]: e.target.value }), autoComplete: 'off', required: true });

  return (
    <form className="neo-stack tight" onSubmit={save} aria-label="M-Pesa prompts">
      <b>M-Pesa prompts (sandbox)</b>
      <p className="muted text-sm">
        Your SACCO's own Daraja shortcode and credentials, so members can be prompted on their phones. NEXORA holds no money: it only records the answer, and an officer still confirms each deposit.
        {load.data.configured ? ` Saved for shortcode ${load.data.shortcode}. Saving again replaces them.` : ' Not set yet.'}
      </p>
      {error && <ErrorBanner>{error}</ErrorBanner>}
      <Field id="daraja-shortcode" label="Shortcode (paybill, or head-office number for a till)"><input {...set('shortcode')} inputMode="numeric" maxLength={7} /></Field>
      <Field id="daraja-consumer_key" label="Consumer key"><input {...set('consumer_key')} type="password" /></Field>
      <Field id="daraja-consumer_secret" label="Consumer secret"><input {...set('consumer_secret')} type="password" /></Field>
      <Field id="daraja-passkey" label="Passkey"><input {...set('passkey')} type="password" /></Field>
      <div><button className="btn" type="submit" disabled={busy}>Save M-Pesa credentials</button></div>
    </form>
  );
}
