// Service Worker – Peloton Fantasy 2026
// Opdater CACHE_NAME når du deployer en ny version, så gamle caches ryddes
const CACHE_NAME = 'peloton-fantasy-v1';

// Filer der gemmes lokalt ved installation (app shell)
const PRECACHE_URLS = [
  '/Cykelspil/',
  '/Cykelspil/index.html',
];

// === INSTALLATION ===
// Kører første gang service workeren registreres
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS))
  );
  // Aktivér straks uden at vente på at gamle faner lukkes
  self.skipWaiting();
});

// === AKTIVERING ===
// Ryd gamle caches fra tidligere versioner
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// === FETCH – Network First strategi ===
// Forsøg altid netværket først (så Firebase-data er frisk),
// fald tilbage på cache hvis offline
self.addEventListener('fetch', event => {
  // Ignorer non-GET og browser-extension requests
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith('http')) return;

  // Firebase og eksterne API-kald: kun netværk, ingen cache
  const isExternal =
    event.request.url.includes('firebaseio.com') ||
    event.request.url.includes('googleapis.com') ||
    event.request.url.includes('gstatic.com');

  if (isExternal) {
    event.respondWith(fetch(event.request));
    return;
  }

  // App shell: netværk først, cache som fallback
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Gem en kopi i cache hvis det lykkedes
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
