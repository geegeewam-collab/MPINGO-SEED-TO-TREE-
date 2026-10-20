import { createClient } from '@/lib/supabase/client';
import {
  getQueuedOperations,
  updateOperationStatus,
  removeOperation
} from './db';

export async function syncOfflineQueue() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { synced: 0, errors: 0 };

  const queue = await getQueuedOperations();
  let syncedCount = 0;
  let errorCount = 0;

  for (const op of queue) {
    try {
      // Mark as syncing to prevent duplicate concurrent attempts
      await updateOperationStatus(op.id, 'syncing');

      let error = null;

      switch (op.entityType) {
        case 'planting_site':
          const { error: siteErr } = await supabase.from('planting_sites').insert([op.payload]);
          error = siteErr;
          break;
        case 'planting_event':
          const { error: eventErr } = await supabase.from('planting_events').insert([op.payload]);
          error = eventErr;
          break;
        case 'survival_check':
          const { error: checkErr } = await supabase.from('survival_checks').insert([op.payload]);
          error = checkErr;
          break;
        default:
          throw new Error(`Unsupported entity type: ${op.entityType}`);
      }

      if (error) {
        throw error;
      }

      // Success: Remove from queue
      await removeOperation(op.id);
      syncedCount++;
    } catch (err: any) {
      console.error(`Sync failed for ${op.id}:`, err);
      await updateOperationStatus(op.id, 'error', err.message);
      errorCount++;
    }
  }

  return { synced: syncedCount, errors: errorCount };
}
