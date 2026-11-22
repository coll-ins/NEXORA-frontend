/*
 * Field: a label, an input and (when `error` is set) a message under it that is also announced to screen readers.
 * Use it for EVERY form input so errors look and behave the same everywhere.
 *
 *   <Field id="amount" label="Amount (KES)" error={errors.amount}>
 *     <input id="amount" inputMode="numeric" value={v} onChange={...} />
 *   </Field>
 *
 * The input needs the same id. Field sets aria-invalid and aria-describedby for you through the cloned child.
 */
import { cloneElement, Children } from 'react';

export default function Field({ id, label, error, children }) {
  const child = Children.only(children);
  const input = cloneElement(child, { id, 'aria-invalid': error ? 'true' : undefined, 'aria-describedby': error ? `${id}-err` : undefined });
  return (
    <div className={`field${error ? ' err' : ''}`}>
      <label htmlFor={id}>{label}</label>
      {input}
      {error && <div className="field-msg" id={`${id}-err`} role="alert">{error}</div>}
    </div>
  );
}
