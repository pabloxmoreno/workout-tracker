const CACHE_NAME = 'workout-tracker-v1';
const ASSETS = [
  './',
  './index.html',
  './css/styles.css',
  './js/app.js',
  './js/config.js',
  './js/store.js',
  './js/ui.js',
  './js/utils.js',
  './manifest.json'
];

// ✅ Instalacja - z error handling
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // Spróbuj cachować wszystkie assety
        return cache.addAll(ASSETS)
          .catch(err => {
            console.warn('Nie wszystkie assety zostały wczytane:', err);
            // Cachuj co najmniej krytyczne pliki
            return cache.addAll([
              './index.html',
              './manifest.json',
              './css/styles.css'
            ]);
          });
      })
      .catch(err => {
        console.error('Błąd cachowania:', err);
      })
  );
});

// ✅ Aktywacja - czyść stare cache
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.map((key) => {
        if (key !== CACHE_NAME) {
          console.log('Usuwam cache:', key);
          return caches.delete(key);
        }
      })
    ))
  );
});

// ✅ FETCH - bezpieczne cachowanie
self.addEventListener('fetch', (e) => {
  // ✅ Nigdy nie cachuj dynamicznych danych
  const url = new URL(e.request.url);
  
  // Lista endpointów które nie cachujemy
  const noCachePatterns = [
    'api/', // backend API
    'analytics', // tracking
    'sync', // synchronizacja
  ];
  
  const shouldNotCache = noCachePatterns.some(pattern => 
    url.pathname.includes(pattern)
  );
  
  if (shouldNotCache) {
    e.respondWith(fetch(e.request).catch(() => {
      // Jeśli brak internetu, spróbuj cache'a
      return caches.match(e.request);
    }));
    return;
  }
  
  // ✅ Dla pozostałych: cache first, fallback to network
  e.respondWith(
    caches.match(e.request)
      .then((response) => {
        // Jeśli w cache, zwróć
        if (response) return response;
        
        // Jeśli nie, pobierz z sieci i cachuj
        return fetch(e.request)
          .then((response) => {
            // Sprawdź czy request jest cacheable
            if (!response || response.status !== 200) {
              return response;
            }
            
            // Sklonuj response
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(e.request, responseToCache);
              });
            
            return response;
          })
          .catch(() => {
            // Jeśli brak sieci i brak cache, zwróć offline page
            return caches.match('./index.html');
          });
      })
  );
});
