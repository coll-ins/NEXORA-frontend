import { lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import ErrorPage from './components/ErrorPage.jsx';
import { LogoDefs } from './components/Logo.jsx';
import { describe } from './lib/errors.js';
import { syncAppearance, watchAppearance } from './lib/appearance.js';
import { can as canPermission, homeFor, ROUTES } from './lib/perms.js';
import { useAsync } from './lib/useAsync.js';
import { clearTokens, onSessionEnded } from './lib/http.js';
import { SessionContext, useSession } from './lib/session.jsx';
import {
  afterSignIn,
  completeJoin as completeJoinSession,
  enterSacco as enterSaccoSession,
  restoreSession,
  selectSacco,
  signIn,
  signOut,
  loadMockPlaceholderFailure,
} from './api/session.js';
import NetBanner from './shell/NetBanner.jsx';
import PageState from './shell/PageState.jsx';
import RequireAuth from './shell/RequireAuth.jsx';
import RouteTransition from './shell/RouteTransition.jsx';
import { PAGE_IMPORTS } from './shell/pages.js';

const NETWORK_STATUS_EVENT = 'nexora:network-status';

function Placeholder({ title, path }) {
  const location = useLocation();
  const { pageKey, onErrorAction } = useSession();
  const result = useAsync(
    () => loadMockPlaceholderFailure(path, location.search),
    [path, location.search, pageKey],
  );

  useEffect(() => {
    if (
      (result.status === 'ready' || result.status === 'empty')
      && navigator.onLine
    ) {
      window.dispatchEvent(new CustomEvent(NETWORK_STATUS_EVENT, {
        detail: { status: 200 },
      }));
    }
  }, [result.status]);

  if (result.status === 'ready' && result.data && result.data.renderError) {
    throw new Error('Mock page render failure.');
  }

  if (result.status === 'error') {
    return (
      <PageState
        status={result.status}
        error={result.error}
        reload={result.reload}
        onAction={onErrorAction}
      />
    );
  }

  return (
    <div className="glass flex min-h-[30vh] flex-col items-center justify-center gap-2 p-6 text-center">
      <h1 className="font-serif">{title}</h1>
      <p className="text-muted">This page is being built.</p>
    </div>
  );
}

function makeLazyPage(path, title) {
  return lazy(async () => {
    const loader = PAGE_IMPORTS[path];
    if (!loader) return { default: () => <Placeholder title={title} path={path} /> };
    try {
      return await loader();
    } catch {
      return { default: () => <Placeholder title={title} path={path} /> };
    }
  });
}

const LandingPage = makeLazyPage('landing', 'NEXORA');

function StartRoute() {
  const { user, perms } = useSession();
  if (user) return <Navigate to={'/' + homeFor(perms)} replace />;
  return <LandingPage />;
}

function LogoutRoute() {
  const { logout } = useSession();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void logout();
  }, [logout]);

  return <main className="p-6 text-muted">Signing out...</main>;
}

function NotFoundRoute() {
  return <RequireAuth path={null} title="" />;
}

function SessionProvider({ children }) {
  const routerNavigate = useNavigate();
  const location = useLocation();
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);
  const [restoreError, setRestoreError] = useState(null);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [panelRequest, setPanelRequest] = useState('');
  const [pageKey, setPageKey] = useState(0);
  const [restoreAttempt, setRestoreAttempt] = useState(0);
  const [enteredSaccoId, setEnteredSaccoId] = useState(null);
  const openRef = useRef('');
  const toastTimer = useRef(null);
  const routerNavigateRef = useRef(routerNavigate);
  const pendingReturnToRef = useRef('');

  useEffect(() => {
    routerNavigateRef.current = routerNavigate;
  }, [routerNavigate]);

  useEffect(() => {
    if (session) {
      pendingReturnToRef.current = '';
      return;
    }

    if (!['/', '/login', '/register', '/verify', '/forgot', '/reset', '/logout'].includes(location.pathname)) {
      pendingReturnToRef.current = location.pathname + location.search;
    }
  }, [location.pathname, location.search, session]);

  const userId = session && session.user ? session.user.id : null;

  useEffect(() => {
    if (!ready) return;
    syncAppearance(userId);
    try {
      if (userId == null) localStorage.removeItem('nexora.lastUser');
      else localStorage.setItem('nexora.lastUser', String(userId));
    } catch {
      /* private mode: the look just lasts until reload */
    }
  }, [ready, userId]);

  useEffect(() => watchAppearance(() => userId), [userId]);
  const navigate = useCallback((to, options = {}) => {
    if (typeof to === 'number') {
      routerNavigate(to);
      return;
    }
    const { open, ...navigationOptions } = options;
    openRef.current = open || '';
    setPanelRequest(open || '');
    routerNavigate(to, navigationOptions);
  }, [routerNavigate]);

  const login = useCallback(async (email, password, selectedRole) => {
    const nextSession = await signIn(email, password, selectedRole);
    setSession(nextSession);
    setEnteredSaccoId(null);
    setSessionEnded(false);
    setRestoreError(null);
    const stateTarget = location.state && location.state.from;
    const target = typeof stateTarget === 'string' && stateTarget !== '/login'
      ? stateTarget
      : pendingReturnToRef.current;
    pendingReturnToRef.current = '';
    if (target === '/join') {
      navigate('/join', { replace: true });
      return;
    }

    const destination = afterSignIn(
      nextSession.saccos,
      nextSession.sourceUser,
      nextSession.perms,
    );
    if (destination.view === 'platform') {
      navigate(destination.path, { replace: true });
      return;
    }

    const returnTo = target && target !== '/enter'
      ? target
      : '/' + homeFor(nextSession.perms);
    navigate(destination.path, {
      replace: true,
      state: {
        from: returnTo,
        chooseSacco: destination.view === 'chooser',
        enterSelected: destination.view === 'enter',
      },
    });
  }, [location.state, navigate]);

  const logout = useCallback(async () => {
    await signOut();
    setSession(null);
    setEnteredSaccoId(null);
    setSessionEnded(false);
    pendingReturnToRef.current = '';
    navigate('/login', { replace: true });
  }, [navigate]);

  const switchSacco = useCallback(async saccoId => {
    if (session && String(session.saccoId) === String(saccoId)) return;
    const returnTo = location.state && typeof location.state.from === 'string'
      ? location.state.from
      : null;
    const nextSession = await selectSacco(session, saccoId);
    setEnteredSaccoId(null);
    setSession(nextSession);
    if (String(nextSession.sacco && nextSession.sacco.status || '').toLowerCase() === 'suspended') {
      navigate('/overview', { replace: true });
      return;
    }
    navigate('/enter', {
      replace: true,
      state: {
        chooseSacco: false,
        enterSelected: true,
        from: returnTo || '/overview',
      },
    });
  }, [session, location.state, navigate]);

  const enterSacco = useCallback(async (saccoId, pin) => {
    const nextSession = await enterSaccoSession(session, saccoId, pin);
    setSession(nextSession);
    setEnteredSaccoId(nextSession.saccoId);
    return nextSession;
  }, [session]);

  const completeJoin = useCallback(async joinResult => {
    const nextSession = await completeJoinSession(session, joinResult);
    setSession(nextSession);
    setEnteredSaccoId(null);
    return nextSession;
  }, [session]);

  const clearSessionEnded = useCallback(() => setSessionEnded(false), []);
  const clearPanelRequest = useCallback(() => {
    openRef.current = '';
    setPanelRequest('');
  }, []);
  const takeOpen = useCallback(kind => {
    const value = openRef.current;
    if (value.startsWith(kind + ':')) {
      openRef.current = '';
      return value.slice(kind.length + 1);
    }
    return null;
  }, []);
  const toast = useCallback((text, kind) => {
    setToastMessage({ text, kind });
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToastMessage(null), 2800);
  }, []);
  const retryPage = useCallback(() => {
    setPageKey(key => key + 1);
  }, []);
  const retryRestore = useCallback(() => {
    setRestoreError(null);
    setReady(false);
    setRestoreAttempt(attempt => attempt + 1);
  }, []);
  const onErrorAction = useCallback(action => {
    if (restoreError && action !== 'retry') {
      setRestoreError(null);
      setReady(true);
    }
    const startPage = '/' + homeFor(session ? session.perms : []);
    if (action === 'home') {
      navigate(startPage);
    } else if (action === 'back') {
      const historyIndex = window.history.state && window.history.state.idx;
      navigate(Number.isInteger(historyIndex) && historyIndex > 0 ? -1 : startPage);
    } else if (action === 'login') {
      navigate('/login');
    } else if (action === 'landing') {
      navigate('/');
    } else if (action === 'switcher') {
      navigate('/overview', { open: 'sacco:switcher' });
    } else if (action === 'account') {
      navigate('/account');
    } else if (action === 'retry') {
      if (restoreError) retryRestore();
      else retryPage();
    }
  }, [navigate, retryPage, retryRestore, restoreError, session]);

  useEffect(() => {
    let active = true;
    onSessionEnded(() => {
      clearTokens();
      if (!active) return;
      setSession(null);
      setEnteredSaccoId(null);
      setSessionEnded(true);
      setReady(true);
      routerNavigateRef.current('/login', { replace: true });
    });

    restoreSession()
      .then(restored => {
        if (!active) return;
        setSession(restored);
        setReady(true);
      })
      .catch(error => {
        if (!active) return;
        if (error && error.status === 401) {
          clearTokens();
          setSessionEnded(true);
          routerNavigateRef.current('/login', { replace: true });
        } else {
          setRestoreError(error);
        }
        setReady(true);
      });

    return () => {
      active = false;
      onSessionEnded(() => {});
      window.clearTimeout(toastTimer.current);
    };
  }, [restoreAttempt]);

  useEffect(() => {
    if (!restoreError) return undefined;
    window.addEventListener('online', retryRestore);
    return () => window.removeEventListener('online', retryRestore);
  }, [restoreError, retryRestore]);

  const can = useCallback(permission => (
    session ? canPermission(session.perms, permission) : false
  ), [session]);
  const value = useMemo(() => ({
    user: session ? session.user : null,
    role: session ? session.role : null,
    perms: session ? session.perms : [],
    can,
    saccoId: session ? session.saccoId : null,
    sacco: session ? session.sacco : null,
    saccos: session ? session.saccos : [],
    enteredSaccoId,
    enterSacco,
    completeJoin,
    panelRequest,
    clearPanelRequest,
    pageKey,
    retryPage,
    onErrorAction,
    navigate,
    switchSacco,
    takeOpen,
    toast,
    login,
    logout,
    sessionEnded,
    clearSessionEnded,
  }), [session, can, navigate, switchSacco, enterSacco, completeJoin, takeOpen, toast, login, logout, sessionEnded, clearSessionEnded, panelRequest, clearPanelRequest, pageKey, retryPage, onErrorAction, enteredSaccoId]);

  return (
    <SessionContext.Provider value={value}>
      <LogoDefs />
      <NetBanner />
      {ready
        ? restoreError
          ? <ErrorPage
            code={describe(restoreError, { mode: 'page' }).page || '500'}
            onAction={onErrorAction}
          />
          : children
        : <main className="p-6 text-muted">Restoring your session...</main>}
      <div
        className={`toast${toastMessage ? ' show' : ''}${toastMessage && toastMessage.kind === 'err' ? ' err' : ''}`}
        role="status"
      >
        {toastMessage ? toastMessage.text : ''}
      </div>
    </SessionContext.Provider>
  );
}

function AppRouter() {
  const publicRoutes = [
    ['login', 'Sign in'],
    ['register', 'Create an account'],
    ['verify', 'Verify your email'],
    ['forgot', 'Forgot password'],
    ['reset', 'Reset password'],
  ];
  const protectedExtras = [
    // The API links the code to the account making the request (POST /auth/join
    // reads g.user), so this page needs a session: RequireAuth sends a visitor
    // to sign in and the login route brings them back here afterwards.
    { path: 'join', title: 'Join a SACCO', checkPermission: false },
    { path: 'enter', title: 'Enter your SACCO', checkPermission: false },
    { path: 'account', title: 'Account settings', checkPermission: true },
    'styleguide',
  ];
  const LoginPage = makeLazyPage('login', 'Sign in');

  return (
    <SessionProvider>
      <Routes>
        <Route element={<RouteTransition />}>
          <Route path="/" element={<StartRoute />} />
          <Route path="/logout" element={<LogoutRoute />} />

          {publicRoutes.map(([path, title]) => {
            const Page = path === 'login' ? LoginPage : makeLazyPage(path, title);
            return <Route key={path} path={'/' + path} element={<Page />} />;
          })}

          {ROUTES.map(route => {
            const Page = makeLazyPage(route.path, route.title);
            return (
              <Route
                key={route.path}
                path={'/' + route.path}
                element={
                  <RequireAuth path={route.path} title={route.title}>
                    <Page />
                  </RequireAuth>
                }
              />
            );
          })}

          {protectedExtras.map(extra => {
            if (typeof extra === 'string') {
              const Page = makeLazyPage(extra, 'Style guide');
              return (
                <Route
                  key={extra}
                  path={'/' + extra}
                  element={
                    <RequireAuth path={extra} title="Style guide">
                      <Page />
                    </RequireAuth>
                  }
                />
              );
            }
            const Page = makeLazyPage(extra.path, extra.title);
            return (
              <Route
                key={extra.path}
                path={'/' + extra.path}
                element={
                  <RequireAuth
                    path={extra.path}
                    title={extra.title}
                    checkPermission={extra.checkPermission}
                  >
                    <Page />
                  </RequireAuth>
                }
              />
            );
          })}

          <Route path="*" element={<NotFoundRoute />} />
        </Route>
      </Routes>
    </SessionProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  );
}
