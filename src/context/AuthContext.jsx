import { useEffect, useState } from 'react';
import api from '../api/axios';
import { AuthContext } from './auth-context';
import { getDeviceContext } from '../lib/deviceContext';

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
        // If token is expired or invalid, clear the session so user is logged out
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('deviceId');
          setUser(null);
        }
        // For network errors, keep the cached session so offline users stay logged in
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
    return data;
  };

  const requestRegisterOtp = async ({ name, email, phone, password, role = 'viewer' }) => {
    const deviceContext = await getDeviceContext();
    const { data } = await api.post('/auth/register/request-otp', {
      name,
      email,
      phone,
      password,
      role,
      ...deviceContext,
    });

    return data;
  };

  const verifyRegisterOtp = async ({ email, otp }) => {
    const { data } = await api.post('/auth/register/verify-otp', {
      email,
      otp,
    });

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
    try {
      await api.post('/auth/logout');
    } catch {
      // Clear local state even if the server logout call fails.
    }

    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('deviceId');
    setUser(null);
  };

  const loginWithGoogle = async (credential) => {
    const deviceContext = await getDeviceContext();
    const { data } = await api.post('/auth/google', {
      credential,
      ...deviceContext,
    });
    const freshUser = normalize(data.user);
    localStorage.setItem('token', data.token);
    localStorage.setItem('deviceId', data.deviceId || deviceContext.deviceId);
    localStorage.setItem('user', JSON.stringify(freshUser));
    setUser(freshUser);
    return data;
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
