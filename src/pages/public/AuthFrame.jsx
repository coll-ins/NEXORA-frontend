import AuthFx from './AuthFx.jsx';
import AuthScene from './AuthScene.jsx';

export default function AuthFrame({ eyebrow, heading, intro, effect = 'grid', scene = false, onSubmit, children }) {
  return (
    <main className="auth">
      <AuthFx effect={effect} />
      <div className="auth-inner">
        <div className="auth-copy">
          <h1 className="serif">{heading}</h1>
          {intro && <p>{intro}</p>}
          {scene && <AuthScene />}
        </div>
        <form
          className="glass auth-card"
          noValidate
          onSubmit={onSubmit || (event => event.preventDefault())}
        >
          <div className="eyebrow">{eyebrow}</div>
          {children}
        </form>
      </div>
    </main>
  );
}