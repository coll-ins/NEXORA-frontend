import { Link } from 'react-router-dom';
import AppearanceCard from '../../components/AppearanceCard.jsx';
import MyDetails from '../../components/MyDetails.jsx';

export default function MySettings() {
  return (
    <div className="my-settings-page flex flex-col gap-6">
      <style>{`
        html[data-mode="dark"] .my-settings-page [role="radio"] {
          background-color: var(--pop);
          border-color: var(--edge);
          color: var(--ink);
        }
        html[data-mode="dark"] .my-settings-page [role="radio"] small {
          color: var(--muted);
        }
        html[data-mode="dark"] .my-settings-page [aria-labelledby="ap-h"] > div:last-child {
          background-color: var(--glass-a);
          border-color: var(--edge);
          color: var(--ink);
        }
      `}</style>
      <header className="flex flex-col gap-1">
        <p className="text-muted">Choose how Nexora looks for you.</p>
      </header>

      <AppearanceCard />

      <MyDetails />

      <section className="glass flex flex-col gap-3 p-6">
        <h2 className="font-serif">Account</h2>
        <p className="text-muted">Change your password or sign out everywhere.</p>
        <div>
          <Link className="btn" to="/account">Open account settings</Link>
        </div>
      </section>
    </div>
  );
}
