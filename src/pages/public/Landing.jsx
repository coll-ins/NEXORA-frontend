import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Scene3D from './Scene3D.jsx';
import Wave from './Wave.jsx';
import { Logo } from '../../components/Logo.jsx';

const LINKS = [
  ['Sign in', '/login'],
  ['Create an account', '/register'],
  // Joining needs a signed-in account (the API ties the code to it), so this
  // goes to sign-in and carries the destination: the login route returns here.
  ['Join with a code', '/login', { from: '/join' }],
];

const STEPS = [
  ['01', 'Join your SACCO', 'An admin adds you to your SACCO and gives you a join code. You enter it once, set a four-digit SACCO PIN, and from then on you sign in with your email, your password and that PIN.'],
  ['02', 'Save', 'Choose Deposit or Withdraw, pick M-Pesa or Bank, and send a request. Nothing moves yet: an officer checks the payment and confirms it, and only then does your balance change.'],
  ['03', 'Borrow', 'Ask for a loan and a term in months. Loans officers approve it, one approval or two depending on the SACCO’s cap and your savings, and a different officer pays it out. Loans carry no interest in this release.'],
  ['04', 'See everything', 'Every shilling is one ledger entry. Your balance is the sum of your entries, so you can always trace how it got there, and nobody can quietly edit the past.'],
];

const LOAN_STAGES = [
  ['Requested', 'The member asks'],
  ['Approved', 'One or two officers'],
  ['Paid out', 'A different officer'],
  ['Repaid', 'Until it reaches zero'],
];

const ROLES = [
  ['Member', 'Sees their own savings, requests deposits, withdrawals and loans, and repays their loan.'],
  ['Loans officer', 'Reads loans and reports, and approves loan steps. Cannot move money.'],
  ['Finance officer', 'Confirms deposit and withdrawal requests, posts money, pays out and records repayments, and reverses mistakes.'],
  ['Secretary', 'Reads members, accounts, reports and the audit log. Cannot change anything.'],
  ['SACCO admin', 'Runs the SACCO: adds members, sets job titles, renames the SACCO and approves platform support access. Never approves loans or reads the audit log.'],
  ['Platform owner', 'Creates SACCOs and sets loan rules. Needs no membership, and at least two owners always exist.'],
];

const TRUST = [
  ['Append-only records', 'Ledger entries, loan decisions, repayments and the audit log are never edited. A correction is a new entry that points at the old one.'],
  ['Two keys on every loan', 'You cannot decide your own loan, one officer cannot approve two steps, and whoever approved cannot pay it out.'],
  ['SACCOs stay apart', 'Every request is checked against your SACCO. Another SACCO’s data is not just hidden, it answers as if it does not exist.'],
  ['Safe to retry', 'Each money request carries its own reference. A double tap or a dropped connection posts once, never twice.'],
  ['Locks that hold', 'Five wrong passwords lock the account and five wrong PINs lock the SACCO, each for 15 minutes.'],
  ['Admins checked too', 'A SACCO admin cannot grant themselves a title, and every title change is in the audit log.'],
];

/* Scroll effects, all driven by the scroll position (no timers):
 *  - [data-side="left|right"] blocks slide in from their side with a turn, and
 *    --p (0..1) says how far in they are;
 *  - the .hscroll section pins to the screen and turns vertical scrolling into
 *    a sideways slide of its cards (wide screens only);
 *  - --sp (0..1, whole-page progress) spins the hero scene.
 * One rAF per scroll frame. Reduced motion leaves everything in place. */
function useScrollEffects(pageRef) {
  useEffect(() => {
    const root = pageRef.current;
    if (!root || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const clamp = v => Math.max(0, Math.min(1, v));
    const hs = root.querySelector('.hscroll');
    const track = hs && hs.querySelector('.hs-track');
    let frame = 0;
    let dist = 0;
    let pinned = false;

    function measure() {
      pinned = Boolean(hs) && window.matchMedia('(min-width: 64rem)').matches;
      if (!hs) return;
      hs.classList.toggle('hs-on', pinned);
      if (pinned) {
        dist = Math.max(0, track.scrollWidth - track.parentElement.clientWidth);
        hs.style.height = `${window.innerHeight + dist}px`;
      } else {
        hs.style.height = '';
        track.style.transform = '';
      }
    }
    function update() {
      frame = 0;
      const vh = window.innerHeight;
      root.querySelectorAll('[data-side]').forEach(el => {
        const top = el.getBoundingClientRect().top;
        el.style.setProperty('--p', clamp((vh * 0.96 - top) / (vh * 0.5)).toFixed(3));
      });
      if (pinned) {
        const box = hs.getBoundingClientRect();
        const p = clamp(-box.top / Math.max(1, box.height - vh));
        track.style.transform = `translateX(${(-p * dist).toFixed(1)}px)`;
        hs.style.setProperty('--hp', p.toFixed(3));
      }
      const max = document.documentElement.scrollHeight - vh;
      root.style.setProperty('--sp', max > 0 ? (window.scrollY / max).toFixed(3) : '0');
    }
    function onScroll() { if (!frame) frame = requestAnimationFrame(update); }
    function onResize() { measure(); onScroll(); }
    measure();
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [pageRef]);
}

export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);
  const barRef = useRef(null);
  const pageRef = useRef(null);
  useScrollEffects(pageRef);

  /* The phone menu covers the headline, so a tap anywhere else has to close it.
   * Without this the only way back to the page was the Menu button again. */
  useEffect(() => {
    if (!menuOpen) return undefined;
    function onPointerDown(event) {
      if (barRef.current && !barRef.current.contains(event.target)) setMenuOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [menuOpen]);

  return (
    <div className="landing flex w-full flex-col gap-10" ref={pageRef}>
      {/* The bar's own classes (.lnav, .lnav-cta, .lnav-burger, .lnav-pop) decide
        * what a phone shows. Tailwind's md: rules cannot do it here: .btn and
        * .glass sit outside @layer, so they beat those utilities and the panel
        * stayed on screen, laid over the hero and swallowing its clicks. */}
      <header className="lnav glass" ref={barRef}>
        <a className="flex items-center gap-2" href="/" aria-label="NEXORA home">
          <Logo className="mark" />
          <span className="font-serif text-xl">NEXORA</span>
        </a>
        <div className="lnav-cta ml-auto">
          <Link className="btn ghost small" to="/login">Sign in</Link>
          <button
            type="button"
            className="btn ghost small lnav-burger"
            aria-expanded={menuOpen}
            aria-controls="lnav-pop"
            onClick={() => setMenuOpen(open => !open)}
          >
            {menuOpen ? 'Close' : 'Menu'}
          </button>
        </div>
        {menuOpen && (
          <div className="lnav-pop" id="lnav-pop">
            {LINKS.map(([label, to, state]) => (
              <Link key={label} to={to} state={state}>{label}</Link>
            ))}
          </div>
        )}
      </header>

      {/* The hero uses the screen a laptop actually has: 100rem at the top, which
        * leaves a working margin instead of a third of the display in cream. */}
      <main className="mx-auto flex w-full max-w-[100rem] flex-col px-5 md:px-8">
        {/* Side by side from 1024 up: a 1024 laptop is a desktop, and stacking it
          * there left the hero as a narrow phone column. The copy narrows and
          * the gap tightens below xl so both columns still fit. */}
        <section className="relative flex flex-col items-start gap-12 lg:min-h-[calc(100vh-9rem)] lg:flex-row lg:items-center lg:justify-between lg:gap-10 xl:gap-20">
          <div className="flex max-w-[46rem] flex-col gap-6 lg:max-w-[28rem] xl:max-w-[46rem]">
            <h1 className="font-serif text-[clamp(2.5rem,4.4vw,5rem)] leading-[1.04]">Savings and loans for your SACCO.</h1>
            <p className="text-muted lg:text-lg xl:text-xl">
              NEXORA keeps your SACCO&rsquo;s money in one clear record. Members see their own
              balance. Staff see what their role needs.
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <Link className="btn" to="/login">Sign in</Link>
              <Link className="btn ghost" to="/login" state={{ from: '/join' }}>
                Join with a code
              </Link>
            </div>
          </div>
          <Scene3D className="scene-hero" />
        </section>

        <section className="hscroll" id="how" aria-labelledby="how-h">
          <div className="hs-sticky">
            <div className="lsec hs-head">
              <p className="eyebrow" data-side="left">How it works</p>
              <h2 id="how-h" className="font-serif lsec-h" data-side="left">From joining to repaying, in four steps.</h2>
              <p className="lsec-lead" data-side="right">
                NEXORA is the record book of a SACCO, a savings and credit society. Members put money
                in, borrow against it, and pay it back. The people who run the SACCO each get exactly
                the tools their job needs, and the app writes down everything they do.
              </p>
            </div>
            <div className="hs-view">
              <ol className="steps hs-track">
                {STEPS.map(([n, title, text]) => (
                  <li key={n} className="glass step">
                    <span className="step-n font-serif">{n}</span>
                    <h3 className="font-serif">{title}</h3>
                    <p>{text}</p>
                  </li>
                ))}
              </ol>
            </div>
            <div className="hs-bar" aria-hidden="true"><i /></div>
          </div>
        </section>

        <section className="lsec" aria-labelledby="loan-h">
          <p className="eyebrow" data-side="left">Loans in detail</p>
          <h2 id="loan-h" className="font-serif lsec-h" data-side="left">A loan is never one person&rsquo;s decision.</h2>
          <p className="lsec-lead" data-side="right">
            A member requests an amount and a term. If it is within the SACCO&rsquo;s cap and the
            member&rsquo;s savings multiple, one loans officer approves it. Above either limit the
            SACCO&rsquo;s own number of approvals applies, each from a different officer. A
            rejection always carries a reason. A finance officer who approved nothing pays it
            out, and each repayment is recorded until the balance reaches zero. A member can
            hold one open loan at a time.
          </p>
          <ol className="stages">
            {LOAN_STAGES.map(([name, who], index) => (
              <li key={name} className="stage" data-side={index % 2 ? 'right' : 'left'}>
                <span className="stage-dot">{index + 1}</span>
                <strong>{name}</strong>
                <span>{who}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="lsec" aria-labelledby="roles-h">
          <p className="eyebrow" data-side="left">Who sees what</p>
          <h2 id="roles-h" className="font-serif lsec-h" data-side="left">Every role gets its own view.</h2>
          <p className="lsec-lead" data-side="right">
            The screens you see come from what your job allows, never from a guess. If your role
            cannot do something, the menu does not show it, and the server refuses it anyway.
          </p>
          <ul className="roles">
            {ROLES.map(([name, text], index) => (
              <li key={name} className="glass role" data-side={index % 2 ? 'right' : 'left'}>
                <h3 className="font-serif">{name}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <div className="trust">
        <Wave className="wave-top" />
        <div className="mx-auto w-full max-w-[100rem] px-5 md:px-8">
          <p className="eyebrow trust-eyebrow" data-side="left">Safeguards</p>
          <h2 className="font-serif lsec-h trust-h" data-side="right">What the system will not let anyone do.</h2>
          <ul className="trust-grid">
            {TRUST.map(([name, text], index) => (
              <li key={name} className="trust-item" data-side={index % 2 ? 'right' : 'left'}>
                <h3 className="font-serif">{name}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ul>
          <div className="trust-cta">
            <Link className="btn" to="/login">Sign in</Link>
            <Link className="btn ghost" to="/login" state={{ from: '/join' }}>Join with a code</Link>
          </div>
        </div>
      </div>

      <footer className="lfoot mx-auto w-full max-w-[100rem] px-5 pb-10 md:px-8">
        NEXORA · Savings and loans for your SACCO.
      </footer>
    </div>
  );
}
