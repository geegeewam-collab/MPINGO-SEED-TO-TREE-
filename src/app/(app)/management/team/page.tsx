import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';

interface Member { id: string; full_name: string | null; email: string | null; role: string; status: string | null }

export default async function TeamPage() {
  const sb = await createClient();
  const { data, error } = await sb.from('profiles').select('id, full_name, email, role, status').order('created_at', { ascending: false }).limit(200);
  const people = (data ?? []) as unknown as Member[];
  return (
    <div>
      <PageHeader title="Team and Access" description="Everyone with an account and the role they hold. Role changes are not available on this screen yet." />
      {error || people.length === 0 ? (
        <EmptyState title="No accounts to show" body="Only administrators can see the full team list. If you are an administrator and see this, check the database connection." />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-surface">
          <table className="w-full text-sm">
            <thead className="bg-sage/50 text-left text-muted-foreground"><tr>
              <th scope="col" className="px-4 py-3 font-medium">Name</th><th scope="col" className="px-4 py-3 font-medium">Email</th>
              <th scope="col" className="px-4 py-3 font-medium">Role</th><th scope="col" className="px-4 py-3 font-medium">Status</th>
            </tr></thead>
            <tbody className="divide-y">
              {people.map((p) => (
                <tr key={p.id} className="hover:bg-muted/60">
                  <td className="px-4 py-3">{p.full_name || '—'}</td><td className="px-4 py-3">{p.email || '—'}</td>
                  <td className="px-4 py-3"><StatusBadge value={p.role} /></td><td className="px-4 py-3"><StatusBadge value={p.status || 'active'} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export const instant = false;
