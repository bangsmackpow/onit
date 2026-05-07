/* public/sw.js - Extended for Push Notifications */

self.addEventListener('push', function(event) {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-maskable-192.png',
      vibrate: [100, 50, 100],
      data: {
        url: data.url || '/dashboard'
      },
      actions: [
        { action: 'open', title: 'View Task' },
        { action: 'close', title: 'Dismiss' }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  if (event.action === 'close') return;

  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});

// Original Workbox Import (Keep the existing precaching logic)
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js');

if (workbox) {
  workbox.precaching.precacheAndRoute(self.__WB_MANIFEST || []);
}
