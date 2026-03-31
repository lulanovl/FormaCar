const TOKEN_KEY = 'fc_token';
const TOKEN_TS_KEY = 'fc_token_ts';
const TOKEN_TTL = 24 * 60 * 60 * 1000; // 24h

export function saveToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(TOKEN_TS_KEY, Date.now().toString());
}

export function getToken() {
  const token = localStorage.getItem(TOKEN_KEY);
  const ts = parseInt(localStorage.getItem(TOKEN_TS_KEY) || '0', 10);
  if (!token || Date.now() - ts > TOKEN_TTL) {
    clearToken();
    return null;
  }
  return token;
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_TS_KEY);
}

export function isAuthenticated() {
  return !!getToken();
}
