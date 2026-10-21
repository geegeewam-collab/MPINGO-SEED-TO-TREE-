import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { countRows, sumColumn, fmtNum } from '@/lib/queries';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';

interface RecentCheck { id: string; reference: string | null; inspection_date: string | null; submission_status: string }

export default async function DashboardPage() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  const { data: profile } = await sb.from('profiles').select('full_name').eq('id', user?.id ?? '').single();

  const [lots, stock, dist, events, planted, verified, submitted, requests, apps, recent] = await Promise.all([
    countRows(sb, 'seed_lots'),
    sumColumn(sb, 'nursery_batches', 'current_stock'),
    countRows(sb, 'distributions'),
    countRows(sb, 'planting_events'),
    sumColumn(sb, 'planting_events', 'quantity_planted'),
    countRows(sb, 'survival_checks', ['submission_status', 'verified']),
    countRows(sb, 'survival_checks', ['submission_status', 'submitted']),
    countRows(sb, 'seed_requests'),
    countRows(sb, 'member_applications'),
    sb.from('survival_checks').select('id, reference, inspection_date, submission_status').order('created_at', { ascending: false }).limit(6),
  ]);
  const recentRows = (recent.data ?? []) as unknown as RecentCheck[];

  const journey = [
    { label: 'Seed lots', value: fmtNum(lots), sub: 'collected', href: '/provenance/seed-lots' },
    { label: 'Seedlings in stock', value: fmtNum(stock), sub: 'across all batches', href: '/production/batches' },
    { label: 'Distributions', value: fmtNum(dist), sub: 'recorded', href: '/production/distributions' },
    { label: 'Trees planted', value: fmtNum(planted), sub: `${fmtNum(events)} planting events`, href: '/restoration/events' },
    { label: 'Verified checks', value: fmtNum(verified), sub: 'survival inspections', href: '/restoration/survival' },
  ];

  return (
    <div className="space-y-8">
      <PageHeader title={`Welcome${profile?.full_name ? `, ${profile.full_name}` : ''}`} description="Restoration operations at a glance. Every figure comes from live records; a dash means the figure could not be loaded." />

      <section aria-labelledby="attn" className="rounded-xl border bg-surface p-5">
        <h2 id="attn" className="text-base font-semibold">Needs attention</h2>
        {submitted && submitted > 0 ? (
          <Link href="/restoration/survival" className="mt-3 flex items-center justify-between rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm font-medium hover:bg-warning/15">
            <span>{submitted} survival {submitted === 1 ? 'check is' : 'checks are'} waiting for verification</span>
            <span className="text-warning">Review</span>
          </Link>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">{submitted === null ? 'The verification queue could not be loaded.' : 'No survival checks are waiting for verification.'}</p>
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          On file: <Link className="underline" href="/network/requests">{fmtNum(requests)} seed requests</Link> and <Link className="underline" href="/management/members">{fmtNum(apps)} membership applications</Link>.
        </p>
      </section>

      <section aria-labelledby="chain">
        <h2 id="chain" className="mb-3 text-base font-semibold">The restoration chain</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {journey.map((j) => (
            <Link key={j.label} href={j.href} className="rounded-xl border bg-surface p-4 transition-colors hover:border-primary/50 hover:bg-muted/50">
              <p className="text-sm text-muted-foreground">{j.label}</p>
              <p className="mt-1 text-2xl font-semibold">{j.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{j.sub}</p>
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="recent">
        <h2 id="recent" className="mb-3 text-base font-semibold">Latest survival checks</h2>
        {recentRows.length === 0 ? (
          <EmptyState title="No survival checks yet" body="Checks appear here once field inspections are recorded." />
        ) : (
          <div className="overflow-x-auto rounded-xl border bg-surface">
            <table className="w-full text-sm">
              <thead className="bg-sage/50 text-left text-muted-foreground"><tr>
                <th scope="col" className="px-4 py-3 font-medium">Reference</th><th scope="col" className="px-4 py-3 font-medium">Inspected</th><th scope="col" className="px-4 py-3 font-medium">Status</th>
              </tr></thead>
              <tbody className="divide-y">
                {recentRows.map((r) => (
                  <tr key={r.id}><td className="px-4 py-3">{r.reference || '—'}</td><td className="px-4 py-3">{r.inspection_date || '—'}</td><td className="px-4 py-3"><StatusBadge value={r.submission_status} /></td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export const instant = false;
