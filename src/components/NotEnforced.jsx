/* Marks a SACCO rule that NEXORA stores and shows but does not apply to any balance or loan. */
export default function NotEnforced() {
  return <span className="muted text-sm"> (recorded, not enforced)</span>;
}
