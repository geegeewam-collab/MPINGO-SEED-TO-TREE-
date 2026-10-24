import { openDB } from 'idb';

export type EntityType = 'planting_event' | 'survival_check';
export type OpStatus = 'pending' | 'syncing' | 'failed';
export interface QueuedOperation {
  id: string; // also the id of the row that will be created, so a retry can never create a duplicate
  entityType: EntityType;
  payload: Record<string, unknown> & { id: string };
  summary: string;
  status: OpStatus;
  createdAt: string;
  updatedAt: string;
  attempts: number;
  lastError: string | null;
  userId: string;
}

const DB_NAME = 'mpingo_offline_db';
const STORE = 'sync_queue';
const VERSION = 2;

function open() {
  return openDB(DB_NAME, VERSION, {
    upgrade(db) {
      // Version 1 was never written to by the app, so it is safe to rebuild the store.
      if (db.objectStoreNames.contains(STORE)) db.deleteObjectStore(STORE);
      const store = db.createObjectStore(STORE, { keyPath: 'id' });
      store.createIndex('userId', 'userId');
    },
  });
}

let count = 0;
const listeners = new Set<() => void>();
export const subscribeQueue = (cb: () => void) => { listeners.add(cb); return () => { listeners.delete(cb); }; };
export const getQueueCount = () => count;

export async function refreshQueueCount(userId: string): Promise<void> {
  try {
    const db = await open();
    count = (await db.getAllFromIndex(STORE, 'userId', userId)).length;
  } catch { count = 0; }
  listeners.forEach((l) => l());
}

export async function queueOperation(op: { entityType: EntityType; payload: QueuedOperation['payload']; summary: string; userId: string }): Promise<string> {
  const db = await open();
  const now = new Date().toISOString();
  const item: QueuedOperation = { id: op.payload.id, entityType: op.entityType, payload: op.payload, summary: op.summary, status: 'pending', createdAt: now, updatedAt: now, attempts: 0, lastError: null, userId: op.userId };
  await db.put(STORE, item);
  await refreshQueueCount(op.userId);
  return item.id;
}

export async function listOperations(userId: string): Promise<QueuedOperation[]> {
  const db = await open();
  const all = (await db.getAllFromIndex(STORE, 'userId', userId)) as QueuedOperation[];
  return all.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function updateOperation(id: string, patch: Partial<Pick<QueuedOperation, 'status' | 'attempts' | 'lastError'>>): Promise<void> {
  const db = await open();
  const item = (await db.get(STORE, id)) as QueuedOperation | undefined;
  if (item) await db.put(STORE, { ...item, ...patch, updatedAt: new Date().toISOString() });
}

export async function removeOperation(id: string, userId: string): Promise<void> {
  const db = await open();
  await db.delete(STORE, id);
  await refreshQueueCount(userId);
}

/** An operation left "syncing" by a closed tab or lost connection goes back to waiting. */
export async function resetStuck(userId: string): Promise<void> {
  const cutoff = Date.now() - 2 * 60 * 1000;
  for (const op of await listOperations(userId)) {
    if (op.status === 'syncing' && new Date(op.updatedAt).getTime() < cutoff) await updateOperation(op.id, { status: 'pending' });
  }
}
