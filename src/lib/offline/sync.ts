import { createClient } from '@/lib/supabase/client';
import { listOperations, updateOperation, removeOperation, resetStuck, refreshQueueCount, type EntityType } from './db';

export interface SyncResult { sent: number; failed: number; waiting: number; stopped: 'offline' | 'signed-out' | null }
const TABLE: Record<EntityType, string> = { planting_event: 'planting_events', survival_check: 'survival_checks' };
let running = false;

export const isNetworkError = (e: { code?: string; message: string }) => !e.code && /fetch|network|load failed/i.test(e.message);

export function explain(e: { code?: string; message: string }): string {
  if (e.code === 'P0001') return e.message; // our own database rules, written to be read by people
  if (e.code === '42501') return 'You do not have permission to save this record.';
  if (e.code === '23503') return 'A record this one depends on is missing or not visible to you.';
  return 'The server rejected this record.';
}

/** Sends waiting records one at a time. Records are only removed from the device after the server confirms them. */
export async function syncQueue(userId: string): Promise<SyncResult> {
  if (running) return { sent: 0, failed: 0, waiting: 0, stopped: null };
  running = true;
  const result: SyncResult = { sent: 0, failed: 0, waiting: 0, stopped: null };
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || session.user.id !== userId) { result.stopped = 'signed-out'; return result; }
    await resetStuck(userId);
    const waiting = (await listOperations(userId)).filter((o) => o.status === 'pending');
    for (const op of waiting) {
      await updateOperation(op.id, { status: 'syncing', attempts: op.attempts + 1 });
      const { error } = await supabase.from(TABLE[op.entityType]).insert(op.payload);
      if (!error || error.code === '23505') { await removeOperation(op.id, userId); result.sent++; continue; } // 23505: this exact record is already stored
      if (isNetworkError(error)) { await updateOperation(op.id, { status: 'pending', lastError: 'No connection yet' }); result.stopped = 'offline'; break; }
      if (error.code?.startsWith('PGRST3')) { await updateOperation(op.id, { status: 'pending', lastError: 'Your sign-in has expired. Sign in again to send this.' }); result.stopped = 'signed-out'; break; }
      await updateOperation(op.id, { status: 'failed', lastError: explain(error) });
      result.failed++;
    }
    result.waiting = (await listOperations(userId)).filter((o) => o.status === 'pending').length;
    return result;
  } finally {
    running = false;
    await refreshQueueCount(userId);
  }
}
