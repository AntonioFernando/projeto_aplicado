const CACHE_NAME = 'pwa-cache-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/treinamento.html',
    '/colaboradores.html',
    '/styles.css',
    '/script.js',
    '/imagens/icon512px.png',
    '/imagens/icon192px.png',
    '/imagens/icon96px.png',
    '/imagens/screenshot-wide.png',
    '/imagens/screenshot-mobile.png',
    'imagens/fundo.jpg',
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

                return fetch(event.request).then(response => {
                    // Se a resposta for válida, armazene no IndexedDB
                    if (event.request.url.includes('/api/')) {
                        storeInIndexedDB(event.request, response.clone());
                    }
                    return response;
                });
            })
    );
});

function storeInIndexedDB(request, response) {
    const openRequest = indexedDB.open('appDataDB', 1);

    openRequest.onupgradeneeded = function(e) {
        const db = e.target.result;
        const store = db.createObjectStore('apiResponses', { keyPath: 'url' });
    };

    openRequest.onsuccess = function(e) {
        const db = e.target.result;
        const transaction = db.transaction(['apiResponses'], 'readwrite');
        const store = transaction.objectStore('apiResponses');
        const data = {
            url: request.url,
            response: response
        };
        store.put(data);
    };
}

function getFromIndexedDB(url) {
    return new Promise((resolve, reject) => {
        const openRequest = indexedDB.open('appDataDB', 1);

        openRequest.onsuccess = function(e) {
            const db = e.target.result;
            const transaction = db.transaction(['apiResponses'], 'readonly');
            const store = transaction.objectStore('apiResponses');
            const request = store.get(url);

            request.onsuccess = function() {
                resolve(request.result ? request.result.response : null);
            };
            request.onerror = function() {
                reject('Erro ao recuperar dados do IndexedDB');
            };
        };
    });
}

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(function(registration) {
      console.log('Service Worker is active and ready:', registration);
    }).catch(function(error) {
      console.log('Service Worker registration failed:', error);
    });
  }