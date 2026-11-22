/*
 * AppearanceCard: the "Appearance" card for Account settings (Ryan places it as the last card on the account page, any signed-in role).
 * Colour theme, font, text size, a live preview, and Reset to default. Saved by lib/appearance.js.
 * Picture: images/appearance-01-card-default.png (and -02 ... -08 for the themes).
 *
 *   <AppearanceCard />
 *
 * Tailwind utilities for layout; the colours come from the theme tokens, so the card itself changes as you pick.
 */
import { useState } from 'react';
import { THEMES, FONTS, SIZES, loadAppearance, saveAppearance, applyAppearance, resetAppearance } from '../lib/appearance.js';
import { useSession } from '../lib/session.jsx';

function Option({ checked, onClick, children }) {
  return (
    <button type="button" role="radio" aria-checked={checked} onClick={onClick}
      className={`grid gap-2 rounded-2xl border bg-white/55 p-2.5 text-left transition duration-300 hover:-translate-y-0.5 ${checked ? 'border-teal-2 ring-4 ring-teal-2/30' : 'border-white/80'}`}>
      {children}
    </button>
  );
}

export default function AppearanceCard() {
  const { user, toast } = useSession();          // the look belongs to THIS person (user.id): nobody else is changed
  const [v, setV] = useState(() => loadAppearance(user.id));
  const pick = (key, id) => { const next = { ...v, [key]: id }; setV(next); saveAppearance(user.id, next); applyAppearance(next, true); };
  const reset = () => { setV(resetAppearance(user.id)); toast('Appearance reset to the default.'); };
  const grid = 'grid grid-cols-[repeat(auto-fit,minmax(min(100%,7.5rem),1fr))] gap-2.5';
  const label = 'text-[0.8rem] font-semibold text-muted';
  return (
    <section className="glass grid gap-3" aria-labelledby="ap-h">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="eyebrow">Appearance</div>
          <h3 id="ap-h" className="font-serif text-[1.4rem]">Colours, font and text size</h3>
        </div>
        <button className="btn ghost small" type="button" onClick={reset}>Reset to default</button>
      </div>
      <p className="text-muted">Only you see this. It changes how NEXORA looks for <b>you</b> and nobody else, on this device. It stays after you sign out and back in.</p>

      <div className={label}>Colour theme</div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,8.5rem),1fr))] gap-2.5" role="radiogroup" aria-label="Colour theme">
        {THEMES.map(t => (
          <Option key={t.id} checked={v.theme === t.id} onClick={() => pick('theme', t.id)}>
            <span className="flex h-7 overflow-hidden rounded-lg border border-black/10">{t.sw.map((c, index) => <i key={`${t.id}-${index}`} className="flex-1" style={{ background: c }} />)}</span>
            <b className="text-[0.85rem]">{t.name}</b><small className="text-[0.72rem] text-muted">{t.note}</small>
          </Option>
        ))}
      </div>

      <div className={label}>Font</div>
      <div className={grid} role="radiogroup" aria-label="Font">
        {FONTS.map(f => (
          <Option key={f.id} checked={v.font === f.id} onClick={() => pick('font', f.id)}>
            <span className="text-[1.05rem] leading-tight" style={{ fontFamily: f.css }}>Aa 1,250</span>
            <b className="text-[0.85rem]">{f.name}</b><small className="text-[0.72rem] text-muted">{f.note}</small>
          </Option>
        ))}
      </div>

      <div className={label}>Text size</div>
      <div className={grid} role="radiogroup" aria-label="Text size">
        {SIZES.map(s => <Option key={s.id} checked={v.size === s.id} onClick={() => pick('size', s.id)}><b className="text-[0.85rem]">{s.name}</b></Option>)}
      </div>

      <div className={label}>Preview</div>
      <div className="grid gap-2 rounded-2xl border border-white/80 bg-white/40 p-4">
        <div className="eyebrow">SACCO savings balance</div>
        <div className="font-serif text-[clamp(1.6rem,3vw,2.2rem)] text-teal">KES 186,400</div>
        <p className="text-muted">Your next payment of KES 8,500 is due on 30 November.</p>
        <div className="flex flex-wrap items-center gap-2">
          <button className="btn small" type="button" tabIndex={-1}>Primary</button>
          <button className="btn ghost small" type="button" tabIndex={-1}>Ghost</button>
          <span className="chip up">Confirmed</span><span className="chip warn">Pending</span><span className="chip bad">Rejected</span>
        </div>
      </div>
    </section>
  );
}
