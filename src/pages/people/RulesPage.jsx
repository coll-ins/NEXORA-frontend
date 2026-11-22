import '../../styles/neo.css';
import { useState } from 'react';
import { useSession } from '../../lib/session.jsx';
import { useAsync } from '../../lib/useAsync.js';
import {
  acceptRules, getRules, listProposals, proposeRules, publishRules, voteOnProposal,
} from '../../api/rules.js';
import ErrorBanner from '../../components/ErrorBanner.jsx';
import RulesForm from '../../components/RulesForm.jsx';
import RulesView from '../../components/RulesView.jsx';
import { describe } from '../../lib/errors.js';
import { checkRules, emptyRules, rulesBody, rulesToForm } from '../../lib/rules.js';
import { Body } from './shared.jsx';

const never = () => false;

export default function RulesPage() {
  const { saccoId, can, toast } = useSession();
  const rules = useAsync(() => getRules(saccoId), [saccoId], { isEmpty: never });
  const proposals = useAsync(() => listProposals(saccoId), [saccoId], { isEmpty: never });
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(false);

  async function run(action, done) {
    setNotice(null);
    setBusy(true);
    try {
      await action();
      toast(done);
      rules.reload();
      proposals.reload();
    } catch (e) {
      if (e.fields) setErrors(e.fields);
      setNotice(e.status === 403 && e.message ? e.message : describe(e).text);
    } finally {
      setBusy(false);
    }
  }

  function send(save, done) {
    const found = checkRules(form);
    setErrors(found);
    if (Object.keys(found).length) return;
    run(async () => { await save(saccoId, rulesBody(form)); setForm(null); }, done);
  }

  const current = rules.data;
  const open = (proposals.data || []).find(p => p.status === 'open');
  const canChange = can('sacco.update');

  return (
    <section className="glass neo-stack loose">
      <div>
        <h2 className="font-serif text-xl">SACCO rules</h2>
        <p className="muted text-sm">What this SACCO agreed. Read all of it before you accept.</p>
      </div>
      {notice && <ErrorBanner>{notice}</ErrorBanner>}
      <Body status={rules.status} error={rules.error} reload={rules.reload}>
        {!current && (
          <>
            <p>This SACCO has not published its rules yet.</p>
            {canChange && !form && <button type="button" className="btn" onClick={() => setForm(emptyRules())}>Set the rules</button>}
            {form && (
              <form className="neo-stack" noValidate onSubmit={event => { event.preventDefault(); send(publishRules, 'Rules published'); }}>
                <RulesForm value={form} onChange={value => { setForm(value); setErrors({}); }} errors={errors} disabled={busy} />
                <div><button className="btn" type="submit" disabled={busy}>Publish the rules</button></div>
              </form>
            )}
          </>
        )}
        {current && (
          <>
            <RulesView rules={current} />
            {current.accepted === true && <ErrorBanner kind="ok">You accepted version {current.version}.</ErrorBanner>}
            {current.accepted === false && (
              <div className="neo-stack">
                <ErrorBanner kind="info">You have not accepted these rules yet. You cannot ask for a loan until you do.</ErrorBanner>
                <div>
                  <button type="button" className="btn" disabled={busy} onClick={() => run(() => acceptRules(saccoId, current.version), 'Rules accepted')}>
                    I have read all the rules and accept them
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </Body>

      {open && (
        <div className="neo-stack">
          <h3 className="font-serif text-lg">A change is up for a vote</h3>
          <RulesView rules={open.fields} />
          <p className="muted text-sm">{open.approvals} for, {open.rejections} against. It passes when more than half of all members approve.</p>
          {current && current.accepted !== null && (
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn small" disabled={busy} onClick={() => run(() => voteOnProposal(saccoId, open.id, true), 'Vote saved')}>Approve</button>
              <button type="button" className="btn small ghost" disabled={busy} onClick={() => run(() => voteOnProposal(saccoId, open.id, false), 'Vote saved')}>Reject</button>
              {open.my_vote !== null && <span className="muted text-sm">You voted {open.my_vote ? 'to approve' : 'to reject'}.</span>}
            </div>
          )}
        </div>
      )}

      {current && canChange && !open && (
        current.locked ? (
          <p className="muted text-sm">Rules cannot be changed until the cycle ends. To change them after that, propose the change here and the members vote.</p>
        ) : (
          <div className="neo-stack">
            {!form && <button type="button" className="btn ghost" onClick={() => setForm(rulesToForm(current))}>Propose a change</button>}
            {form && (
              <form className="neo-stack" noValidate onSubmit={event => { event.preventDefault(); send(proposeRules, 'Change proposed'); }}>
                <RulesForm value={form} onChange={value => { setForm(value); setErrors({}); }} errors={errors} disabled={busy} />
                <div><button className="btn" type="submit" disabled={busy}>Send to a vote</button></div>
              </form>
            )}
          </div>
        )
      )}
    </section>
  );
}
