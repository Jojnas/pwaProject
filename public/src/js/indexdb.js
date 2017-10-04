let dbPromise = idb.open('posts-store', 1,db => {
  if (!db.objectStoreNames.contains('posts')) {
    db.createObjectStore('posts', {keyPath: 'id'});
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