importScripts('/src/js/idb.js');
importScripts('/src/js/indexdb.js');

const CACHE_STATIS_NAME = 'static-v10';
const CAHCE_DYNAMIC_NAME = 'dynamic-v2';
let statisAssets = [
  '/',
  '/index.html',
  'offline.html',
  '/src/js/app.js',
  '/src/js/feed.js',
  '/src/js/idb.js',
  '/src/js/promise.js',
  '/src/js/fetch.js',
  '/src/js/material.min.js',
  '/src/css/app.css',
  '/src/css/feed.css',
  '/src/images/main-image.jpg',
  'https://fonts.googleapis.com/css?family=Roboto:400,700',
  'https://fonts.googleapis.com/icon?family=Material+Icons',
  'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css'
];

function trimCache(cacheName, maxItems) {
  caches.open(cacheName)
    .then(cache => {
      return cache.keys()
        .then(keys => {
          if (keys.length > maxItems) {
            cache.delete(keys[0])
              .then(trimCache(cacheName, maxItems));
          }
        })
    })

}

self.addEventListener('install', function (event) {
  console.log('[Service Worker] Installing Service Worker ...', event);
  // caches is async tasks therefore we have to wait until it is processed
  event.waitUntil(
    caches.open(CACHE_STATIS_NAME)
      .then(cache => {
        console.log('Service Worker: precaching app shell');
        cache.addAll(statisAssets);
      })
  )
});

self.addEventListener('activate', function (event) {
  console.log('[Service Worker] Activating Service Worker ....', event);
  event.waitUntil(
    caches.keys()
      .then(keyList => {
        return Promise.all(keyList.map(key => {
          if (key !== CACHE_STATIS_NAME && key !== CAHCE_DYNAMIC_NAME) {
            return caches.delete(key);
          }
        }));
      })
  );
  return self.clients.claim();
});


// self.addEventListener('fetch', function (event) {
//   event.respondWith(
//     caches.match(event.request)
//       .then(response => {
//         if (response) {
//           return response;
//         } else {
//           return fetch(event.request)
//             .then(res => {
//               return caches.open(CAHCE_DYNAMIC_NAME)
//                 .then(cache => {
//                   cache.put(event.request.url, res.clone());
//                   return res;
//                 })
//             })
//             .catch(err => {
//               return caches.open(CACHE_STATIS_NAME)
//                 .then(cache => {
//                   return cache.match('/offline.html');
//                 });
//             });
//         }
//       })
//   );
//
//
// });


// cache-only strategy
// self.addEventListener('fetch', function (event) {
//   event.respondWith(
//     caches.match(event.request)
//   );
// });

// network-only strategy
// self.addEventListener('fetch', function (event) {
//   event.respondWith(
//     fetch(event.request)
//   );
// });


// self.addEventListener('fetch', function (event) {
//   event.respondWith(
//     fetch(event.request)
//       .then(res => {
//         return caches.open(CAHCE_DYNAMIC_NAME)
//                 .then(cache => {
//                   cache.put(event.request.url, res.clone());
//                   return res;
//                 })
//       })
//       .catch(err => {
//         return caches.match(event.request)
//       })
//   );
// });


function isInArray(string, array) {
  for (let i = 0; i < array.length; i++) {
    if (array[i] === string) {
      return true;
    }
  }
  return false;
}

self.addEventListener('fetch', function (event) {
  let url = 'https://pwagram-5d1f3.firebaseio.com/posts.json';

  if (event.request.url.indexOf(url) > -1) {
    event.respondWith(
       fetch(event.request)
        .then(res => {
          let clonedRes = res.clone();
          clearAllData('posts')
            .then(() => {
              return clonedRes.json()
            })
            .then(data => {
              for (let key in data) {
                writeData('posts', data[key]);
              }
            });
          return res;
        })
  )
  } else if(isInArray(event.request.url, statisAssets)) {
    event.respondWith(
      caches.match(event.request)
    );
  }else {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          if (response) {
            return response;
          } else {
            return fetch(event.request)
              .then(res => {
                return caches.open(CAHCE_DYNAMIC_NAME)
                  .then(cache => {
                    // trimCache(CAHCE_DYNAMIC_NAME, 3);
                    cache.put(event.request.url, res.clone());
                    return res;
                  })
              })
              .catch(err => {
                return caches.open(CACHE_STATIS_NAME)
                  .then(cache => {
                    if (event.request.headers.get('accept').includes('text/html')) {
                      return cache.match('/offline.html');
                    }
                  });
              });
          }
        })
    );
  }
});

self.addEventListener('sync', (event) => {
  console.log('[Service Worker] background syncing', event);
  if (event.tag === 'sync-posts') {
    console.log('[Service Worker] Syncing new Posts');
    event.waitUntil(
      readAllData('sync-posts')
        .then(data => {
          for (let dt of data) {
            fetch('https://us-central1-pwagram-5d1f3.cloudfunctions.net/storePostData', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
              },
              body: JSON.stringify({
                id: dt.id,
                title: dt.title,
                location: dt.location,
                image: 'whatever image'
              })
            })
              .then(res => {
                console.log('Sent data', res);
                if (res.ok) {
                  res.json()
                    .then(resData => {
                      deleteItemFromData('sync-posts', resData.id);
                    })
                }
              })
          }
        })
        .catch(err => {
          console.log('Error while sending data', err);
        })
    );
  }
});


self.addEventListener('notificationclick', (event) => {
  let notification = event.notification;
  let action = event.action;

  console.log(notification);

  if (action === 'confirm') {
    console.log('Confirm chosen');
  } else {
    console.log(action);
    event.waitUntil(
      clients.matchAll()
        .then(clis => {
          let client = clis.find(c => {
            return c.visibilityState === 'visible';
          });

          if (client !== undefined) {
            client.navigate(notification.data.url);
            client.focus();
          } else {
            clients.openWindow(notification.data.url);
          }
        })
    );
  }
  notification.close();
});

self.addEventListener('notificationclose', () => {
  console.log('Notification was closed :' + event);
});

self.addEventListener('push', (event) => {
  console.log('Push notification received', event);

  let data = {title: 'New!', content: 'Something new happened', openUrl: '/'};
  if (event.data) {
    data = JSON.parse(event.data.text());
  }

  let options = {
    body: data.content,
    icon: '/src/images/icons/app-icon-96x96.png',
    badge: '/src/images/icons/app-icon-96x96.png',
    data: {
      url: data.openUrl
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )

});
