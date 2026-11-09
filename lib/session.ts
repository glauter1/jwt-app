export type SessionUser = {
  id: number;
  name: string;
  email: string;
  isAdmin: boolean;
};

const ACCESS_KEY = 'accessToken';
const REFRESH_KEY = 'refreshToken';
const USER_KEY = 'user';

const noNavegador = () => typeof window !== 'undefined';

export function getAccessToken(): string | null {
  return noNavegador() ? localStorage.getItem(ACCESS_KEY) : null;
}

export function getRefreshToken(): string | null {
  return noNavegador() ? localStorage.getItem(REFRESH_KEY) : null;
}

export function getUser(): SessionUser | null {
  if (!noNavegador()) return null;
  try {
    const texto = localStorage.getItem(USER_KEY);
    return texto ? (JSON.parse(texto) as SessionUser) : null;
  } catch {
    return null;
  }
}

export function saveTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(ACCESS_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function saveSession(accessToken: string, refreshToken: string, user: SessionUser) {
  saveTokens(accessToken, refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
}