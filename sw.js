// Service worker: zorgt dat Groteknut ook offline werkt.
const VERSION = 'groteknut-v3';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/style.css',
  './js/app.js',
  './js/store.js',
  './js/util.js',
  './js/season.js',
  './js/photos.js',
  './js/data/meta.js',
  './js/data/materials.js',
  './js/data/activities.js',
  './js/data/recipes.js',
  './js/data/guide.js',
  './fonts/nunito-latin.woff2',
  './fonts/nunito-latin-ext.woff2',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Eerst uit de cache (snel en offline), op de achtergrond verversen.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.open(VERSION).then(async (cache) => {
      const cached = await cache.match(req, { ignoreSearch: true });
      const network = fetch(req)
        .then((res) => {
          if (res && res.ok && res.type === 'basic') cache.put(req, res.clone());
          return res;
        })
        .catch(async () => cached || (req.mode === 'navigate' ? cache.match('./index.html') : Response.error()));
      return cached || network;
    }),
  );
});
