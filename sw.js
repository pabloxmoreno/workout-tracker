const CACHE_NAME = 'tracker-fit-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './css/style.css',
  './js/config.js',
  './js/utils.js',
  './js/ui.js',
  './js/app.js',
  './manifest.json'
];

// Instalacja Service Workera - cache'owanie zasobów
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache opened');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .catch((err) => {
        console.error('Failed to cache assets:', err);
      })
  );
  // Aktywuj nowego SW od razu
  self.skipWaiting();
});

// Aktywacja - czyszczenie starych cache'ów
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Przejęcie kontroli nad otwartymi stronami
  self.clients.claim();
});

// Strategia fetch: Cache First, falling back to Network
self.addEventListener('fetch', (event) => {
  // Ignoruj żądania inne niż GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Jeśli znaleziono w cache, zwróć odpowiedź
        if (response) {
          return response;
        }
        
        // Jeśli nie ma w cache, pobierz z sieci
        return fetch(event.request)
          .then((networkResponse) => {
            // Sprawdź czy odpowiedź jest poprawna
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

            // Sklonuj odpowiedź, aby zapisać w cache i zwrócić użytkownikowi
            const responseToCache = networkResponse.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          })
          .catch(() => {
            // Fallback offline (np. strona błędu lub pusta odpowiedź)
            // Dla tej aplikacji zwracamy podstawowy HTML jeśli wszystko zawiedzie
            if (event.request.destination === 'document') {
               return caches.match('./index.html');
            }
          });
      })
  );
});
