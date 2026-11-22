/* MethodSwitch: M-Pesa | Bank. The form keeps every typed value in its own state, so switching never loses the amount. */
export default function MethodSwitch({ label, value, onChange }) {
  const options = [['mpesa', 'M-Pesa'], ['bank', 'Bank']];
  return (
    <div className="field">
      <span id="method-label">{label}</span>
      <div className="seg sam-switch" role="tablist" aria-labelledby="method-label">
        {options.map(([key, text]) => (
          <button key={key} type="button" role="tab" aria-selected={value === key} onClick={() => onChange(key)}>{text}</button>
        ))}
      </div>
    </div>
  );
}