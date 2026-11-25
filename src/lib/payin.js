/* SACCO pay-in details: the form's empty state, the browser-side check and the request body.
 * The server checks the same things; each message says the format, gives an example and gives the
 * reason, so nobody has to guess. Keys are the API's field names. */
const digits = (text, min, max) => new RegExp(`^[0-9]{${min},${max}}$`).test(String(text).trim());

export const emptyPayIn = () => ({
  mpesaType: 'paybill', mpesaNumber: '', displayName: '', reference: '',
  bankName: '', bankAccountName: '', bankAccountNumber: '', bankBranch: '',
  sharedPaybill: false, bankPaybill: '',
});

export function checkPayIn(v) {
  const e = {};
  const hasMpesa = v.mpesaNumber.trim() !== '';
  const hasBank = [v.bankName, v.bankAccountName, v.bankAccountNumber].some(x => x.trim() !== '');
  if (!hasMpesa && !hasBank) e._ = 'Give M-Pesa details, bank details or both, so members have somewhere to pay.';
  if (hasMpesa) {
    if (v.mpesaType === 'pochi') {
      if (!/^(?:\+?254|0)[17][0-9]{8}$/.test(v.mpesaNumber.replace(/[\s-]/g, ''))) e.mpesa_number = 'A Pochi la Biashara number is a Safaricom phone number. Example: 0712345678.';
    } else if (!digits(v.mpesaNumber, 5, 7)) e.mpesa_number = 'Enter 5 to 7 digits, with no spaces or letters, because M-Pesa numbers are never shorter or longer. Example: 400200.';
    if (!v.displayName.trim()) e.display_name = 'Add the name members will see when M-Pesa shows the business name, so they can check it before paying. Example: Umoja SACCO Savings.';
    if (v.mpesaType !== 'paybill' && v.reference.trim()) e.account_reference_hint = 'Only a paybill has an account number. Leave this empty for a till or Pochi.';
  }
  if (v.displayName.length > 60) e.display_name = 'Keep this to 60 characters or fewer. Example: Umoja SACCO Savings.';
  if (hasBank) {
    if (!v.bankName.trim()) e.bank_name = 'Add the bank name, because members need to know where to pay. Example: Equity Bank.';
    if (!v.bankAccountName.trim()) e.bank_account_name = 'Add the name on the account, so members can check it. Example: Umoja SACCO.';
    if (!digits(v.bankAccountNumber, 6, 20)) e.bank_account_number = 'Enter 6 to 20 digits, with no spaces or dashes, so a typo cannot send money elsewhere. Example: 0123456789.';
  } else if (v.bankBranch.trim()) e.bank_branch = 'A branch needs a bank. Add the bank details too.';
  if (v.sharedPaybill) {
    if (!hasBank) e.bank_uses_shared_paybill = 'A shared bank paybill needs the bank details above it.';
    if (!digits(v.bankPaybill, 5, 7)) e.bank_paybill_number = "Enter the bank's shared paybill number: 5 to 7 digits, no spaces. Example: 247247.";
  }
  return e;
}

const orNull = text => text.trim() || null;

export const payInBody = v => {
  const hasMpesa = v.mpesaNumber.trim() !== '';
  const hasBank = [v.bankName, v.bankAccountName, v.bankAccountNumber].some(x => x.trim() !== '');
  return {
    mpesa_type: hasMpesa ? v.mpesaType : null,
    mpesa_number: orNull(v.mpesaNumber),
    display_name: orNull(v.displayName),
    account_reference_hint: hasMpesa && v.mpesaType === 'paybill' ? orNull(v.reference) : null,
    bank_name: orNull(v.bankName),
    bank_account_name: orNull(v.bankAccountName),
    bank_account_number: orNull(v.bankAccountNumber),
    bank_branch: hasBank ? orNull(v.bankBranch) : null,
    bank_uses_shared_paybill: v.sharedPaybill,
    bank_paybill_number: v.sharedPaybill ? orNull(v.bankPaybill) : null,
  };
};

/* The form's values for details that are live (or waiting), to start a proposed change from. */
export const payInToForm = d => ({
  mpesaType: d.mpesa_type || 'paybill', mpesaNumber: d.mpesa_number || '', displayName: d.display_name || '',
  reference: d.account_reference_hint || '', bankName: d.bank_name || '', bankAccountName: d.bank_account_name || '',
  bankAccountNumber: d.bank_account_number || '', bankBranch: d.bank_branch || '',
  sharedPaybill: !!d.bank_uses_shared_paybill, bankPaybill: d.bank_paybill_number || '',
});
