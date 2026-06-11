import { useEffect, useState } from 'react';
import api from '../api/axios';
import { AuthContext } from './auth-context';
import { getDeviceContext } from '../lib/deviceContext';
import { auth, signOut as firebaseSignOut } from '../lib/firebase';
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

  // ── Google Sign-In via server-side OAuth popup ────────────────────────────
  const loginWithGoogle = async ({ credential, googleUserInfo } = {}) => {
    const deviceContext = await getDeviceContext();

    if (credential || googleUserInfo) {
      // Mobile path — pass token/userInfo directly
      const { data } = await api.post('/auth/google', { credential, googleUserInfo, ...deviceContext });
      const freshUser = normalize(data.user);
      localStorage.setItem('token', data.token);
      localStorage.setItem('deviceId', data.deviceId || deviceContext.deviceId);
      localStorage.setItem('user', JSON.stringify(freshUser));
      setUser(freshUser);
      registerWebPush().catch(() => {});
      return data;
    }

    // Web path — open backend-driven OAuth popup
    const params = new URLSearchParams({
      deviceId: deviceContext.deviceId || '',
      deviceName: deviceContext.deviceName || 'Web Browser',
      origin: window.location.origin,
    });
    const popup = window.open(
      `${API_ORIGIN}/api/auth/google/authorize?${params}`,
      'google-oauth',
      'width=520,height=620,scrollbars=yes,resizable=yes'
    );
    if (!popup) throw new Error('Popup blocked. Please allow popups for this site and try again.');

    return new Promise((resolve, reject) => {
      const onMessage = (event) => {
        if (event.origin !== API_ORIGIN) return;
        cleanup();
        const { token, deviceId, user: userData, error } = event.data || {};
        if (error) { reject(new Error(error)); return; }
        const freshUser = normalize(userData);
        localStorage.setItem('token', token);
        localStorage.setItem('deviceId', deviceId || deviceContext.deviceId);
        localStorage.setItem('user', JSON.stringify(freshUser));
        setUser(freshUser);
        registerWebPush().catch(() => {});
        resolve({ token, deviceId, user: freshUser });
      };
      const checkClosed = setInterval(() => {
        if (popup.closed) { cleanup(); reject(new Error('Sign-in cancelled.')); }
      }, 500);
      const cleanup = () => {
        window.removeEventListener('message', onMessage);
        clearInterval(checkClosed);
      };
      window.addEventListener('message', onMessage);
    });
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
    try { await api.post('/auth/logout'); } catch {}
    try { await firebaseSignOut(auth); } catch {}
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
