/*
 * charts.js: the four NEXORA charts (line, bars, donut, ring), as plain functions.
 * Copy this file to frontend/src/lib/charts.js. Do not edit it: it is the same file for everyone.
 *
 * Each function draws into an element and returns nothing:
 *   renderLine(el, options, still)   area line with hover tooltip
 *   renderBars(el, options, still)   grouped bars
 *   renderDonut(el, parts, top, sub, still)
 *   renderRing(el, percent, still)
 * `still` = true redraws without the entrance animation (used after a window resize).
 * Use mountChart(el, fn) to draw once when the element has a width, and redraw (still) when the width changes.
 * In React, call these through <ChartBox> (components/ChartBox.jsx), never directly in render().
 */

export const MONTHS = ['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];
export const fAx = unit => a => a.toFixed(a >= 10 ? 0 : 1) + unit;
export const fTipM = a => 'KES ' + a.toFixed(1) + 'M';
export const fTipK = a => 'KES ' + a.toFixed(1) + 'K';

export const smooth = p => {
  let d = `M${p[0][0]},${p[0][1]}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] || p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] || p2;
    d += ` C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)},${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)},${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
};
const uid = () => 'g' + Math.random().toString(36).slice(2, 9);
const autoH = W => Math.round(Math.min(280, Math.max(180, W * 0.36)));
const setStill = (el, still) => { el.className = el.className.replace(/\bstill\b/g, '').trim() + (still ? ' still' : ''); };

/** options: { values:number[], labels:string[], color, fmtAxis(v), fmtTip(v), h?, axis?=true, static?=false, sw? } */
export function renderLine(el, o, still) {
  const W = el.clientWidth; if (!W) return;
  const H = o.h || autoH(W), axis = o.axis !== false;
  const pl = axis ? 44 : 4, pr = 8, pt = 14, pb = axis ? 28 : 4;
  const v = o.values, n = v.length, max = Math.max(...v) * 1.12;
  const X = i => pl + i * (W - pl - pr) / (n - 1), Y = a => pt + (H - pt - pb) * (1 - a / max);
  const line = smooth(v.map((a, i) => [X(i), Y(a)])), base = H - pb, id = uid();
  let s = `<div class="plot"><svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${o.color}" stop-opacity=".36"/><stop offset="1" stop-color="${o.color}" stop-opacity="0"/></linearGradient></defs>`;
  if (axis) {
    for (let k = 0; k <= 4; k++) { const a = max * k / 4, y = Y(a); s += `<line class="gl" x1="${pl}" x2="${W - pr}" y1="${y}" y2="${y}"/><text class="ax" x="${pl - 8}" y="${y + 4}" text-anchor="end">${o.fmtAxis(a)}</text>`; }
    const every = Math.max(1, Math.ceil(n / Math.max(1, Math.floor((W - pl) / 54))));
    v.forEach((_, i) => { if (i % every === 0 || i === n - 1) s += `<text class="ax" x="${X(i)}" y="${H - 8}" text-anchor="middle">${o.labels[i]}</text>`; });
  }
  s += `<path d="${line} L${X(n - 1)},${base} L${X(0)},${base} Z" fill="url(#${id})"/><path d="${line}" fill="none" stroke="${o.color}" stroke-width="${o.sw || 2.8}" stroke-linecap="round"/>`;
  if (!o.static) s += `<line id="${id}g" y1="${pt}" y2="${base}" stroke="${o.color}" stroke-opacity=".4" stroke-dasharray="3 4" opacity="0"/><circle id="${id}d" r="6" fill="${o.color}" stroke="#fff" stroke-width="2.5" opacity="0"/><rect x="${pl}" y="0" width="${W - pl - pr}" height="${H}" fill="transparent"/>`;
  setStill(el, still);
  el.innerHTML = s + '</svg></div>' + (o.static ? '' : '<div class="tip" hidden></div>');
  if (o.static) return;
  const svg = el.querySelector('svg'), tip = el.querySelector('.tip'), g = svg.querySelector('#' + id + 'g'), d = svg.querySelector('#' + id + 'd');
  svg.addEventListener('pointermove', e => {
    const r = svg.getBoundingClientRect(), px = (e.clientX - r.left) * (W / r.width);
    let i = Math.round((px - pl) / (W - pl - pr) * (n - 1)); i = Math.max(0, Math.min(n - 1, i));
    g.setAttribute('x1', X(i)); g.setAttribute('x2', X(i)); g.setAttribute('opacity', 1);
    d.setAttribute('cx', X(i)); d.setAttribute('cy', Y(v[i])); d.setAttribute('opacity', 1);
    tip.hidden = false; tip.textContent = o.labels[i] + ' · ' + o.fmtTip(v[i]);
    tip.style.left = (X(i) / W * r.width) + 'px'; tip.style.top = (Y(v[i]) / H * r.height) + 'px';
  });
  svg.addEventListener('pointerleave', () => { g.setAttribute('opacity', 0); d.setAttribute('opacity', 0); tip.hidden = true; });
}

/** options: { labels:string[], series:[{name, values:number[], color}], fmtAxis(v), fmtTip(v), h? } */
export function renderBars(el, o, still) {
  const W = el.clientWidth; if (!W) return;
  const H = o.h || autoH(W), pl = 44, pr = 8, pt = 14, pb = 28;
  const max = Math.max(...o.series.flatMap(x => x.values)) * 1.15, n = o.labels.length, gw = (W - pl - pr) / n, bw = Math.max(4, Math.min(16, gw * 0.26));
  const Y = a => pt + (H - pt - pb) * (1 - a / max);
  let s = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true">`;
  for (let k = 0; k <= 4; k++) { const a = max * k / 4, y = Y(a); s += `<line class="gl" x1="${pl}" x2="${W - pr}" y1="${y}" y2="${y}"/><text class="ax" x="${pl - 8}" y="${y + 4}" text-anchor="end">${o.fmtAxis(a)}</text>`; }
  const every = Math.max(1, Math.ceil(n / Math.max(1, Math.floor((W - pl) / 40))));
  o.labels.forEach((lab, i) => {
    const cx = pl + gw * i + gw / 2;
    o.series.forEach((se, j) => {
      const a = se.values[i], two = o.series.length > 1, x = two ? cx + (j === 0 ? -bw - 2 : 2) : cx - bw / 2, y = Y(a);
      s += `<rect class="bar" x="${x}" y="${y}" width="${bw}" height="${H - pb - y}" rx="${Math.min(6, bw / 2)}" fill="${se.color}" style="--d:${i * 40}ms"><title>${lab} ${se.name}: ${o.fmtTip(a)}</title></rect>`;
    });
    if (i % every === 0 || i === n - 1) s += `<text class="ax" x="${cx}" y="${H - 8}" text-anchor="middle">${lab}</text>`;
  });
  setStill(el, still);
  el.innerHTML = s + '</svg>';
}

/** parts: [{ value, color }], top = big centre text, sub = small centre text */
export function renderDonut(el, parts, top, sub, still) {
  const r = 72, sw = 20, C = 2 * Math.PI * r, total = parts.reduce((a, p) => a + p.value, 0); let off = 0;
  let s = `<svg viewBox="0 0 200 200" aria-hidden="true"><circle cx="100" cy="100" r="${r}" fill="none" stroke="rgba(15,76,71,.08)" stroke-width="${sw}"/>`;
  parts.forEach(p => { const len = C * p.value / total; s += `<circle class="arc" style="--c:${C}" cx="100" cy="100" r="${r}" fill="none" stroke="${p.color}" stroke-width="${sw}" stroke-dasharray="${len - 2} ${C - len + 2}" stroke-dashoffset="${-off}" transform="rotate(-90 100 100)"/>`; off += len; });
  setStill(el, still);
  el.innerHTML = s + `<text class="donut-top" x="100" y="100" text-anchor="middle">${top}</text><text class="donut-sub" x="100" y="120" text-anchor="middle">${sub}</text></svg>`;
}

/** percent: 0 to 100 */
export function renderRing(el, pct, still) {
  const r = 62, sw = 14, C = 2 * Math.PI * r;
  setStill(el, still);
  el.innerHTML = `<svg viewBox="0 0 160 160" aria-hidden="true"><defs><linearGradient id="ringg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F2B441"/><stop offset=".55" stop-color="#2F8A7B"/><stop offset="1" stop-color="#0F4C47"/></linearGradient></defs><circle cx="80" cy="80" r="${r}" fill="none" stroke="rgba(15,76,71,.1)" stroke-width="${sw}"/><circle class="arc" style="--c:${C}" cx="80" cy="80" r="${r}" fill="none" stroke="url(#ringg)" stroke-width="${sw}" stroke-linecap="round" stroke-dasharray="${C * pct / 100} ${C}" transform="rotate(-90 80 80)"/><text class="ring-label" x="80" y="88" text-anchor="middle">${pct}%</text><text class="ring-cap" x="80" y="108" text-anchor="middle">repaid</text></svg>`;
}

/* draw once, then redraw without animation when the width changes by more than 16 px */
const dirty = new Set(); let timer;
const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(entries => {
  entries.forEach(e => dirty.add(e.target)); clearTimeout(timer);
  timer = setTimeout(() => { dirty.forEach(el => { const w = el.clientWidth; if (w && el._fn && Math.abs(w - el._w) > 16) { el._w = w; el._fn(el, true); } }); dirty.clear(); }, 200);
});
export function mountChart(el, fn) { if (!el || !el.clientWidth) return; el._fn = fn; el._w = el.clientWidth; fn(el, false); if (ro) ro.observe(el); }
export function unmountChart(el) { if (el && ro) ro.unobserve(el); if (el) el._fn = null; }
