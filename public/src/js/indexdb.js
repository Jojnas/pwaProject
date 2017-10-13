let dbPromise = idb.open('posts-store', 1,db => {
  if (!db.objectStoreNames.contains('posts')) {
    db.createObjectStore('posts', {keyPath: 'id'});
  }
  if (!db.objectStoreNames.contains('sync-posts')) {
    db.createObjectStore('sync-posts', {keyPath: 'id'});
  }
});

function writeData(store, data) {
  return dbPromise
    .then(db => {
      let tx = db.transaction(store, 'readwrite');
      let storage = tx.objectStore(store);
      storage.put(data);
      return tx.complete;
    });
}

function readAllData(store) {
  return dbPromise
    .then(db => {
      let tx = db.transaction(store, 'readonly');
      let storage = tx.objectStore(store);
      return storage.getAll();
    })
}

function clearAllData(store) {
  return dbPromise
    .then(db => {
      let tx = db.transaction(store, 'readwrite');
      let storage = tx.objectStore(store);
      storage.clear();
      return tx.complete;
    });
}

function deleteItemFromData(store, id) {
   dbPromise
    .then(db => {
      let tx = db.transaction(store, 'readwrite');
      let storage = tx.objectStore(store);
      storage.delete(id);
      return tx.complete;
    })
    .then(() => {
    console.log('Item deteled');
    })
}

function urlBase64ToUint8Array(base64String) {
  let padding = '='.repeat((4 - base64String.length % 4) % 4);
  let base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  let rawData = window.atob(base64);
  let outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function dataURItoBlob(dataURI) {
  let byteString = atob(dataURI.split(',')[1]);
  let mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
  let ab = new ArrayBuffer(byteString.length);
  let ia = new Uint8Array(ab);
  for (let i =0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  let blob = new Blob([ab], {type: mimeString});
  return blob;
}