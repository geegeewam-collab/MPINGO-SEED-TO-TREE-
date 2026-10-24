import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getModule } from '@/lib/modules';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';

export interface Col { key: string; label: string; unit?: string; badge?: boolean; date?: boolean }
type Row = Record<string, unknown>;

function cell(c: Col, r: Row): React.ReactNode {
  const v = r[c.key];
  if (v === null || v === undefined || v === '') return '—';
  if (c.badge) return <StatusBadge value={String(v)} />;
  if (c.date) {
    const d = new Date(String(v));
    return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (typeof v === 'number') return c.unit && r[c.unit] ? `${v.toLocaleString('en-GB')} ${String(r[c.unit])}` : v.toLocaleString('en-GB');
  return String(v);
}

export async function Registry({ slug, title, description, table, columns }: { slug?: string; title: string; description: string; table: string; columns: Col[] }) {
  const def = slug ? getModule(slug) : undefined;
  const sb = await createClient();
  const { data: role } = await sb.rpc('current_app_role');
  const select = Array.from(new Set(['id', ...columns.flatMap((c) => (c.unit ? [c.key, c.unit] : [c.key]))])).join(',');
  const { data, error } = await sb.from(table).select(select).order('created_at', { ascending: false }).limit(100);
  const rows = (data ?? []) as unknown as Row[];
  const canCreate = !!def && def.createRoles.includes(String(role ?? ''));
  const action = canCreate && def ? <Link href={`${def.basePath}/new`} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">New {def.singular}</Link> : undefined;

  return (
    <div>
      <PageHeader title={title} description={description} actions={action} />
      {error ? (
        <div role="alert" className="rounded-xl border border-error/30 bg-error/5 p-4 text-sm">
          <p className="font-medium text-error">These records could not be loaded.</p>
          <p className="mt-1 text-muted-foreground">Your role may not have access to this table, or the database connection is not configured. Message from the database: {error.message}</p>
        </div>
      ) : rows.length === 0 ? (
        <EmptyState title="No records yet" body={canCreate ? 'Nothing has been recorded here yet. Use the button above to add the first one.' : 'Nothing has been recorded here, or none of it is visible to your role.'} />
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border bg-surface">
            <table className="w-full text-sm">
              <thead className="bg-sage/50 text-left text-muted-foreground"><tr>{columns.map((c) => <th key={c.key} scope="col" className="whitespace-nowrap px-4 py-3 font-medium">{c.label}</th>)}</tr></thead>
              <tbody className="divide-y">
                {rows.map((r, i) => (
                  <tr key={String(r.id ?? i)} className="hover:bg-muted/60">
                    {columns.map((c, ci) => (
                      <td key={c.key} className="whitespace-nowrap px-4 py-3">
                        {ci === 0 && def ? <Link href={`${def.basePath}/${String(r.id)}`} className="font-medium text-primary underline-offset-2 hover:underline">{cell(c, r)}</Link> : cell(c, r)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Showing the latest {rows.length} records. Private coordinates and contact details are not shown in this list.</p>
        </>
      )}
    </div>
  );
}
