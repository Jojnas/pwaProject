const CACHE_STATIS_NAME = 'static-v4';
const CAHCE_DYNAMI_NAME = 'dynamic-v2';

self.addEventListener('install', function(event) {
  console.log('[Service Worker] Installing Service Worker ...', event);
  // caches is async tasks therefore we have to wait until it is processed
  event.waitUntil(
      caches.open(CACHE_STATIS_NAME)
          .then(cache => {
            console.log('Service Worker: precaching app shell');
            cache.addAll([
                '/',
                '/index.html',
                '/src/js/app.js',
                '/src/js/feed.js',
                '/src/js/promise.js',
                '/src/js/fetch.js',
                '/src/js/material.min.js',
                '/src/css/app.css',
                '/src/css/feed.css',
                '/src/images/main-image.jpg',
                'https://fonts.googleapis.com/css?family=Roboto:400,700',
                'https://fonts.googleapis.com/icon?family=Material+Icons',
                'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css'
            ]);
      })
  )
});

self.addEventListener('activate', function(event) {
  console.log('[Service Worker] Activating Service Worker ....', event);
  event.waitUntil(
      caches.keys()
          .then(keyList => {
              return Promise.all(keyList.map(key => {
                  if (key !== CACHE_STATIS_NAME && key !== CAHCE_DYNAMI_NAME) {
                      return caches.delete(key);
                  }
              }));
          })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
      caches.match(event.request)
          .then(response => {
             if (response) {
                 return response;
             } else {
                 return fetch(event.request)
                     .then(res => {
                         return caches.open(CAHCE_DYNAMI_NAME)
                             .then(cache => {
                                 cache.put(event.request.url, res.clone());
                                 return res;
                             })
                     })
                     .catch(err => {

                     });
             }
          })
  );


});