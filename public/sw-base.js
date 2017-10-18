importScripts('workbox-sw.prod.v2.1.0.js');
importScripts('/src/js/idb.js');
importScripts('/src/js/indexdb.js');

const workboxSW = new self.WorkboxSW();

workboxSW.router.registerRoute(/.*(?:googleapis|gstatic)\.com.*$/, workboxSW.strategies.staleWhileRevalidate({
  cacheName: 'google-fonts',
  cacheExpiration: {
    maxEntries: 3,
    maxAgeSeconds: 60 * 60 * 24 * 30
  }
}));

workboxSW.router.registerRoute('https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css', workboxSW.strategies.staleWhileRevalidate({
  cacheName: 'material-css'
}));

workboxSW.router.registerRoute(/.*(?:firebasestorage\.googleapis)\.com.*$/, workboxSW.strategies.staleWhileRevalidate({
  cacheName: 'post-images'
}));

workboxSW.router.registerRoute('https://pwagram-5d1f3.firebaseio.com/posts.json', (args) => {
  return fetch(args.event.request)
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
});

workboxSW.router.registerRoute((routeData) => {
  return (routeData.event.request.headers.get('accept').includes('text/html'));
}, (args) => {
  return caches.match(args.event.request)
    .then(response => {
      if (response) {
        return response;
      } else {
        return fetch(args.event.request)
          .then(res => {
            return caches.open('dynamic')
              .then(cache => {
                cache.put(args.event.request.url, res.clone());
                return res;
              })
          })
          .catch(err => {
            return caches.match('/offline.html')
              .then(res => {
                return res;
              });
          });
      }
    })
});

self.addEventListener('sync', (event) => {
  console.log('[Service Worker] background syncing', event);
  if (event.tag === 'sync-posts') {
    console.log('[Service Worker] Syncing new Posts');
    event.waitUntil(
      readAllData('sync-posts')
        .then(data => {
          for (let dt of data) {
            let postData = new FormData();
            postData.append('id', dt.id);
            postData.append('title', dt.title);
            postData.append('location', dt.location);
            postData.append('rawLocationLat', dt.rawLocation.lat);
            postData.append('rawLocationLng', dt.rawLocation.lng);
            postData.append('file', dt.picture, dt.id + '.png');
            fetch('https://us-central1-pwagram-5d1f3.cloudfunctions.net/storePostData', {
              method: 'POST',
              body: postData
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

workboxSW.precache([]);