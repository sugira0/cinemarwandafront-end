import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import api from '../api/axios';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

let messaging = null;

function getMessagingInstance() {
  if (messaging) return messaging;
  try {
    const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    messaging = getMessaging(app);
    return messaging;
  } catch {
    return null;
  }
}

export async function registerWebPush() {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return;
  if (!VAPID_KEY) return; // not configured

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

    const msg = getMessagingInstance();
    if (!msg) return;

    // Register service worker
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

    const token = await getToken(msg, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (!token) return;

    // Send token to backend
    await api.post('/notifications/push-token', { token, platform: 'web' });

    // Handle foreground messages (show as toast/notification bell update)
    onMessage(msg, (payload) => {
      const { title, body } = payload.notification || {};
      if (title && 'Notification' in window && document.visibilityState === 'hidden') {
        new Notification(title, { body, icon: '/icon.png' });
      }
      // Dispatch event so NotificationBell can refresh
      window.dispatchEvent(new CustomEvent('cinema-push', { detail: payload }));
    });
  } catch (err) {
    console.warn('Web push registration failed:', err.message);
  }
}
