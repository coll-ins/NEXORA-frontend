/* format.js: small helpers every page uses. Copy to frontend/src/lib/format.js. Same file for everyone. */

/* Money. The API sends integers in MINOR units (cents). The screen shows whole shillings with a thousands separator. */
export const fromMinor = n => Math.round(n / 100);
export const toMinor = shillings => Math.round(Number(shillings) * 100);
export const kes = shillings => 'KES ' + Number(shillings).toLocaleString('en-KE');
export const kesFromMinor = n => kes(fromMinor(n));
/* Accepts what people type: "12,000", "12 000", "KES 12000". Returns a number of shillings, or 0 when it is not a number. */
export const parseAmount = text => Number(String(text).replace(/[^\d.]/g, '')) || 0;

/* One unique reference per money submit (the backend answers a repeat of the same reference with replayed:true). */
export const newReference = () => (crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16); }));

/* Dates: the API sends ISO strings in UTC. Show them the way people write them here: 17 Nov, 17 Nov 2026, 17 Nov 14:02. */
const fmt = (iso, opts) => new Date(iso).toLocaleString('en-GB', { timeZone: 'Africa/Nairobi', ...opts });
export const dShort = iso => fmt(iso, { day: 'numeric', month: 'short' });
export const dLong = iso => fmt(iso, { day: 'numeric', month: 'short', year: 'numeric' });
export const dTime = iso => fmt(iso, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false });

/* Count-up for big numbers: call once when the page has appeared. */
export function countUp(el, ms = 1700) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const to = parseFloat(el.dataset.count), dec = +(el.dataset.dec || 0), pre = el.dataset.pre || '', suf = el.dataset.suf || '', t0 = performance.now();
  const step = t => { const p = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - p, 3); el.textContent = pre + (to * e).toLocaleString('en-KE', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suf; if (p < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}
