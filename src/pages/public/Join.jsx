import { useState } from 'react';
import { Link } from 'react-router-dom';
import ErrorBanner from '../../components/ErrorBanner.jsx';
import ErrorPage from '../../components/ErrorPage.jsx';
import Field from '../../components/Field.jsx';
import RulesView from '../../components/RulesView.jsx';
import { describe } from '../../lib/errors.js';
import { useSession } from '../../lib/session.jsx';
import { joinPinRequest, joinRequest } from '../../api/auth.js';
import { joinAcceptRules, joinDeclineRules, joinRules } from '../../api/rules.js';

function messageFor(error) {
  const serverMessage = String(error && error.message || '');
  switch (error && error.code) {
    case 'CODE_WRONG':
      if (/locked|burned|too many wrong/i.test(serverMessage)) {
        return 'This code is locked after too many wrong tries. Ask your admin to add you again.';
      }
      return 'That code is not right. Check the 6 digits and try again.';
    case 'CODE_EXPIRED':
      return 'This code has expired. Ask your admin to add you again for a new one.';
    case 'CODE_USED':
      return 'This code was already used. Sign in instead, or ask your admin for a new code.';
    case 'CODE_BURNED':
      return 'This code is locked after too many wrong tries. Ask your admin to add you again.';
    case 'PHONE_ACCOUNT_MISMATCH':
      return 'That phone belongs to another account.';
    case 'ALREADY_MEMBER':
      return 'You are already a member of this SACCO.';
    case 'CODE_LOCKED':
      return 'This code is locked after too many wrong tries. Ask your admin to add you again.';
    case 'SETUP_EXPIRED':
      return 'The setup took too long. Join again with your code.';
    default:
      if (error && error.status === 401) return 'The setup took too long. Join again with your code.';
      if (error && error.status === 409 && /phone.*another account/i.test(serverMessage)) {
        return 'That phone belongs to another account.';
      }
      if (error && error.status === 409 && /already.*member|already.*joined/i.test(serverMessage)) {
        return 'You are already a member of this SACCO.';
      }
      return describe(error).text;
  }
}

export default function Join() {
  const { completeJoin, navigate, saccos } = useSession();
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [setup, setSetup] = useState(null);
  const [rules, setRules] = useState(null);
  const [joiningSacco, setJoiningSacco] = useState(null);
  const [accepted, setAccepted] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState('');
  const [pin, setPin] = useState('');
  const [repeatPin, setRepeatPin] = useState('');
  const [error, setError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [notice, setNotice] = useState('');
  const [noticeHasEnterLink, setNoticeHasEnterLink] = useState(false);
  const [pageError, setPageError] = useState('');
  const [sending, setSending] = useState(false);

  async function submitCode(event) {
    event.preventDefault();
    setError('');
    setPhoneError('');
    setNotice('');
    setNoticeHasEnterLink(false);
    if (!/^\d{6}$/.test(code)) {
      setError('Enter the 6-digit code.');
      return;
    }

    setSending(true);
    try {
      const result = await joinRequest(phone.trim(), code);
      setSetup(result);
      const read = await joinRules(result.setup_token);
      setRules(read.rules);
      setJoiningSacco(read.sacco || null);
      setAccepted(false);
      setStep(2);
      setCode('');
    } catch (failure) {
      if (failure && failure.status === 423 && failure.code !== 'PIN_LOCKED') {
        setPageError('423');
      } else {
        setError(messageFor(failure));
        if (
          failure
          && (failure.code === 'CODE_USED' || failure.code === 'ALREADY_MEMBER')
          && saccos.some(item => item.membershipStatus === 'active')
        ) {
          setNotice(
            failure.code === 'ALREADY_MEMBER'
              ? 'You are already a member of this SACCO.'
              : 'If you already joined, enter your SACCO with its PIN.',
          );
          setNoticeHasEnterLink(true);
        }
      }
    } finally {
      setSending(false);
    }
  }

  async function acceptRulesStep() {
    setError('');
    setSending(true);
    try {
      await joinAcceptRules(setup.setup_token, rules.version);
      setAccepted(true);
    } catch (failure) {
      setError(describe(failure).text);
    } finally {
      setSending(false);
    }
  }

  /* Refusing the invitation: the reason is required and goes to the officers.
   * The join code is spent, so the invitation ends here. */
  async function declineRules(event) {
    event.preventDefault();
    setError('');
    if (!reason.trim()) {
      setError('Say why you are declining. The SACCO\u2019s officers read your reason.');
      return;
    }
    setSending(true);
    try {
      await joinDeclineRules(setup.setup_token, rules.version, reason.trim());
      const named = joiningSacco ? `the invitation to ${joiningSacco.name}` : 'this invitation';
      setDeclining(false);
      setReason('');
      setAccepted(false);
      setRules(null);
      setJoiningSacco(null);
      setSetup(null);
      setCode('');
      setStep(1);
      setNoticeHasEnterLink(false);
      setNotice(`You declined ${named}. Your reason was sent to the SACCO\u2019s officers. An admin can invite you again if you change your mind.`);
    } catch (failure) {
      setError(describe(failure).text);
    } finally {
      setSending(false);
    }
  }

  async function submitPin(event) {
    event.preventDefault();
    setError('');
    if (!/^\d{4}$/.test(pin) || !/^\d{4}$/.test(repeatPin)) {
      setError('Enter a 4-digit PIN in both fields.');
      return;
    }
    if (pin !== repeatPin) {
      setError('The PINs do not match. Enter them again.');
      return;
    }
    if (!setup || !setup.setup_token) {
      setStep(1);
      setError('Join again with a new code.');
      return;
    }

    setSending(true);
    try {
      const result = await joinPinRequest(setup.setup_token, pin);
      await completeJoin({
        ...result,
        sacco_id: result.sacco_id || setup.sacco_id,
        membership_id: result.membership_id || setup.membership_id,
      });
      setSetup(null);
      setPin('');
      setRepeatPin('');
      navigate('/enter', {
        replace: true,
        state: { enterSelected: true, justJoined: true, from: '/overview' },
      });
    } catch (failure) {
      if (failure && failure.status === 401) {
        setSetup(null);
        setStep(1);
        setPin('');
        setRepeatPin('');
      } else if (failure && failure.status === 423 && failure.code !== 'PIN_LOCKED') {
        setPageError('423');
      }
      setError(messageFor(failure));
    } finally {
      setSending(false);
    }
  }

  function goBack() {
    setSetup(null);
    setJoiningSacco(null);
    setStep(1);
    setCode('');
    setPin('');
    setRepeatPin('');
    setError('');
    setNotice('You will need a new join code to continue.');
  }

  if (pageError) {
    return (
      <ErrorPage
        code={pageError}
        onAction={action => {
          if (action === 'switcher') navigate('/enter');
          else if (action === 'account') navigate('/account');
        }}
      />
    );
  }

  const needsRules = step === 2 && rules && !accepted;
  const total = rules ? 3 : 2;

  return (
    /* Same spread as sign in and create an account: the explanation on the left,
     * the card on the right, instead of one phone-width column at the top of a
     * wide desktop. Inside the shell the sidebar eats the width, so the row only
     * starts at 1280 where both columns still have room. */
    <div className="mx-auto flex w-full max-w-[64rem] flex-col gap-8 p-4 md:p-6 xl:min-h-[calc(100vh-13rem)] xl:flex-row xl:items-center xl:justify-between xl:gap-12">
      <div className="flex w-full max-w-[26rem] shrink-0 flex-col gap-3">
        <div className="eyebrow">
          {joiningSacco ? `Invitation to ${joiningSacco.name}` : 'Join a SACCO'}
        </div>
        <h1 className="font-serif text-[clamp(2rem,2.4vw,3rem)] leading-[1.05]">
          {step === 1
            ? 'Join with a code'
            : needsRules
              ? (joiningSacco ? `Read the rules of ${joiningSacco.name}` : 'Read the SACCO rules')
              : 'Set your PIN'}
        </h1>
        <p className="text-muted">
          {step === 1
            ? 'Enter the 6-digit code from your email. If your admin added your phone number instead, enter that number too.'
            : needsRules
              ? `Every fee, fine and rule ${joiningSacco ? `of ${joiningSacco.name}` : 'of the SACCO'} is below. You join only after you accept them. If you do not accept them, decline and tell the officers why.`
              : 'Choose a 4-digit PIN for this SACCO.'}
        </p>
      </div>
      <section className="glass flex w-full flex-col gap-3 xl:max-w-[30rem]">
        <div className="eyebrow">Step {step === 1 ? 1 : needsRules ? 2 : total} of {total}</div>
        {notice && (
          <ErrorBanner kind="info">
            {notice}
            {noticeHasEnterLink && (
              <button
                type="button"
                className="link-btn"
                onClick={() => navigate('/enter')}
              >
                Enter my SACCO
              </button>
            )}
          </ErrorBanner>
        )}

        {step === 1 ? (
          <form className="flex flex-col gap-1" noValidate onSubmit={submitCode}>
            <Field id="join-phone" label="Phone number (only if your admin added your phone)" error={phoneError}>
              <input
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={event => {
                  setPhone(event.target.value);
                  setPhoneError('');
                }}
              />
            </Field>
            <Field id="join-code" label="6-digit join code" error={error}>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                pattern="[0-9]{6}"
                value={code}
                onChange={event => {
                  setCode(event.target.value.replace(/\D/g, '').slice(0, 6));
                  setError('');
                }}
                required
              />
            </Field>
            <button className="btn block" type="submit" disabled={sending}>
              {sending ? 'Checking code...' : 'Continue'}
            </button>
          </form>
        ) : needsRules ? (
          <div className="flex flex-col gap-4">
            <RulesView rules={rules} />
            {error && <ErrorBanner>{error}</ErrorBanner>}
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn" disabled={sending} onClick={acceptRulesStep}>
                {sending ? 'Saving...' : 'I have read all the rules and accept them'}
              </button>
              <button
                type="button"
                className="btn ghost"
                disabled={sending}
                onClick={() => {
                  setError('');
                  setDeclining(open => !open);
                }}
              >
                {declining ? 'Keep reading the rules' : 'Decline these rules'}
              </button>
            </div>
            {declining && (
              <form className="flex flex-col gap-1" noValidate onSubmit={declineRules}>
                <Field
                  id="join-decline-reason"
                  label={`Why are you declining${joiningSacco ? ` ${joiningSacco.name}` : ''}? The officers will read this.`}
                  error={null}
                >
                  <textarea
                    rows={3}
                    maxLength={500}
                    value={reason}
                    onChange={event => {
                      setReason(event.target.value);
                      setError('');
                    }}
                    required
                  />
                </Field>
                <button
                  className="btn warn block"
                  type="submit"
                  disabled={sending || !reason.trim()}
                >
                  {sending ? 'Sending...' : 'Send my reason and decline'}
                </button>
                <p className="note">
                  Your invitation ends here. You cannot set a PIN unless an admin invites you again.
                </p>
              </form>
            )}
          </div>
        ) : (
          <form className="flex flex-col gap-1" noValidate onSubmit={submitPin}>
            <Field id="join-pin" label="Choose a 4-digit PIN" error={error}>
              <input
                type="password"
                inputMode="numeric"
                autoComplete="new-password"
                maxLength={4}
                pattern="[0-9]{4}"
                value={pin}
                onChange={event => {
                  setPin(event.target.value.replace(/\D/g, '').slice(0, 4));
                  setError('');
                }}
                required
              />
            </Field>
            <Field id="join-pin-repeat" label="Repeat your PIN">
              <input
                type="password"
                inputMode="numeric"
                autoComplete="new-password"
                maxLength={4}
                pattern="[0-9]{4}"
                value={repeatPin}
                onChange={event => {
                  setRepeatPin(event.target.value.replace(/\D/g, '').slice(0, 4));
                  setError('');
                }}
                required
              />
            </Field>
            <button className="btn block" type="submit" disabled={sending}>
              {sending ? 'Saving PIN...' : 'Set my PIN'}
            </button>
            <button className="btn ghost block" type="button" onClick={goBack} disabled={sending}>
              Back
            </button>
            <p className="note">Going back means you will need a new join code.</p>
          </form>
        )}

        <nav className="auth-links" aria-label="Sign-in options">
          <Link to="/login">Sign in</Link>
        </nav>
      </section>
    </div>
  );
}
