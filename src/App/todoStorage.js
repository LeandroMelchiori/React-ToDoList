const DATABASE_NAME = 'taskflow-db';
const DATABASE_VERSION = 1;
const STORE_NAME = 'keyValue';

function canUseIndexedDB() {
  return typeof indexedDB !== 'undefined';
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function readFromIndexedDB(itemName) {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(itemName);

    request.onsuccess = () => resolve(request.result ?? null);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => database.close();
    transaction.onerror = () => reject(transaction.error);
  });
}

async function writeToIndexedDB(itemName, value) {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(value, itemName);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => database.close();
    transaction.onerror = () => reject(transaction.error);
  });
}

async function getStoredItem(itemName) {
  let lastError = null;

  if (canUseIndexedDB()) {
    try {
      const indexedItem = await readFromIndexedDB(itemName);

      if (indexedItem !== null) {
        return indexedItem;
      }
    } catch (error) {
      lastError = error;
    }
  }

  try {
    const localItem = localStorage.getItem(itemName);

    if (localItem !== null && canUseIndexedDB()) {
      writeToIndexedDB(itemName, localItem).catch(() => undefined);
    }

    return localItem;
  } catch (error) {
    lastError = error;
  }

  throw lastError;
}

async function setStoredItem(itemName, value) {
  let didPersist = false;
  let lastError = null;

  if (canUseIndexedDB()) {
    try {
      await writeToIndexedDB(itemName, value);
      didPersist = true;
    } catch (error) {
      lastError = error;
    }
  }

  try {
    localStorage.setItem(itemName, value);
    didPersist = true;
  } catch (error) {
    lastError = error;
  }

  if (!didPersist) {
    throw lastError;
  }
}

export { canUseIndexedDB, getStoredItem, setStoredItem };
