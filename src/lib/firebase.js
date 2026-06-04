import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, getRedirectResult, signInWithRedirect } from 'firebase/auth';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY            || '',
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        || '',
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID         || '',
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID|| '',
  appId:             import.meta.env.VITE_FIREBASE_APP_ID             || '',
};

// Only initialize if we have the required config
// Only initialize if we have the required config
let app = null;
let auth = null;
let googleProvider = null;

try {
  // If API key is missing, avoid initializing Firebase and keep auth null
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY || '';
  if (apiKey.trim()) {
    app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    googleProvider.addScope('email');
    googleProvider.addScope('profile');
  } else {
    console.warn('VITE_FIREBASE_API_KEY is not set. Firebase auth disabled.');
  }
} catch (err) {
  console.warn('Firebase init failed:', err.message);
  auth = null;
  googleProvider = null;
}

export { auth, googleProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut };
