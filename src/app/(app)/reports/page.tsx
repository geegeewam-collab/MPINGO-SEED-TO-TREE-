import { createClient } from '@/lib/supabase/server';
import { calculateSurvivalMetrics } from '@/lib/calculations/survival';
import { fmtNum, fmtPct } from '@/lib/queries';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';

interface PlantingEvent { id: string; quantity_planted: number }
interface Check { planting_event_id: string; confirmed_alive: number; confirmed_dead: number; unresolved: number; uninspected: number }

export default async function ReportsPage() {
  const sb = await createClient();
  const [ev, ck] = await Promise.all([
    sb.from('planting_events').select('id, quantity_planted').limit(5000),
    sb.from('survival_checks')
      .select('planting_event_id, confirmed_alive, confirmed_dead, unresolved, uninspected')
      .eq('submission_status', 'verified').order('inspection_date', { ascending: false }).limit(5000),
  ]);
  const failed = ev.error || ck.error;
  const events = (ev.data ?? []) as unknown as PlantingEvent[];
  const checks = (ck.data ?? []) as unknown as Check[];

  // Latest verified check per planting event (rows are newest first).
  const latest = new Map<string, Check>();
  for (const c of checks) if (!latest.has(c.planting_event_id)) latest.set(c.planting_event_id, c);
  const planted = new Map(events.map((e) => [e.id, e.quantity_planted]));
  let basis = 0, alive = 0, dead = 0, unresolved = 0, uninspected = 0;
  for (const [id, c] of latest) {
    basis += planted.get(id) ?? 0;
    alive += c.confirmed_alive; dead += c.confirmed_dead; unresolved += c.unresolved; uninspected += c.uninspected;
  }
  const m = calculateSurvivalMetrics(basis, alive, dead, unresolved, uninspected);
  const cards = [
    { label: 'Survival among classified', value: fmtPct(m.survivalAmongClassified), note: 'Alive divided by alive plus dead.' },
    { label: 'Confirmed alive share', value: fmtPct(m.confirmedAliveShare), note: 'Alive divided by trees originally planted.' },
    { label: 'Assessment coverage', value: fmtPct(m.assessmentCoverage), note: 'Trees assessed divided by trees originally planted.' },
  ];

  return (
    <div>
      <PageHeader title="Reports" description="Survival results calculated from verified field checks only." actions={<a href="/reports/export" className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent">Download CSV</a>} />
      {failed ? (
        <div role="alert" className="rounded-xl border border-error/30 bg-error/5 p-4 text-sm text-error">Report data could not be loaded. Your role may not have access, or the database is not configured.</div>
      ) : latest.size === 0 ? (
        <EmptyState title="No verified survival checks yet" body="Survival figures appear here once a field check has been verified. Nothing is estimated or filled in." />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            {cards.map((c) => (
              <div key={c.label} className="rounded-xl border bg-surface p-5">
                <p className="text-sm text-muted-foreground">{c.label}</p>
                <p className="mt-2 text-3xl font-semibold">{c.value}</p>
                <p className="mt-2 text-xs text-muted-foreground">{c.note}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-xl border bg-surface p-5 text-sm">
            <p className="font-medium">Data provenance</p>
            <p className="mt-1 text-muted-foreground">
              Period: all verified checks to date, using the latest verified check for each planting event. Covers {fmtNum(latest.size)} planting events and {fmtNum(basis)} trees originally planted.
              Counted: {fmtNum(alive)} alive, {fmtNum(dead)} dead, {fmtNum(unresolved)} unresolved, {fmtNum(uninspected)} not inspected. Submitted, rejected and correction-requested checks are excluded.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

export const instant = false;
