// Keep protected views unmounted until the authentication server confirms the session.
export function sessionExpiresAt(session) {
  if (Number(session?.expiresAt) > 0) return Number(session.expiresAt) * 1000;
  try {
    const payload = session.accessToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return Number(JSON.parse(atob(payload)).exp) * 1000 || 0;
  } catch { return 0; }
}

export function sessionMatchesUser(session, user) {
  return !!(session?.role === 'user' && user?.id && session.userId === user.id &&
    session.email?.toLowerCase() === user.email?.toLowerCase() &&
    session.role === user.user_metadata?.role &&
    sessionExpiresAt(session) > Date.now());
}

export function useSessionAccess(React, session, setSession, getUser, saveSession) {
  const [verified, setVerified] = React.useState(null);
  const token = session?.accessToken;
  const expiresAt = sessionExpiresAt(session);
  const identity = JSON.stringify([token, session?.userId, session?.email, session?.role, expiresAt]);
  React.useEffect(() => {
    let cancelled = false;
    let timer;
    setVerified(null);
    if (!token) return;
    function deny() {
      if (cancelled) return;
      saveSession(null);
      setSession(null);
      setVerified(null);
      window.location.hash = 'login';
    }
    if (expiresAt <= Date.now()) { deny(); return; }
    timer = setTimeout(deny, Math.min(expiresAt - Date.now(), 2147483647));
    getUser(token).then(user => {
      if (cancelled) return;
      if (!sessionMatchesUser(session, user)) { deny(); return; }
      setVerified(identity);
    }).catch(deny);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [identity]);
  return !!token && verified === identity && expiresAt > Date.now();
}
