import '../../styles/neo.css';
import { useState } from 'react';
import { useSession } from '../../lib/session.jsx';
import { useAsync } from '../../lib/useAsync.js';
import { getSettings, renameSacco } from '../../api/people.js';
import ErrorBanner from '../../components/ErrorBanner.jsx';
import DarajaCard from '../../components/DarajaCard.jsx';
import Field from '../../components/Field.jsx';
import { Body } from './shared.jsx';
import { describe } from '../../lib/errors.js';

export default function SettingsPage() {
  const { saccoId, sacco, can, toast } = useSession();
  const settings = useAsync(() => getSettings(saccoId), [saccoId]);
  const [name, setName] = useState('');
  const [fieldError, setFieldError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  const currentName = name || (sacco ? sacco.name : '');

  async function save(event) {
    event.preventDefault();
    if (!currentName.trim()) {
      setFieldError('Give the SACCO a name.');
      return;
    }
    setFieldError(null);
    setNotice(null);
    setBusy(true);
    try {
      await renameSacco(saccoId, currentName.trim());
      setSaved(true);
      toast('SACCO settings saved');
    } catch (e) {
      const shown = describe(e, { context: 'settings' });
      if (e.status === 400 || e.status === 409) setFieldError(shown.text);
      else setNotice(shown.text);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="glass neo-stack loose">
      <div>
        <h2 className="font-serif text-xl">SACCO settings</h2>
        <p className="muted text-sm">The SACCO's name, and the loan rules it runs on.</p>
      </div>

      {saved && <ErrorBanner kind="ok">Your changes were saved.</ErrorBanner>}
      {notice && <ErrorBanner>{notice}</ErrorBanner>}

      <form className="neo-stack" onSubmit={save}>
        <Field id="sacco-name" label="SACCO name" error={fieldError}>
          <input
            id="sacco-name"
            value={currentName}
            onChange={e => { setName(e.target.value); setSaved(false); }}
            disabled={busy || !can('sacco.update')}
          />
        </Field>
        <div>
          <button type="submit" className="btn" disabled={busy || !can('sacco.update')}>
            {busy ? 'Saving…' : 'Save name'}
          </button>
        </div>
      </form>

      <DarajaCard />

      <Body
        status={settings.status}
        error={settings.error}
        reload={settings.reload}
        emptyTitle="No settings yet."
        emptyHint="This SACCO uses the defaults."
      >
        {settings.data && (
          <div className="neo-stack tight">
            <b>Loan rules</b>
            <div className="kv">
              <div>
                <span>Loan cap</span>
                <b>{settings.data.loan_cap === 0 ? 'No cap' : settings.data.loan_cap}</b>
              </div>
              <div>
                <span>Savings multiple</span>
                <b>{settings.data.savings_multiple}× savings</b>
              </div>
              <div>
                <span>Approvals needed</span>
                <b>{settings.data.required_approvals}</b>
              </div>
              <div>
                <span>Join code lasts</span>
                <b>{settings.data.join_code_ttl_minutes} minutes</b>
              </div>
            </div>
            <p className="muted text-sm">
              Only the platform owner changes the loan rules. Ask them if one of these is wrong.
            </p>
          </div>
        )}
      </Body>
    </section>
  );
}
