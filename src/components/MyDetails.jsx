import { useState } from 'react';
import { useSession } from '../lib/session.jsx';
import { useAsync } from '../lib/useAsync.js';
import { getConsent, giveConsent, withdrawConsent, getProfile, saveProfile } from '../api/people.js';
import { describe } from '../lib/errors.js';
import ErrorBanner from './ErrorBanner.jsx';
import Field from './Field.jsx';
import Select from './Select.jsx';

/* A member's own personal details. They are kept only with the member's consent and erased when it is withdrawn. */
export default function MyDetails() {
  const { saccoId, sacco, toast } = useSession();
  const mid = sacco && sacco.membership_id;
  const load = useAsync(() => (mid ? Promise.all([getConsent(saccoId), getProfile(saccoId, mid)]) : Promise.resolve(null)), [saccoId, mid]);
  const [edit, setEdit] = useState({});
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  if (!mid || !load.data) return null;
  const [{ notice, consent }, profile] = load.data;
  const value = k => (k in edit ? edit[k] : profile[k] || '');

  async function run(action, message) {
    setBusy(true); setError(null);
    try { await action(); setEdit({}); toast(message); load.reload(); }
    catch (e) { setError(describe(e, { context: 'profile' }).text); }
    finally { setBusy(false); }
  }

  return (
    <section className="glass flex flex-col gap-3 p-6" aria-labelledby="my-details-h">
      <h2 id="my-details-h" className="font-serif">My details</h2>
      <p className="text-muted">{notice.text}</p>
      {error && <ErrorBanner>{error}</ErrorBanner>}
      {!consent ? (
        <div><button type="button" className="btn" disabled={busy} onClick={() => run(() => giveConsent(saccoId, notice.version), 'Thank you. You can add your details now')}>I agree to NEXORA keeping my details</button></div>
      ) : (
        <>
          <ErrorBanner kind="ok">You agreed to this on {new Date(consent.granted_at).toLocaleDateString()}.</ErrorBanner>
          <form className="flex flex-col gap-3" onSubmit={e => { e.preventDefault(); run(() => saveProfile(saccoId, mid, { full_name: value('full_name'), gender: value('gender'), date_of_birth: value('date_of_birth') }), 'Details saved'); }}>
            <Field id="my-full-name" label="Full name"><input value={value('full_name')} onChange={e => setEdit({ ...edit, full_name: e.target.value })} maxLength={120} /></Field>
            <Field id="my-gender" label="Gender">
              <Select
                id="my-gender"
                value={value('gender')}
                onChange={gender => setEdit({ ...edit, gender })}
                options={[
                  { value: '', label: 'Prefer not to say' },
                  { value: 'female', label: 'Female' },
                  { value: 'male', label: 'Male' },
                  { value: 'other', label: 'Other' },
                ]}
              />
            </Field>
            <Field id="my-dob" label="Date of birth"><input type="date" value={value('date_of_birth')} onChange={e => setEdit({ ...edit, date_of_birth: e.target.value })} /></Field>
            <div className="flex gap-2">
              <button className="btn" type="submit" disabled={busy}>Save my details</button>
              <button className="btn warn" type="button" disabled={busy} onClick={() => run(() => withdrawConsent(saccoId), 'Consent withdrawn. Your details were deleted')}>Withdraw my consent and delete these details</button>
            </div>
          </form>
        </>
      )}
    </section>
  );
}
