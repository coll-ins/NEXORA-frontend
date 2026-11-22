/*
 * Logo: the NEXORA coin. Two pieces:
 *   <LogoDefs />  render ONCE at the top of the app (it holds the gradients the coin uses).
 *   <Logo className="mark" />  the coin, anywhere. Size it with CSS (.brand .mark is 2.05rem in the stylesheet).
 * The coin takes its colours from the theme: the disc and ring gradients read --disc-a/b/c and --ring-a/b/c (set per colour theme in nexora-2.css),
 * so it turns red in Terracotta, soft green in Sage, warm gold in Saffron and dark in Ink. Never hard-code the disc colours.
 * The coin is the single place the logo lives. When the final logo arrives, replace the SVG inside <Logo> and nothing else changes.
 */
export function LogoDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="lg-ring" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style={{ stopColor: 'var(--ring-a)' }} /><stop offset=".5" style={{ stopColor: 'var(--ring-b)' }} /><stop offset="1" style={{ stopColor: 'var(--ring-c)' }} /></linearGradient>
        <radialGradient id="lg-disc" cx=".35" cy=".3" r=".95"><stop offset="0" style={{ stopColor: 'var(--disc-a)' }} /><stop offset=".55" style={{ stopColor: 'var(--disc-b)' }} /><stop offset="1" style={{ stopColor: 'var(--disc-c)' }} /></radialGradient>
        <linearGradient id="lg-face" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFFBF0" /><stop offset="1" stopColor="#E7D4A9" /></linearGradient>
        <linearGradient id="lg-diag" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#F8CB6C" /><stop offset="1" stopColor="#D9663B" /></linearGradient>
        <radialGradient id="lg-gloss" cx=".3" cy=".2" r=".75"><stop offset="0" stopColor="#fff" stopOpacity=".55" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient>
        <filter id="lg-sh" x="-20%" y="-20%" width="140%" height="155%"><feDropShadow dx="0" dy="1.8" stdDeviation="1.4" floodColor="#000" floodOpacity=".45" /></filter>
      </defs>
    </svg>
  );
}

export function Logo({ className = 'mark' }) {
  return (
    <svg className={className} viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r="46" fill="url(#lg-disc)" />
      <circle cx="50" cy="50" r="46" fill="none" stroke="url(#lg-ring)" strokeWidth="3.2" />
      <g filter="url(#lg-sh)">
        <path d="M29 71V29h11v42z" fill="url(#lg-face)" />
        <path d="M29 29h11l31 42H60z" fill="url(#lg-diag)" />
        <path d="M60 29h11v42H60z" fill="url(#lg-face)" />
      </g>
      <path d="M40 29l8.5 11.5H40z" fill="#000" opacity=".2" />
      <ellipse cx="38" cy="26" rx="27" ry="14" fill="url(#lg-gloss)" transform="rotate(-20 38 26)" />
      <g className="orbit"><circle cx="50" cy="4" r="4.4" fill="#F2B441" /></g>
    </svg>
  );
}

/* The brand lockup (coin + word) is built in the Shell with the router's <Link>:
 *   <Link className="brand" to="/overview" aria-label="NEXORA home"><Logo /><span className="brand-text">NEXORA</span></Link>
 */
