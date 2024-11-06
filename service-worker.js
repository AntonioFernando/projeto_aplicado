const CACHE_NAME = 'pwa-cache-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/treinemento.html',
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
                console.log('Arquivos em cache');
                return cache.addAll(urlsToCache);
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