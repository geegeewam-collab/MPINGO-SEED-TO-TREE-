import { openDB } from 'idb';

const DB_NAME = 'mpingo_offline_db';
const STORE_NAME = 'sync_queue';
const DB_VERSION = 1;

export async function initOfflineDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: 'id',
        });
        store.createIndex('status', 'status');
        store.createIndex('entityType', 'entityType');
      }
    },
  });
}

export async function queueOperation(operation) {
  const db = await initOfflineDB();
  const item = {
    id: operation.id || crypto.randomUUID(),
    entityType: operation.entityType,
    payload: operation.payload,
    status: 'pending', // 'pending' | 'syncing' | 'synced' | 'error'
    timestamp: new Date().toISOString(),
    attempts: 0,
    lastError: null,
    userId: operation.userId,
  };
  await db.put(STORE_NAME, item);
  return item.id;
}

export async function getQueuedOperations() {
  const db = await initOfflineDB();
  return await db.getAllFromIndex(STORE_NAME, 'status', 'pending');
}

export async function updateOperationStatus(id, status, error = null) {
  const db = await initOfflineDB();
  const item = await db.get(STORE_NAME, id);
  if (!item) return;

  const updatedItem = {
    ...item,
    status,
    lastError: error,
    attempts: item.attempts + 1,
  };
  await db.put(STORE_NAME, updatedItem);
}

export async function removeOperation(id) {
  const db = await initOfflineDB();
  await db.delete(STORE_NAME, id);
}

export async function clearUserQueue(userId) {
  const db = await initOfflineDB();
  const all = await db.getAll(STORE_NAME);
  const toDelete = all.filter(item => item.userId === userId);
  for (const item of toDelete) {
    await db.delete(STORE_NAME, item.id);
  }
}
