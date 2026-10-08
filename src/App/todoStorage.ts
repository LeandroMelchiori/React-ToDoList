const DATABASE_NAME = 'taskflow-db';
const DATABASE_VERSION = 2;
const STORE_NAME = 'keyValue';
const ATTACHMENT_STORE_NAME = 'attachments';
const ATTACHMENT_TODO_INDEX = 'todoId';
let databaseConnection: IDBDatabase | null = null;
let pendingDatabaseConnection: Promise<IDBDatabase> | null = null;

function canUseIndexedDB(): boolean {
  return typeof indexedDB !== 'undefined';
}

function openDatabase(): Promise<IDBDatabase> {
  if (databaseConnection) {
    return Promise.resolve(databaseConnection);
  }

  if (pendingDatabaseConnection) {
    return pendingDatabaseConnection;
  }

  pendingDatabaseConnection = new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME);
      }

      if (!database.objectStoreNames.contains(ATTACHMENT_STORE_NAME)) {
        const attachmentStore = database.createObjectStore(ATTACHMENT_STORE_NAME, { keyPath: 'id' });
        attachmentStore.createIndex(ATTACHMENT_TODO_INDEX, 'todoId', { unique: false });
      }
    };

    request.onsuccess = () => {
      const database = request.result;

      databaseConnection = database;
      pendingDatabaseConnection = null;

      database.addEventListener('versionchange', () => {
        database.close();

        if (databaseConnection === database) {
          databaseConnection = null;
        }
      });
      database.addEventListener('close', () => {
        if (databaseConnection === database) {
          databaseConnection = null;
        }
      });

      resolve(database);
    };
    request.onerror = () => {
      pendingDatabaseConnection = null;
      reject(request.error);
    };
  });

  return pendingDatabaseConnection;
}

async function readFromIndexedDB(itemName: string): Promise<string | null> {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(itemName);
    let storedItem: string | null = null;

    request.onsuccess = () => {
      storedItem = request.result ?? null;
    };
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => resolve(storedItem);
    transaction.onerror = () => reject(transaction.error);
  });
}

async function writeToIndexedDB(itemName: string, value: string): Promise<void> {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(value, itemName);

    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

async function getStoredItem(itemName: string): Promise<string | null> {
  let lastError: unknown = null;

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

  throw lastError || new Error('No pudimos leer el almacenamiento local.');
}

async function setStoredItem(itemName: string, value: string): Promise<void> {
  let didPersist = false;
  let lastError: unknown = null;

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
    throw lastError || new Error('No pudimos guardar en el almacenamiento local.');
  }
}

type TodoAttachment = {
  id: string;
  todoId: string;
  name: string;
  type: string;
  size: number;
  createdAt: string;
};

type StoredTodoAttachment = TodoAttachment & {
  blob: Blob;
};

function createAttachmentId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `attachment-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function listTodoAttachments(todoId: string): Promise<TodoAttachment[]> {
  if (!canUseIndexedDB()) {
    return [];
  }

  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(ATTACHMENT_STORE_NAME, 'readonly');
    const store = transaction.objectStore(ATTACHMENT_STORE_NAME);
    const index = store.index(ATTACHMENT_TODO_INDEX);
    const request = index.getAll(todoId);
    let attachments: TodoAttachment[] = [];

    request.onsuccess = () => {
      attachments = (request.result as StoredTodoAttachment[])
        .map(({ blob: _blob, ...attachment }) => attachment)
        .sort((first, second) => second.createdAt.localeCompare(first.createdAt));
    };
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => resolve(attachments);
    transaction.onerror = () => reject(transaction.error);
  });
}

async function saveTodoAttachment(todoId: string, file: File): Promise<TodoAttachment> {
  if (!canUseIndexedDB()) {
    throw new Error('Tu navegador no permite guardar adjuntos locales.');
  }

  const database = await openDatabase();
  const attachment: StoredTodoAttachment = {
    id: createAttachmentId(),
    todoId,
    name: file.name,
    type: file.type || 'application/octet-stream',
    size: file.size,
    createdAt: new Date().toISOString(),
    blob: file,
  };

  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(ATTACHMENT_STORE_NAME, 'readwrite');
    const request = transaction.objectStore(ATTACHMENT_STORE_NAME).put(attachment);

    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });

  const { blob: _blob, ...metadata } = attachment;
  return metadata;
}

async function readTodoAttachment(attachmentId: string): Promise<StoredTodoAttachment | null> {
  if (!canUseIndexedDB()) {
    return null;
  }

  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(ATTACHMENT_STORE_NAME, 'readonly');
    const request = transaction.objectStore(ATTACHMENT_STORE_NAME).get(attachmentId);
    let attachment: StoredTodoAttachment | null = null;

    request.onsuccess = () => {
      attachment = request.result || null;
    };
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => resolve(attachment);
    transaction.onerror = () => reject(transaction.error);
  });
}

async function removeTodoAttachment(attachmentId: string): Promise<void> {
  if (!canUseIndexedDB()) {
    return;
  }

  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(ATTACHMENT_STORE_NAME, 'readwrite');
    const request = transaction.objectStore(ATTACHMENT_STORE_NAME).delete(attachmentId);

    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

async function removeTodoAttachmentsForTodo(todoId: string): Promise<void> {
  if (!canUseIndexedDB()) {
    return;
  }

  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(ATTACHMENT_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(ATTACHMENT_STORE_NAME);
    const index = store.index(ATTACHMENT_TODO_INDEX);
    const request = index.openKeyCursor(IDBKeyRange.only(todoId));

    request.onsuccess = () => {
      const cursor = request.result;

      if (!cursor) {
        return;
      }

      store.delete(cursor.primaryKey);
      cursor.continue();
    };
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export {
  canUseIndexedDB,
  getStoredItem,
  listTodoAttachments,
  readTodoAttachment,
  removeTodoAttachment,
  removeTodoAttachmentsForTodo,
  saveTodoAttachment,
  setStoredItem,
};
export type { StoredTodoAttachment, TodoAttachment };
