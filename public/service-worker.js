const CACHE_NAME = 'pwa-cache-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/treinamento.html',
    '/colaboradores.html',
    '/script.js',
    '/imagens/icon512px.png',
    '/imagens/icon192px.png',
    '/imagens/icon96px.png',
    '/imagens/screenshot-wide.png',
    '/imagens/screenshot-mobile.png',
    '/manifest.json',
    '/service-worker.js'
];

// Instala o Service Worker e armazena os arquivos no cache
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Arquivos em cache', urlsToCache);
                return Promise.all(urlsToCache.map(url => {
                    return fetch(url).then(response => {
                        if (!response.ok) {
                            throw new Error(`Falha ao buscar: ${url}`);
                        }
                        return cache.put(url, response);
                    }).catch(error => {
                        console.error(`Erro ao adicionar ao cache: ${url}`, error);
                    });
                }));
            })
            .catch(error => {
                console.error('Falha ao abrir o cache:', error);
            })
    );
});


// Ativa o Service Worker e limpa caches antigos
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (!cacheWhitelist.includes(cacheName)) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Intercepta as requisições e serve os arquivos do cache quando offline
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                return fetch(event.request);
            })
    );
});

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(function(registration) {
      console.log('Service Worker is active and ready:', registration);
    }).catch(function(error) {
      console.log('Service Worker registration failed:', error);
    });
  }