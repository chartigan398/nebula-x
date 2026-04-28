const CACHE_NAME = 'nebula-x-mobile-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './js/three.min.js',
  './js/nebula-namespace.js',
  './js/audio-core.js',
  './js/stability-monitor.js',
  './js/creator-presets.js',
  './js/user-profile.js',
  './js/render-core.js',
  './js/simulation-core.js',
  './js/gpu-points-material.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.map((key) => (
        key === CACHE_NAME ? null : caches.delete(key)
      ))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request)
      .then((cached) => cached || fetch(event.request))
  );
});
