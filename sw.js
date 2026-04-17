const CACHE_NAME = 'workout-tracker-v2'; // Zmieniono wersję, aby wymusić aktualizację

// Używamy bezwzględnych ścieżek zaczynających się od /
const ASSETS = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/js/app.js',
  '/js/config.js',
  '/js/store.js',
  '/js/ui.js',
  '/js/utils.js',
  '/manifest.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS).catch(err => {
        console.warn('Nie udało się dodać niektórych plików do cache:', err);
        // Kontynuuj mimo błędu pojedynczego pliku
        return Promise.resolve(); 
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.map((key) => {
        if (key !== CACHE_NAME) return caches.delete(key);
      })
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => response || fetch(e.request))
  );
});
