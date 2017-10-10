
let deferredPrompt;
let enableNotificationsButtons = document.querySelector('.enable-notifications');

if (!window.Promise) {
  window.Promise = Promise;
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/sw.js')
    .then(function () {
      console.log('Service worker registered!');
    })
    .catch(function(err) {
      console.log(err);
    });
}

window.addEventListener('beforeinstallprompt', function(event) {
  console.log('beforeinstallprompt fired');
  event.preventDefault();
  deferredPrompt = event;
  return false;
});

function displayConfirmNotification() {
  if ('serviceWorker' in navigator) {
    let options = {
      body: 'Ouu yeeaaaah',
      icon: '/src/images/icons/app-icon-96x96.png',
      image: '/src/images/sf-boat.jpg',
      dir: 'ltr',
      lang: 'en-US',
      vibrate: [100, 50, 200],
      badge: '/src/images/icons/app-icon-96x96.png',
      tag: 'confirm-notification',
      renotify: true,
      actions: [
        {
          action: 'confirm',
          title: 'Okay',
          icon: '/src/images/icons/app-icon-96x96.png'
        },
        {
          action: 'cancel',
          title: 'Cancel',
          icon: '/src/images/icons/app-icon-96x96.png'
        }
      ]
    };
    navigator.serviceWorker.readyState.then((swreg) => {
      swreg.showNotification('Successfully subscribed!', options);
    });
  }
}

function configurePushSub() {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  let reg;
  navigator.serviceWorker.ready
    .then((swreg) => {
      reg = swreg;
      return swreg.pushManager.getSubscription();
    })
    .then((sub) => {
      if (sub === null) {
        // create a new subscription
        let vapidPublicKey = 'BGD6RPtx50ztltlmtY2QOkndaxfg4SstpuBaGShsm4hR2WoqhuyWf02ipT4yk48MdZTXxv2oPkXuqrQdGoBpRj8';
        let convertedVapidpuclicKey = urlBase64ToUint8Array(vapidPublicKey);
        return reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidpuclicKey
        });

      } else {
        // we have a subscription

      }
    })
    .then((newSub) => {
      return fetch('https://pwagram-5d1f3.firebaseio.com/subscriptions.json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(newSub)
      })
    })
    .then((res) => {
    if (res.ok) {
      displayConfirmNotification();
    }
    })
    .catch((err) => {
      console.log(err)
    })
}

function askForNotificationPermission() {
  Notification.requestPermission((result) => {
    console.log(result);
    if (result !== 'granted') {
      console.log('no permission granted');
    } else {
      configurePushSub();
      // displayConfirmNotification();
    }
  })
}

if ('Notification' in window && 'serviceWorker' in navigator) {
  for (let i = 0; i < enableNotificationsButtons.length; i++) {
    console.log(enableNotificationsButtons[i]);
    enableNotificationsButtons[i].style.display = 'inline-block';
    enableNotificationsButtons[i].addEventListener('click', askForNotificationPermission);

  }
}