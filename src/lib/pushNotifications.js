import api from '../api/axios';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

/**
 * Register for web push notifications.
 * All Firebase messaging imports are lazy so they never crash the app.
 */
export async function registerWebPush() {
  // Guard: needs browser APIs + VAPID key configured
  if (typeof window === 'undefined') return;
  if (!('Notification' in window)) return;
  if (!('serviceWorker' in navigator)) return;
  if (!VAPID_KEY) return; // not configured yet — skip silently

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

    // Lazy import — only loads Firebase messaging when actually needed
    const { getMessaging, getToken, onMessage } = await import('firebase/messaging');
    const { getApps, initializeApp } = await import('firebase/app');

    const firebaseConfig = {
      apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId:             import.meta.env.VITE_FIREBASE_APP_ID,
    };

    const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    const messaging = getMessaging(app);

    // Register service worker
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (!token) return;

    // Send token to backend
    await api.post('/notifications/push-token', { token, platform: 'web' });

    // Handle foreground messages
    onMessage(messaging, (payload) => {
      const { title, body } = payload.notification || {};
      if (title && document.visibilityState === 'hidden') {
        new Notification(title, { body, icon: '/icon.png' });
      }
      window.dispatchEvent(new CustomEvent('cinema-push', { detail: payload }));
    });
  } catch (err) {
    // Never crash the app over push notification failures
    console.warn('Web push registration skipped:', err.message);
  }
}
