import { useState } from 'react';
import { Link } from 'react-router-dom';
import ErrorBanner from '../../components/ErrorBanner.jsx';
import Field from '../../components/Field.jsx';
import { describe } from '../../lib/errors.js';
import { useSession } from '../../lib/session.jsx';
import { changePasswordRequest, logoutAllRequest } from '../../api/auth.js';
import { saveMyPhoto } from '../../api/profile.js';
import PhotoViewer from '../../shell/PhotoViewer.jsx';

export default function AccountSettings() {
  const { user, logout, toast, profilePhoto, setProfilePhoto } = useSession();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [again, setAgain] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [leaveError, setLeaveError] = useState('');
  const [photoError, setPhotoError] = useState('');
  const [savingPhoto, setSavingPhoto] = useState(false);
  const [viewing, setViewing] = useState(false);

  async function changePassword(event) {
    event.preventDefault();
    setError('');
    if (next.length < 8) {
      setError('Use at least 8 characters for the new password.');
      return;
    }
    if (next !== again) {
      setError('The two new passwords do not match.');
      return;
    }
    setSending(true);
    try {
      await changePasswordRequest(current, next);
      toast('Password changed. Sign in again.');
      await logout();
    } catch (failure) {
      setCurrent('');
      setError(describe(failure).text);
      setSending(false);
    }
  }

  async function logoutEverywhere() {
    setLeaveError('');
    setLeaving(true);
    try {
      await logoutAllRequest();
      await logout();
    } catch (failure) {
      setLeaveError(describe(failure).text);
      setLeaving(false);
    }
  }

  async function pickPhoto(file) {
    setPhotoError('');
    if (file.size > 1_500_000) {
      setPhotoError('Choose a photo smaller than 1.5 MB.');
      return;
    }
    if (file.type && !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setPhotoError('Choose a JPEG, PNG or WebP photo.');
      return;
    }
    setSavingPhoto(true);
    try {
      await saveMyPhoto(file);
      setProfilePhoto(URL.createObjectURL(file));
      toast('Profile photo saved to your account.');
    } catch (failure) {
      setPhotoError(describe(failure).text);
    } finally {
      setSavingPhoto(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <p className="text-muted">
          Signed in as {user ? user.email : ''}. <Link className="link-btn" to="/my-settings">Back to My settings</Link>
        </p>
      </header>

      <section className="glass flex flex-col gap-3 p-6">
        <h2 className="font-serif">Photo</h2>
        <div className="flex flex-wrap items-center gap-4">
          <button
            className="btn"
            type="button"
            onClick={() => setViewing(true)}
          >
            {profilePhoto ? 'View photo' : 'Add a photo'}
          </button>
          <p className="text-muted">Saved to your account and available when you sign in on another device.</p>
        </div>
      </section>

      <form className="glass flex flex-col gap-4 p-6" onSubmit={changePassword}>
        <h2 className="font-serif">Change password</h2>
        <p className="text-muted">You will be signed out everywhere after you change it.</p>
        {error && <ErrorBanner>{error}</ErrorBanner>}
        <Field id="acct-current" label="Current password">
          <input
            type="password"
            autoComplete="current-password"
            required
            value={current}
            onChange={event => setCurrent(event.target.value)}
          />
        </Field>
        <Field id="acct-new" label="New password">
          <input
            type="password"
            autoComplete="new-password"
            required
            value={next}
            onChange={event => setNext(event.target.value)}
          />
        </Field>
        <Field id="acct-again" label="New password again">
          <input
            type="password"
            autoComplete="new-password"
            required
            value={again}
            onChange={event => setAgain(event.target.value)}
          />
        </Field>
        <div>
          <button className="btn" type="submit" disabled={sending}>
            {sending ? 'Changing...' : 'Change password'}
          </button>
        </div>
      </form>

      <section className="glass flex flex-col gap-3 p-6">
        <h2 className="font-serif">Log out everywhere</h2>
        <p className="text-muted">Ends every session on every device, including this one.</p>
        {leaveError && <ErrorBanner>{leaveError}</ErrorBanner>}
        <div>
          <button className="btn" type="button" onClick={logoutEverywhere} disabled={leaving}>
            {leaving ? 'Logging out...' : 'Log out everywhere'}
          </button>
        </div>
      </section>

      {viewing && (
        <PhotoViewer
          photo={profilePhoto}
          name={user ? user.name : ''}
          onClose={() => setViewing(false)}
          onPick={pickPhoto}
          busy={savingPhoto}
          error={photoError}
        />
      )}
    </div>
  );
}
