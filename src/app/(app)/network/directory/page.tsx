import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';

interface Entry { kind: string; name: string; organisation: string | null; county: string | null; detail: string | null }

export default async function DirectoryPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = '' } = await searchParams;
  const sb = await createClient();
  const { data, error } = await sb.rpc('staff_directory');
  const needle = q.trim().toLowerCase();
  const all = (data ?? []) as Entry[];
  const rows = needle ? all.filter((e) => [e.name, e.organisation, e.county, e.kind].some((v) => (v ?? '').toLowerCase().includes(needle))) : all;
  return (
    <div>
      <PageHeader title="Directory" description="Approved nurseries and members who agreed to be listed. Visible to everyone with an account. Contact details are held by coordinators." />
      <form className="mb-4 flex max-w-md gap-2" role="search">
        <input name="q" defaultValue={q} placeholder="Search by name, county or type" aria-label="Search the directory" className="w-full rounded-lg border bg-surface px-3 py-2.5 text-sm" />
        <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Search</button>
      </form>
      {error ? <div role="alert" className="rounded-xl border border-error/30 bg-error/5 p-4 text-sm text-error">The directory could not be loaded.</div>
        : rows.length === 0 ? <EmptyState title={needle ? 'No matches' : 'Nobody is listed yet'} body={needle ? 'Try a different search.' : 'Nurseries appear here once approved, and members appear once approved and opted in.'} />
        : (
          <div className="overflow-x-auto rounded-xl border bg-surface">
            <table className="w-full text-sm">
              <thead className="bg-sage/50 text-left text-muted-foreground"><tr>{['Name', 'Type', 'Organisation', 'County', 'Place'].map((h) => <th key={h} scope="col" className="px-4 py-3 font-medium">{h}</th>)}</tr></thead>
              <tbody className="divide-y">{rows.map((e, i) => (
                <tr key={i} className="hover:bg-muted/60"><td className="px-4 py-3 font-medium">{e.name}</td><td className="px-4 py-3"><StatusBadge value={e.kind} /></td><td className="px-4 py-3">{e.organisation || '—'}</td><td className="px-4 py-3">{e.county || '—'}</td><td className="px-4 py-3">{e.detail || '—'}</td></tr>
              ))}</tbody>
            </table>
          </div>)}
    </div>
  );
}

export const instant = false;
