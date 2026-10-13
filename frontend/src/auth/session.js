export const SESSION_KEY = 'mezyad.account.session';

export function validUser(value) {
  return !!value && typeof value.id === 'string' && !!value.id
    && typeof value.name === 'string' && !!value.name.trim()
    && typeof value.email === 'string' && !!value.email
    && ['USER', 'ADMIN'].includes(value.role);
}

export function validSession(value) {
  return !!value && typeof value.token === 'string'
    && /^[a-f0-9]{64}$/.test(value.token) && validUser(value.user);
}

// Store only the session token and display summary; never store a password.
// The server, not this display summary, authorizes protected operations.
export function saveSession(session) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ token: session.token, user: {
      id: session.user.id, name: session.user.name, email: session.user.email, role: session.user.role,
    } }));
    return true;
  } catch { return false; }
}

export function clearStoredSession() {
  try { sessionStorage.removeItem(SESSION_KEY); } catch { /* Storage may be disabled. */ }
}

export function readSession() {
  try {
    const stored = JSON.parse(sessionStorage.getItem(SESSION_KEY));
    if (validSession(stored)) return stored;
  } catch { /* Ignore invalid or unavailable storage. */ }
  clearStoredSession();
  return null;
}
