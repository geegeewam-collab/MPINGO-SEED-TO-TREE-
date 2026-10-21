import type { SupabaseClient } from '@supabase/supabase-js';

/** Row count for a table, or null if the query failed (for example, no permission). */
export async function countRows(sb: SupabaseClient, table: string, eq?: [string, string]): Promise<number | null> {
  let q = sb.from(table).select('*', { count: 'exact', head: true });
  if (eq) q = q.eq(eq[0], eq[1]);
  const { count, error } = await q;
  return error ? null : count;
}

/** Sum of a numeric column across up to 5,000 rows, or null if the query failed. */
export async function sumColumn(sb: SupabaseClient, table: string, column: string): Promise<number | null> {
  const { data, error } = await sb.from(table).select(column).limit(5000);
  if (error || !data) return null;
  return (data as unknown as Record<string, unknown>[]).reduce((a, r) => a + (Number(r[column]) || 0), 0);
}

export const fmtNum = (n: number | null) => (n === null ? '—' : n.toLocaleString('en-GB'));
export const fmtPct = (n: number | null) => (n === null ? '—' : `${n.toFixed(1)}%`);
