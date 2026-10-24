import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { PeopleAdmin, type Person } from '@/components/modules/PeopleAdmin';

const MATRIX: [string, string, string][] = [
  ['Administrator', 'Everything, including people and access, the audit log and settings.', 'Everything'],
  ['Coordinator', 'Runs the network: records, nurseries, distributions, requests, members, resources, groves, reports.', 'All operations. Cannot manage people or see the audit log.'],
  ['Verifier', 'Submits and reviews survival checks. Never reviews their own.', 'Provenance, nursery, field records and reports, read only apart from checks.'],
  ['Nursery operator', 'Records production, losses and dispatches for the nursery they run.', 'Their own nursery, batches and distributions.'],
  ['Grower', 'Registers their own planting sites and plantings.', 'Their own sites, plantings and distributions addressed to them.'],
  ['Sponsor', 'Follows the network and published groves.', 'Shared overview, directory, library, public groves.'],
  ['No access yet', 'A new or paused account.', 'A waiting screen only.'],
];

export default async function AdminPage() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  const { data } = await sb.from('profiles').select('id, full_name, email, role, status').order('created_at', { ascending: false }).limit(500);
  const people = (data ?? []) as unknown as Person[];
  const waiting = people.filter((p) => p.role === 'pending' && p.status !== 'suspended').length;
  return (
    <div className="space-y-8">
      <PageHeader title="People and access" description="Everyone with an account, what they can do, and who is waiting for access." />
      {waiting > 0 && <p role="status" className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm font-medium text-warning">{waiting} {waiting === 1 ? 'person is' : 'people are'} waiting for a role.</p>}
      <PeopleAdmin people={people} myId={user?.id ?? ''} canInvite={!!process.env.SUPABASE_SERVICE_ROLE_KEY} />
      <section aria-labelledby="roles">
        <h2 id="roles" className="mb-3 text-base font-semibold">What each role can do</h2>
        <div className="overflow-x-auto rounded-xl border bg-surface">
          <table className="w-full text-sm">
            <thead className="bg-sage/50 text-left text-muted-foreground"><tr><th scope="col" className="px-4 py-3 font-medium">Role</th><th scope="col" className="px-4 py-3 font-medium">Purpose</th><th scope="col" className="px-4 py-3 font-medium">Sees</th></tr></thead>
            <tbody className="divide-y">{MATRIX.map(([r, p, s]) => <tr key={r}><td className="px-4 py-3 font-medium">{r}</td><td className="px-4 py-3">{p}</td><td className="px-4 py-3 text-muted-foreground">{s}</td></tr>)}</tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Everyone with a role also sees the shared network overview, the directory and the resource library. These rules are enforced by the database, not only by the menus.</p>
      </section>
    </div>
  );
}

export const instant = false;
