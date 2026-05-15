import { createAuthClient } from 'better-auth/react';

const baseURL = import.meta.env.VITE_API_ORIGIN
  ? import.meta.env.VITE_API_ORIGIN.replace(/\/$/, '')
  : (import.meta.env.DEV ? 'http://localhost:5000' : '');

export const authClient = createAuthClient({
  baseURL,
  fetchOptions: {
    credentials: 'include',
  },
});

export const { signIn, signOut, signUp, useSession, getSession } = authClient;
