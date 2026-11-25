import { dLong } from '../lib/format.js';

/* The SACCO's pay-in details as members read them. `updated_at` is when a second officer approved them. */
export default function PayInView({ details, showDate = true }) {
  const d = details;
  return (
    <div className="neo-stack">
      {d.mpesa_number && (
        <div>
          <b>M-Pesa {{ till: 'till (Buy Goods)', pochi: 'Pochi la Biashara' }[d.mpesa_type] || 'paybill'}</b>
          <p>Number <b>{d.mpesa_number}</b>{d.mpesa_type === 'paybill' && d.account_reference_hint ? <>, account: <b>{d.account_reference_hint}</b></> : null}</p>
          {d.display_name && <p className="muted text-sm">M-Pesa shows the name <b>{d.display_name}</b>. Stop if it shows a different name.</p>}
        </div>
      )}
      {d.bank_name && (
        <div>
          <b>Bank</b>
          <p>{d.bank_name}{d.bank_branch ? `, ${d.bank_branch} branch` : ''}. Account name <b>{d.bank_account_name}</b>, account number <b>{d.bank_account_number}</b>.</p>
          {d.bank_uses_shared_paybill && (
            <p className="muted text-sm">Bank paybill <b>{d.bank_paybill_number}</b>. <b>Manual confirm only:</b> these payments do not name the SACCO, so an officer confirms yours by hand against the bank statement.</p>
          )}
        </div>
      )}
      {showDate && d.updated_at && <p className="muted text-sm">Last changed on {dLong(d.updated_at)}</p>}
    </div>
  );
}
