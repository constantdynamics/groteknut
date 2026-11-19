// Service worker: zorgt dat Groteknut ook offline werkt.
const VERSION = 'groteknut-v4';
// Foto's staan in een eigen cache die bij een nieuwe app-versie blijft bestaan (dan hoeven ze niet opnieuw te downloaden).
const MEDIA = 'groteknut-media-v1';
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
  './js/craftmode.js',
  './js/worksheets.js',
  './js/data/meta.js',
  './js/data/materials.js',
  './js/data/activities.js',
  './js/data/recipes.js',
  './js/data/guide.js',
  './js/data/media.js',
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
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION && k !== MEDIA).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
      .then(() => { precacheMedia(); }),
  );
});

// De hoofdfoto's van alle ideeën op de achtergrond downloaden, zodat ze ook offline werken.
// Gaat er iets mis (geen netwerk), dan wordt het de volgende keer opnieuw geprobeerd.
let busy = false;
async function precacheMedia() {
  if (busy) return;
  busy = true;
  try {
    const res = await fetch('./media-list.json', { cache: 'no-cache' });
    if (!res.ok) return;
    const files = await res.json();
    const cache = await caches.open(MEDIA);
    const wanted = new Set(files.map((f) => new URL(f, self.registration.scope).href));
    const missing = [];
    for (const href of wanted) if (!(await cache.match(href))) missing.push(href);
    for (let i = 0; i < missing.length; i += 4) {
      await Promise.all(missing.slice(i, i + 4).map((href) => fetch(href).then((r) => (r.ok ? cache.put(href, r) : null)).catch(() => null)));
    }
  } catch { /* offline: later opnieuw */ } finally {
    busy = false;
  }
}

self.addEventListener('message', (event) => {
  if (event.data === 'precache-media') precacheMedia();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Foto's: eerst uit de fotocache; anders downloaden en bewaren (zo werkt een idee dat je opende ook offline).
  if (url.pathname.includes('/img/ideeen/')) {
    event.respondWith(
      caches.open(MEDIA).then(async (cache) => {
        const cached = await cache.match(req, { ignoreSearch: true });
        if (cached) return cached;
        try {
          const res = await fetch(req);
          if (res && res.ok) cache.put(req, res.clone());
          return res;
        } catch {
          return Response.error();
        }
      }),
    );
    return;
  }

  // De rest: eerst uit de cache (snel en offline), op de achtergrond verversen.
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
