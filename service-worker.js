// S-Absensi QR — SMKN 7 Pandeglang Service Worker
const CACHE_NAME = 'sabsensi-cache-v3';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './logo.png',
  './logo-sekolah.png',
  './logo-aplikasi.png',
  './app-icon-512.png',
  './app-icon-192.png',
  './sounds/notify.wav',
  './manifest.json'
];

// Install event: Pre-cache core shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate event: Clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event: Network-first with cache fallback
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => caches.match(event.request))
  );
});

// Message listener from web app for native notification popups
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, icon, badge, vibrate, tag } = event.data;
    self.registration.showNotification(title, {
      body,
      icon: icon || './logo.png',
      badge: badge || './logo.png',
      vibrate: vibrate || [200, 100, 200],
      tag: tag || 'sabsensi_notif',
      renotify: true,
      requireInteraction: false
    });
  }
});

// Notification Click Event: Focus or Open App
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('./');
      }
    })
  );
});
