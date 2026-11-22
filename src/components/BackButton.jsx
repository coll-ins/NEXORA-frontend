/*
 * BackButton: ONLY on pages you reach by drilling in (a ledger from the accounts list, a member profile from the members
 * list, a loan's details, a SACCO's detail, step 2 of a form). Never on a page that is in the sidebar menu.
 * Label it with where it goes: "Back to accounts", not just "Back".
 */
export default function BackButton({ label = 'Back', onClick }) {
  return (
    <div className="page-back">
      <button type="button" className="back" onClick={onClick}>← {label}</button>
    </div>
  );
}
