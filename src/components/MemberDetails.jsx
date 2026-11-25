import { useState } from 'react';
import { useSession } from '../lib/session.jsx';
import { useAsync } from '../lib/useAsync.js';
import { getProfile, saveProfile } from '../api/people.js';
import { describe } from '../lib/errors.js';
import { kesFromMinor, parseAmount, toMinor } from '../lib/format.js';
import ErrorBanner from './ErrorBanner.jsx';
import Field from './Field.jsx';

/* What an officer who manages members records: national ID (only after the member consented) and share capital. */
export default function MemberDetails({ membershipId }) {
  const { saccoId, toast } = useSession();
  const load = useAsync(() => getProfile(saccoId, membershipId), [saccoId, membershipId]);
  const [edit, setEdit] = useState({});
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const p = load.data;
  if (!p) return null;

  async function save(e) {
    e.preventDefault(); setBusy(true); setError(null);
    const body = {};
    if ('national_id' in edit) body.national_id = edit.national_id;
    if ('capital' in edit) body.share_capital = edit.capital === '' ? null : toMinor(parseAmount(edit.capital));
    try { await saveProfile(saccoId, membershipId, body); setEdit({}); toast('Member details saved'); load.reload(); }
    catch (err) { setError(describe(err, { context: 'profile' }).text); }
    finally { setBusy(false); }
  }

  return (
    <form className="neo-stack tight" onSubmit={save} aria-label="Member details">
      <b>Member details</b>
      {error && <ErrorBanner>{error}</ErrorBanner>}
      {p.consent
        ? <p className="muted text-sm">Name: {p.full_name || 'not given'}. Gender: {p.gender || 'not given'}. Born: {p.date_of_birth || 'not given'}.</p>
        : <p className="muted text-sm">This member has not agreed to NEXORA keeping their personal details, so a national ID cannot be saved yet.</p>}
      {p.consent && (
        <Field id="member-national-id" label="National ID (7 or 8 digits)">
          <input value={'national_id' in edit ? edit.national_id : p.national_id || ''} onChange={e => setEdit({ ...edit, national_id: e.target.value })} inputMode="numeric" maxLength={8} />
        </Field>
      )}
      <Field id="member-capital" label="Share capital (KES)">
        <input value={'capital' in edit ? edit.capital : p.share_capital == null ? '' : String(p.share_capital / 100)} onChange={e => setEdit({ ...edit, capital: e.target.value })} inputMode="decimal" />
      </Field>
      <div><button className="btn" type="submit" disabled={busy || !Object.keys(edit).length}>Save member details</button></div>
      {p.share_capital != null && <p className="muted text-sm">Recorded share capital: {kesFromMinor(p.share_capital)}.</p>}
    </form>
  );
}
