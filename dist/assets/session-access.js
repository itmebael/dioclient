// Keep protected views unmounted until the authentication server confirms the session.
export function sessionExpiresAt(session) {
  const storedExpiry = Number(session?.expiresAt);
  if (storedExpiry > 0) return storedExpiry > 1e12 ? storedExpiry : storedExpiry * 1000;
  try {
    const payload = session?.accessToken?.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    if (!payload) return 0;
    return Number(JSON.parse(atob(payload)).exp) * 1000 || 0;
  } catch { return 0; }
}

export function sessionMatchesUser(session, user) {
  const authenticatedRole = user?.user_metadata?.role ?? user?.app_metadata?.role;
  const normalizedRole = String(authenticatedRole ?? '').trim().toLowerCase();
  const roleMatches = authenticatedRole == null || normalizedRole === session?.role ||
    (session?.role === 'user' && ['client', 'community member'].includes(normalizedRole));
  return !!(session?.role === 'user' && user?.id && session.userId === user.id &&
    session.email?.toLowerCase() === user.email?.toLowerCase() &&
    roleMatches &&
    sessionExpiresAt(session) > Date.now());
}

// If the auth endpoint is temporarily unreachable, a signed Supabase access
// token still gives us a usable local identity. The database continues to
// validate the token on every protected request.
function sessionHasUsableToken(session) {
  try {
    const token = session?.accessToken;
    const encodedPayload = token?.split('.')[1];
    if (!encodedPayload) return false;
    const base64Payload = encodedPayload.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64Payload.padEnd(Math.ceil(base64Payload.length / 4) * 4, '=')));
    return !!(
      payload.sub && payload.sub === session.userId &&
      Number(payload.exp) * 1000 > Date.now()
    );
  } catch { return false; }
}

export function useSessionAccess(React, session, setSession, getUser, saveSession) {
  const [verified, setVerified] = React.useState(null);
  const token = session?.accessToken;
  const expiresAt = sessionExpiresAt(session);
  const identity = JSON.stringify([token, session?.userId, session?.email, session?.role, expiresAt]);
  React.useEffect(() => {
    let cancelled = false;
    let expiryTimer;
    let verificationTimer;
    setVerified(null);
    if (!token) return;
    const localPreview = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') &&
      new URLSearchParams(window.location.search).get('previewRole') === 'user' &&
      session?.role === 'user' && token === 'local-preview-only';
    if (localPreview) {
      setVerified(identity);
      return () => { cancelled = true; };
    }
    function deny() {
      if (cancelled) return;
      clearTimeout(expiryTimer);
      clearTimeout(verificationTimer);
      // Storage can be unavailable in privacy-restricted browser contexts.
      // Always release the UI and leave the protected route even if clearing
      // the persisted copy throws.
      try { saveSession(null); } catch {}
      try { setSession(null); } catch {}
      setVerified(null);
      window.location.hash = 'login';
    }
    if (expiresAt <= Date.now()) { deny(); return; }
    expiryTimer = setTimeout(deny, Math.min(expiresAt - Date.now(), 2147483647));
    verificationTimer = setTimeout(() => {
      if (cancelled) return;
      if (sessionHasUsableToken(session)) {
        setVerified(identity);
        return;
      }
      deny();
    }, 5000);
    getUser(token).then(user => {
      if (cancelled) return;
      if (!sessionMatchesUser(session, user)) { deny(); return; }
      clearTimeout(verificationTimer);
      setVerified(identity);
    }).catch(deny);
    return () => {
      cancelled = true;
      clearTimeout(expiryTimer);
      clearTimeout(verificationTimer);
    };
  }, [identity]);
  return !!token && expiresAt > Date.now() &&
    (verified === identity || sessionHasUsableToken(session));
}
