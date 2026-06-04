import { useEffect, useState } from 'react';
import api from '../api/axios';
import { AuthContext } from './auth-context';
import { getDeviceContext } from '../lib/deviceContext';
import { auth, googleProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut as firebaseSignOut } from '../lib/firebase';
import { GoogleAuthProvider } from 'firebase/auth';
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

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => normalize(JSON.parse(localStorage.getItem('user'))));

  useEffect(() => {
    if (!localStorage.getItem('token')) return;

    api.get('/auth/me')
      .then((response) => {
        const freshUser = normalize(response.data.user);
        localStorage.setItem('user', JSON.stringify(freshUser));
        setUser(freshUser);
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('deviceId');
          setUser(null);
        }
      });
    // Handle Firebase redirect sign-in result (if any)
    (async () => {
      try {
        if (!auth || !getRedirectResult) return;
        const result = await getRedirectResult(auth);
        if (result) {
          const deviceContext = await getDeviceContext();
          const googleCredential = GoogleAuthProvider.credentialFromResult(result);
          const idToken = googleCredential?.idToken || (await result.user.getIdToken());
          const userInfo = {
            sub: result.user.uid,
            email: result.user.email,
            name: result.user.displayName,
            picture: result.user.photoURL,
          };

          if (idToken) {
            const { data } = await api.post('/auth/google', {
              credential: idToken,
              googleUserInfo: userInfo,
              ...deviceContext,
            });
            const freshUser = normalize(data.user);
            localStorage.setItem('token', data.token);
            localStorage.setItem('deviceId', data.deviceId || deviceContext.deviceId);
            localStorage.setItem('user', JSON.stringify(freshUser));
            setUser(freshUser);
            registerWebPush().catch(() => {});
          }
        }
      } catch (e) {
        // ignore redirect errors here; they'll show in UI when user starts sign-in
      }
    })();
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

  // ── Google Sign-In via Firebase popup ─────────────────────────────────────
  const loginWithGoogle = async ({ credential, googleUserInfo } = {}) => {
    const deviceContext = await getDeviceContext();

    let idToken = credential;
    let userInfo = googleUserInfo;

    if (!idToken) {
      if (!auth || !googleProvider) {
        throw new Error('Google Sign-In is not configured. Please check Firebase settings.');
      }

      try {
        const result = await signInWithPopup(auth, googleProvider);
        const googleCredential = GoogleAuthProvider.credentialFromResult(result);
        idToken = googleCredential?.idToken || (await result.user.getIdToken());
        userInfo = userInfo || {
          sub: result.user.uid,
          email: result.user.email,
          name: result.user.displayName,
          picture: result.user.photoURL,
        };
      } catch (err) {
        // Friendly handling for common problems
        const msg = String(err?.message || err);
        if (err?.code === 'auth/popup-blocked' || msg.toLowerCase().includes('popup blocked')) {
          // Popup blocked — fallback to redirect flow which avoids popups
          try {
            await signInWithRedirect(auth, googleProvider);
            // Redirecting — returned flow will be handled on app load via getRedirectResult
            return;
          } catch (redirErr) {
            throw new Error('Google sign-in redirect failed. Please allow popups or try again.');
          }
        }

        if (msg.toLowerCase().includes('api key not valid') || err?.code === 'auth/invalid-api-key') {
          throw new Error('Firebase API key is invalid. Set a valid `VITE_FIREBASE_API_KEY` in cinemarwandafront-end/.env and restart the dev server.');
        }

        throw err;
      }
    }

    if (!idToken) {
      throw new Error('Unable to retrieve Google authentication token.');
    }

    const { data } = await api.post('/auth/google', {
      credential: idToken,
      googleUserInfo: userInfo,
      ...deviceContext,
    });

    const freshUser = normalize(data.user);
    localStorage.setItem('token', data.token);
    localStorage.setItem('deviceId', data.deviceId || deviceContext.deviceId);
    localStorage.setItem('user', JSON.stringify(freshUser));
    setUser(freshUser);
    registerWebPush().catch(() => {});
    return data;
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
