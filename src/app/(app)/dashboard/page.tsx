import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { countRows, fmtNum, fmtPct } from '@/lib/queries';
import { calculateSurvivalMetrics } from '@/lib/calculations/survival';
import { PageHeader } from '@/components/ui/PageHeader';

interface Summary {
  seed_lots: number; nurseries: number; seedlings_in_stock: number; trees_planted: number; verified_checks: number;
  survival: { planted: number; alive: number; dead: number; unresolved: number; uninspected: number };
}
interface Task { label: string; count: number | null; href: string }

export default async function DashboardPage() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  const uid = user?.id ?? '';
  const [{ data: profile }, { data: sumData }] = await Promise.all([
    sb.from('profiles').select('full_name, role').eq('id', uid).maybeSingle(),
    sb.rpc('network_summary'),
  ]);
  const role = String(profile?.role ?? '');
  const s = sumData as Summary | null;
  const m = s && s.survival.planted > 0 ? calculateSurvivalMetrics(s.survival.planted, s.survival.alive, s.survival.dead, s.survival.unresolved, s.survival.uninspected) : null;

  const tasks: Task[] = [];
  if (['admin', 'coordinator'].includes(role)) {
    tasks.push({ label: 'Seed requests waiting for review', count: await countRows(sb, 'seed_requests', ['status', 'submitted']), href: '/network/requests' });
    tasks.push({ label: 'Membership applications waiting', count: await countRows(sb, 'member_applications', ['status', 'pending']), href: '/management/members' });
    tasks.push({ label: 'Distributions waiting for approval', count: await countRows(sb, 'distributions', ['status', 'draft']), href: '/production/distributions' });
  }
  if (['admin', 'coordinator', 'verifier'].includes(role)) {
    tasks.push({ label: role === 'verifier' ? 'Survival checks you can review' : 'Survival checks waiting for verification', count: await countRows(sb, 'survival_checks', ['submission_status', 'submitted'], ...(role === 'verifier' ? [['observer_id', uid, 'neq'] as [string, string, 'neq']] : [])), href: '/restoration/survival' });
  }
  if (role === 'nursery_operator') {
    tasks.push({ label: 'Your approved distributions ready to dispatch', count: await countRows(sb, 'distributions', ['status', 'approved']), href: '/production/distributions' });
    tasks.push({ label: 'Your nursery batches', count: await countRows(sb, 'nursery_batches'), href: '/production/batches' });
  }
  if (role === 'grower') {
    tasks.push({ label: 'Your planting sites', count: await countRows(sb, 'planting_sites'), href: '/restoration/sites' });
    tasks.push({ label: 'Seedlings dispatched to you', count: await countRows(sb, 'distributions', ['status', 'dispatched']), href: '/production/distributions' });
  }

  const kpis = [
    { label: 'Trees planted', value: fmtNum(s?.trees_planted ?? null) },
    { label: 'Seedlings in nurseries', value: fmtNum(s?.seedlings_in_stock ?? null) },
    { label: 'Seed lots', value: fmtNum(s?.seed_lots ?? null) },
    { label: 'Approved nurseries', value: fmtNum(s?.nurseries ?? null) },
  ];

  return (
    <div className="space-y-8">
      <PageHeader title={`Welcome${profile?.full_name ? `, ${profile.full_name}` : ''}`} description="The shared picture for everyone in the network. Figures come from live records." />

      {tasks.length > 0 && (
        <section aria-labelledby="work" className="rounded-2xl border bg-surface p-5">
          <h2 id="work" className="text-base font-semibold">Your work</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {tasks.map((t) => (
              <li key={t.label}>
                <Link href={t.href} className="flex items-center justify-between rounded-lg border px-4 py-3 text-sm transition-colors hover:bg-accent">
                  <span>{t.label}</span><span className={`text-lg font-semibold ${t.count ? 'text-primary' : 'text-muted-foreground'}`}>{fmtNum(t.count)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="net" className="space-y-4">
        <h2 id="net" className="text-base font-semibold">The network today</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((k) => (
            <div key={k.label} className="rounded-xl border bg-surface p-4"><p className="text-sm text-muted-foreground">{k.label}</p><p className="mt-1 text-3xl font-semibold tracking-tight">{k.value}</p></div>
          ))}
        </div>
        <div className="rounded-xl border bg-surface p-5">
          <h3 className="text-sm font-semibold">Verified survival</h3>
          {m && s ? (
            <>
              <p className="mt-2 text-3xl font-semibold">{fmtPct(m.survivalAmongClassified)} <span className="text-sm font-normal text-muted-foreground">alive among trees classified</span></p>
              <p className="mt-2 text-sm text-muted-foreground">{fmtPct(m.confirmedAliveShare)} of trees planted are confirmed alive, and {fmtPct(m.assessmentCoverage)} have been assessed. Based on the latest verified check for each planting ({fmtNum(s.verified_checks)} verified checks). Trees that could not be confirmed are not counted as alive or dead.</p>
            </>
          ) : <p className="mt-2 text-sm text-muted-foreground">No verified survival results yet. Figures appear here once a field check has been reviewed by a second person.</p>}
        </div>
      </section>
    </div>
  );
}

export const instant = false;
