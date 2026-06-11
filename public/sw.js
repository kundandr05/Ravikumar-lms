const CACHE_NAME = 'raviclasses-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // A simple pass-through fetch handler is enough to trigger the PWA install prompt in Chrome
  event.respondWith(fetch(event.request));
});
