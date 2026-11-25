import Field from './Field.jsx';
import Select from './Select.jsx';

const Hint = ({ children }) => <p className="muted text-sm">{children}</p>;

/* The SACCO pay-in form. `value` is the object from emptyPayIn(); `errors` holds a plain-words
 * reason per API field name. Every field says its format and an example. */
export default function PayInForm({ value, onChange, errors = {}, disabled = false }) {
  const set = key => event => onChange({ ...value, [key]: event.target.value });
  const input = (key, extra = {}) => ({ value: value[key], onChange: set(key), disabled, ...extra });
  return (
    <div className="neo-stack">
      <b>M-Pesa</b>
      <p className="muted text-sm">Leave the number empty if the SACCO takes no M-Pesa payments.</p>
      <Field id="payin-type" label="M-Pesa type" error={errors.mpesa_type}>
        <Select
          id="payin-type"
          value={value.mpesaType}
          disabled={disabled}
          onChange={mpesaType => onChange({ ...value, mpesaType })}
          options={[
            { value: 'paybill', label: 'Paybill' },
            { value: 'till', label: 'Till (Buy Goods)' },
            { value: 'pochi', label: 'Pochi la Biashara (phone number, shown only)' },
          ]}
        />
      </Field>
      <Field id="payin-number" label="Paybill, till or Pochi number" error={errors.mpesa_number}>
        <input {...input('mpesaNumber', { inputMode: 'numeric', placeholder: '400200', maxLength: 16 })} />
      </Field>
      <Hint>Paybill or till: 5 to 7 digits, no spaces or letters. Example: 400200. Pochi la Biashara: the Safaricom phone number. Example: 0712345678. Members are shown a Pochi number but never prompted for it.</Hint>
      <Field id="payin-name" label="Name members will see" error={errors.display_name}>
        <input {...input('displayName', { maxLength: 60, placeholder: 'Umoja SACCO Savings' })} />
      </Field>
      <Hint>Required with M-Pesa. The business name M-Pesa shows, so members can check it before paying. Up to 60 characters.</Hint>
      {value.mpesaType === 'paybill' && (
        <>
          <Field id="payin-reference" label="Account number hint" error={errors.account_reference_hint}>
            <input {...input('reference', { maxLength: 60, placeholder: 'your member number' })} />
          </Field>
          <Hint>Optional. What members type as the account number. Example: your member number. A till has no account number.</Hint>
        </>
      )}

      <b>Bank</b>
      <p className="muted text-sm">Leave all bank fields empty if the SACCO takes no bank payments.</p>
      <Field id="payin-bank" label="Bank name" error={errors.bank_name}>
        <input {...input('bankName', { maxLength: 60, placeholder: 'Equity Bank' })} />
      </Field>
      <Field id="payin-bank-account-name" label="Name on the account" error={errors.bank_account_name}>
        <input {...input('bankAccountName', { maxLength: 80, placeholder: 'Umoja SACCO' })} />
      </Field>
      <Field id="payin-bank-account" label="Account number" error={errors.bank_account_number}>
        <input {...input('bankAccountNumber', { inputMode: 'numeric', placeholder: '0123456789', maxLength: 20 })} />
      </Field>
      <Hint>6 to 20 digits, no spaces or dashes. Example: 0123456789.</Hint>
      <Field id="payin-bank-branch" label="Branch (optional)" error={errors.bank_branch}>
        <input {...input('bankBranch', { maxLength: 60, placeholder: 'Kitale' })} />
      </Field>

      <label className="flex items-center gap-2">
        <input
          type="checkbox" checked={value.sharedPaybill} disabled={disabled}
          onChange={event => onChange({ ...value, sharedPaybill: event.target.checked })}
        />
        <span>The bank takes payments through its shared paybill</span>
      </label>
      {errors.bank_uses_shared_paybill && <div className="field-msg" role="alert">{errors.bank_uses_shared_paybill}</div>}
      <Hint>Tick this if members pay the bank by paybill. Those payments do not name the SACCO, so an officer must confirm each one by hand against the bank statement.</Hint>
      {value.sharedPaybill && (
        <>
          <Field id="payin-bank-paybill" label="Bank's shared paybill number" error={errors.bank_paybill_number}>
            <input {...input('bankPaybill', { inputMode: 'numeric', placeholder: '247247', maxLength: 7 })} />
          </Field>
          <Hint>5 to 7 digits, no spaces. Example: 247247.</Hint>
        </>
      )}
    </div>
  );
}
