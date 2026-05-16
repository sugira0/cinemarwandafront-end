importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging-compat.js');

// These values are injected at build time via the service worker
// For now we use placeholder — replace with actual values in production
firebase.initializeApp({
  apiKey:            self.FIREBASE_API_KEY            || '',
  authDomain:        self.FIREBASE_AUTH_DOMAIN        || '',
  projectId:         self.FIREBASE_PROJECT_ID         || 'cinema-rwanda',
  storageBucket:     self.FIREBASE_STORAGE_BUCKET     || '',
  messagingSenderId: self.FIREBASE_MESSAGING_SENDER_ID|| '686661040590',
  appId:             self.FIREBASE_APP_ID             || '',
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  const { title = 'CINEMA Rwanda', body = '' } = payload.notification || {};
  const link = payload.data?.link || '/';

  self.registration.showNotification(title, {
    body,
    icon:  '/icon.png',
    badge: '/badge.png',
    data:  { link },
    actions: [{ action: 'open', title: 'Open App' }],
  });
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const link = event.notification.data?.link || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(link);
          return client.focus();
        }
      }
      return clients.openWindow(link);
    })
  );
});
