import { useEffect, useState } from 'react';
import api from '../api/axios';
import { AuthContext } from './auth-context';
import { getDeviceContext } from '../lib/deviceContext';
import { API_ORIGIN } from '../lib/config';
import { registerWebPush } from '../lib/pushNotifications';

function normalize(user) {
  if (!user) return null;
  return {
    ...user,
    email: user.email || '',
    phone: user.phone || '',
    contact: user.contact || user.email || user.phone || '',
    role: user.role || (user.isAdmin ? 'admin' : 'viewer'),
    subscription: user.subscription || { plan: 'free', active: false },
  };
}

// Skip /auth/me if we already verified within this browser session (5 min TTL).
// The user object from localStorage is already populated; this just keeps it fresh.
const ME_VERIFIED_KEY = 'crMeAt';
const ME_VERIFIED_TTL = 5 * 60 * 1000;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => normalize(JSON.parse(localStorage.getItem('user'))));

  useEffect(() => {
    if (!localStorage.getItem('token')) return;

    const lastVerified = Number(sessionStorage.getItem(ME_VERIFIED_KEY) || 0);
    if (Date.now() - lastVerified < ME_VERIFIED_TTL) return;

    // useCache:false — /auth/me is user-specific, must never be served from shared cache
    api.get('/auth/me', { useCache: false })
      .then((response) => {
        sessionStorage.setItem(ME_VERIFIED_KEY, String(Date.now()));
        const freshUser = normalize(response.data.user);
        localStorage.setItem('user', JSON.stringify(freshUser));
        setUser(freshUser);
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          sessionStorage.removeItem(ME_VERIFIED_KEY);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('deviceId');
          setUser(null);
        }
      });
  }, []);

  const login = async (identifier, password) => {
    const deviceContext = await getDeviceContext();
    let data;

    try {
      const response = await api.post('/auth/firebase/login', {
        email: identifier,
        password,
        ...deviceContext,
      });
      data = response.data;
    } catch {
      const response = await api.post('/auth/login', {
        identifier,
        password,
        ...deviceContext,
      });
      data = response.data;
    }

    const freshUser = normalize(data.user);
    localStorage.setItem('token', data.token);
    localStorage.setItem('deviceId', data.deviceId || deviceContext.deviceId);
    localStorage.setItem('user', JSON.stringify(freshUser));
    setUser(freshUser);
    registerWebPush().catch(() => {});
    return data;
  };

  const persistSession = (data, fallbackDeviceId) => {
    const freshUser = normalize(data.user);
    localStorage.setItem('token', data.token);
    localStorage.setItem('deviceId', data.deviceId || fallbackDeviceId);
    localStorage.setItem('user', JSON.stringify(freshUser));
    sessionStorage.setItem(ME_VERIFIED_KEY, String(Date.now()));
    setUser(freshUser);
    registerWebPush().catch(() => {});
    return { ...data, user: freshUser };
  };

  // ── Google Sign-In ────────────────────────────────────────────────────────
  const loginWithGoogle = async ({ credential, googleUserInfo } = {}) => {
    const deviceContext = await getDeviceContext();

    if (credential || googleUserInfo) {
      // Mobile path — pass token/userInfo directly
      const { data } = await api.post('/auth/google', { credential, googleUserInfo, ...deviceContext });
      return persistSession(data, deviceContext.deviceId);
    }

    // Web path — use Google Identity Services directly. This intentionally
    // avoids Firebase Auth: an expired Firebase web API key must not prevent
    // Google login when the Google OAuth client itself is correctly configured.
    let clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();
    if (!clientId) {
      try {
        const { data } = await api.get('/auth/google/config', { useCache: false });
        clientId = data?.clientId?.trim();
      } catch {
        // The server-owned popup below remains a last-resort fallback.
      }
    }
    if (!clientId) {
      // Production-safe fallback: the backend owns the OAuth client secret and
      // callback. This keeps Google login available even when a hosting build
      // omits the public VITE_GOOGLE_CLIENT_ID variable.
      const params = new URLSearchParams({
        deviceId: deviceContext.deviceId || '',
        deviceName: deviceContext.deviceName || 'Web Browser',
        origin: window.location.origin,
      });
      const authBase = API_ORIGIN || window.location.origin;
      const popup = window.open(
        `${authBase}/api/auth/google/authorize?${params}`,
        'lumina-google-oauth',
        'width=520,height=680,scrollbars=yes,resizable=yes',
      );
      if (!popup) throw new Error('Google popup was blocked. Allow popups and try again.');

      return new Promise((resolve, reject) => {
        const timeout = window.setTimeout(() => {
          cleanup();
          try { popup.close(); } catch { /* popup may already be closed */ }
          reject(new Error('Google Sign-In timed out. Please try again.'));
        }, 120000);
        const closedCheck = window.setInterval(() => {
          if (popup.closed) {
            cleanup();
            reject(new Error('Google Sign-In was cancelled.'));
          }
        }, 500);
        const cleanup = () => {
          window.clearTimeout(timeout);
          window.clearInterval(closedCheck);
          window.removeEventListener('message', onMessage);
        };
        const onMessage = (event) => {
          if (event.source !== popup) return;
          const { token, deviceId, user: userData, error } = event.data || {};
          if (!error && (!token || !userData)) return;
          cleanup();
          if (error) { reject(new Error(error)); return; }
          resolve(persistSession({ token, deviceId, user: userData }, deviceContext.deviceId));
        };
        window.addEventListener('message', onMessage);
      });
    }

    const google = await new Promise((resolve, reject) => {
      if (window.google?.accounts?.oauth2) { resolve(window.google); return; }
      const startedAt = Date.now();
      const timer = window.setInterval(() => {
        if (window.google?.accounts?.oauth2) {
          window.clearInterval(timer);
          resolve(window.google);
        } else if (Date.now() - startedAt > 8000) {
          window.clearInterval(timer);
          reject(new Error('Google Sign-In could not load. Check your connection and try again.'));
        }
      }, 100);
    });

    const accessToken = await new Promise((resolve, reject) => {
      const tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'openid email profile',
        prompt: 'select_account',
        callback: (response) => {
          if (response.error) {
            reject(new Error(response.error_description || response.error));
            return;
          }
          resolve(response.access_token);
        },
        error_callback: (error) => reject(new Error(
          error?.type === 'popup_failed_to_open'
            ? 'Google popup was blocked. Allow popups and try again.'
            : 'Google Sign-In was cancelled or could not open.'
        )),
      });
      tokenClient.requestAccessToken();
    });

    const profileResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!profileResponse.ok) throw new Error('Google profile verification failed. Please try again.');
    const verifiedGoogleProfile = await profileResponse.json();

    const { data } = await api.post('/auth/google', {
      credential: accessToken,
      googleUserInfo: verifiedGoogleProfile,
      ...deviceContext,
    });
    return persistSession(data, deviceContext.deviceId);
  };

  const requestRegisterOtp = async ({ name, email, phone, password, role = 'viewer' }) => {
    const deviceContext = await getDeviceContext();
    const { data } = await api.post('/auth/register/request-otp', {
      name, email, phone, password, role,
      ...deviceContext,
    });
    return data;
  };

  const verifyRegisterOtp = async ({ email, otp }) => {
    const { data } = await api.post('/auth/register/verify-otp', { email, otp });
    const freshUser = normalize(data.user);
    localStorage.setItem('token', data.token);
    localStorage.setItem('deviceId', data.deviceId);
    localStorage.setItem('user', JSON.stringify(freshUser));
    setUser(freshUser);
    return data;
  };

  const register = requestRegisterOtp;

  const refreshUser = async () => {
    try {
      const { data } = await api.get('/auth/me');
      const freshUser = normalize(data.user);
      localStorage.setItem('user', JSON.stringify(freshUser));
      setUser(freshUser);
      return freshUser;
    } catch {
      return user;
    }
  };

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch { /* local cleanup still signs the user out */ }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('deviceId');
    sessionStorage.removeItem(ME_VERIFIED_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        loginWithGoogle,
        refreshUser,
        register,
        requestRegisterOtp,
        verifyRegisterOtp,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
