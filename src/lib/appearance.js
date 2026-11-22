/*
 * appearance.js: every PERSON picks how NEXORA looks for them: a colour theme, a font and a text size.
 * Copy to frontend/src/lib/appearance.js. Same file for everyone. Ryan wires it in (main.jsx, the session provider, My settings).
 *
 * THE RULE: the look belongs to one person. Changing it never changes anything for anybody else.
 *   - The choice is saved on this device under a key that contains the person's user id:  nexora.appearance:<userId>
 *     as {"theme":"ocean","font":"nunito","size":"large"}. Two people on the same computer each keep their own look.
 *   - When someone signs in, call syncAppearance(user.id): their look is applied. When they sign out, call syncAppearance(null):
 *     the neutral default (Cream) shows on the public pages. Signing in as someone else loads THAT person's look.
 *   - Switching SACCO does not change the look: it is the person's, not the SACCO's.
 *   - It is applied as attributes on <html>:  data-theme, data-font, data-size and data-mode ("light" or "dark").
 *   - The Appearance section at the bottom of styles/nexora-2.css turns data-theme into CSS variables on :root (--cream, --ink, --teal, --blob-1,
 *     --disc-a, --cur-1 ...) and data-mode="dark" switches the dark-theme rules (light text, dark glass).
 *   - styles/tailwind.css maps the variables to Tailwind colours and fonts (bg-cream, text-ink, font-serif), so every Tailwind class follows the theme.
 *   - The NEXORA coin and the green wave (curtain) read the same variables, so they take the theme's colour too.
 *   - A tiny inline script in index.html applies the last signed-in person's look before React starts (no flash of the wrong colours): see
 *     "Head script" in 01-Ryan. It must use the same key and the same dark theme list as this file.
 *   - It is stored per device (not on the server). The same person on another device starts with the default.
 */
export const KEY_PREFIX = 'nexora.appearance:';

/* dark: true means the page is dark, so text is light. The data-mode attribute follows this flag. */
export const THEMES = [
  { id: 'cream', name: 'Cream', note: 'Warm, default', sw: ['#F6EFE2', '#0F4C47', '#27806F', '#D9663B', '#F2B441'] },
  { id: 'sage', name: 'Sage', note: 'Fresh green', sw: ['#DDEBDC', '#1D5C37', '#2F7D4D', '#B9532B', '#E3B94D'] },
  { id: 'saffron', name: 'Saffron', note: 'Sunny yellow', sw: ['#FBE6A6', '#7A4600', '#9C5F08', '#BF431C', '#F2B441'] },
  { id: 'terracotta', name: 'Terracotta', note: 'Bold red', sw: ['#F8D3C3', '#9A2814', '#C4452A', '#9A2814', '#F2B441'] },
  { id: 'teal2', name: 'Teal 2', note: 'Bright turquoise', sw: ['#CFEEE9', '#0A6667', '#0B7F7D', '#D9663B', '#F2B441'] },
  { id: 'ocean', name: 'Ocean', note: 'Clear blue', sw: ['#D5E5FA', '#123E8C', '#2C6AD2', '#DB5A3A', '#F2B441'] },
  { id: 'rose', name: 'Rose', note: 'Soft pink', sw: ['#F9D4E2', '#A0154C', '#C2306B', '#C03A1E', '#F2B441'] },
  { id: 'slate', name: 'Slate', note: 'Calm grey', sw: ['#DCE1E8', '#2A374A', '#4D5F7A', '#C9532F', '#E8B44A'] },
  { id: 'ink', name: 'Ink', note: 'Dark green', dark: true, sw: ['#111A18', '#7FD3C2', '#4FB5A3', '#F08A64', '#F2B441'] },
  { id: 'midnight', name: 'Midnight', note: 'Dark navy', dark: true, sw: ['#0A1330', '#8DBBFF', '#5B96F2', '#FF8F6B', '#FFC857'] }
];
export const FONTS = [
  { id: 'default', name: 'Fraunces and Inter', note: 'Default', css: '"Fraunces", Georgia, serif' },
  { id: 'dm-sans', name: 'DM Sans', note: 'Clean and even', css: '"DM Sans", system-ui, sans-serif' },
  { id: 'lora', name: 'Lora', note: 'Book style', css: '"Lora", Georgia, serif' },
  { id: 'nunito', name: 'Nunito', note: 'Round and friendly', css: '"Nunito", system-ui, sans-serif' },
  { id: 'merriweather', name: 'Merriweather', note: 'Sturdy serif', css: '"Merriweather", Georgia, serif' },
  { id: 'atkinson', name: 'Atkinson Hyperlegible', note: 'Easiest to read', css: '"Atkinson Hyperlegible", system-ui, sans-serif' }
];
export const SIZES = [{ id: 'small', name: 'Small' }, { id: 'normal', name: 'Normal' }, { id: 'large', name: 'Large' }];
export const DEFAULT_APPEARANCE = { theme: 'cream', font: 'default', size: 'normal' };

/* userId null (signed out) always gives the default look and nothing is stored */
export function loadAppearance(userId) {
  if (userId == null) return { ...DEFAULT_APPEARANCE };
  try { return { ...DEFAULT_APPEARANCE, ...JSON.parse(localStorage.getItem(KEY_PREFIX + userId) || '{}') }; } catch { return { ...DEFAULT_APPEARANCE }; }
}
export function saveAppearance(userId, v) {
  if (userId == null) return;
  try { localStorage.setItem(KEY_PREFIX + userId, JSON.stringify(v)); } catch { /* private mode: the choice just lasts until reload */ }
}
/* The five optional fonts are not in index.html: each loads once, the first time somebody picks it. */
const OPTIONAL_FONTS = {
  'dm-sans': 'DM+Sans:wght@400;500;600;700',
  lora: 'Lora:wght@500;600',
  nunito: 'Nunito:wght@400;600;700',
  merriweather: 'Merriweather:wght@400;700',
  atkinson: 'Atkinson+Hyperlegible:wght@400;700',
};
function ensureFont(key) {
  const family = OPTIONAL_FONTS[key];
  const id = 'font-' + key;
  if (!family || document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id; link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=' + family + '&display=swap';
  document.head.appendChild(link);
}

/* fade = true adds a short colour fade (class theme-fade in nexora-2.css); skipped when the person asked for reduced motion */
export function applyAppearance(v = DEFAULT_APPEARANCE, fade = false) {
  const de = document.documentElement;
  if (fade && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    de.classList.add('theme-fade');
    setTimeout(() => de.classList.remove('theme-fade'), 450);
  }
  const t = THEMES.find(x => x.id === v.theme) || THEMES[0];
  ensureFont(v.font);
  de.dataset.theme = t.id; de.dataset.font = v.font; de.dataset.size = v.size; de.dataset.mode = t.dark ? 'dark' : 'light';
}
/* call when the signed-in person changes: after sign-in, after sign-out (null), in the harness when the role picker changes */
export function syncAppearance(userId) {
  applyAppearance(loadAppearance(userId), true);
}
/* the same person in ANOTHER tab changed their look: follow it. Call once in the session provider; it returns the function that stops listening. */
export function watchAppearance(getUserId) {
  const on = e => { if (e.key && e.key.startsWith(KEY_PREFIX) && e.key === KEY_PREFIX + getUserId()) applyAppearance(loadAppearance(getUserId()), true); };
  addEventListener('storage', on);
  return () => removeEventListener('storage', on);
}
export function resetAppearance(userId) {
  saveAppearance(userId, DEFAULT_APPEARANCE); applyAppearance(DEFAULT_APPEARANCE, true); return { ...DEFAULT_APPEARANCE };
}