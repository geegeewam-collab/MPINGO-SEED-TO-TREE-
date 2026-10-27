import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { SitesMap, type MapSite } from '@/components/map/SitesMap';
import { calculateSurvivalMetrics } from '@/lib/calculations/survival';
import { fmtPct } from '@/lib/queries';

type Row = Record<string, unknown>;

// A site is coloured green or red only when enough of its trees have been assessed for the result to mean something.
// Below this share the site is shown in grey, so a small sample cannot make a site look healthy.
// 50% is a placeholder. MRI should set the real threshold.
const MIN_ASSESSED = 0.5;
const GOOD_SURVIVAL = 0.7;

export default async function MapPage() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/login');
  const { data: role } = await sb.rpc('current_app_role');
  if (!['admin', 'coordinator', 'verifier', 'grower'].includes(String(role ?? ''))) redirect('/dashboard');

  const [s, e, c] = await Promise.all([
    sb.from('planting_sites').select('id, name, latitude, longitude').not('latitude', 'is', null).not('longitude', 'is', null).limit(1000),
    sb.from('planting_events').select('id, site_id, quantity_planted').limit(5000),
    sb.from('survival_checks').select('planting_event_id, confirmed_alive, confirmed_dead, unresolved').eq('submission_status', 'verified').order('inspection_date', { ascending: false }).limit(5000),
  ]);
  const latest = new Map<string, Row>();
  for (const k of (c.data ?? []) as Row[]) if (!latest.has(String(k.planting_event_id))) latest.set(String(k.planting_event_id), k);
  const bySite = new Map<string, { alive: number; dead: number; unresolved: number; planted: number }>();
  for (const ev of (e.data ?? []) as Row[]) {
    const t = bySite.get(String(ev.site_id)) ?? { alive: 0, dead: 0, unresolved: 0, planted: 0 };
    t.planted += Number(ev.quantity_planted);
    const k = latest.get(String(ev.id));
    if (k) { t.alive += Number(k.confirmed_alive); t.dead += Number(k.confirmed_dead); t.unresolved += Number(k.unresolved ?? 0); }
    bySite.set(String(ev.site_id), t);
  }
  const sites: MapSite[] = ((s.data ?? []) as Row[]).map((r) => {
    const t = bySite.get(String(r.id));
    const base = { id: String(r.id), name: String(r.name), lat: Number(r.latitude), lng: Number(r.longitude) };
    if (!t) return { ...base, state: 'unchecked' as const, detail: ['No plantings recorded'] };
    const assessed = t.alive + t.dead + t.unresolved;
    if (assessed === 0) return { ...base, state: 'unchecked' as const, detail: [`${t.planted.toLocaleString('en-GB')} trees planted`, 'No verified check yet'] };
    // All three measures, against everything planted at this site (the same definitions as the reports).
    const m = calculateSurvivalMetrics(t.planted, t.alive, t.dead, t.unresolved, Math.max(0, t.planted - assessed));
    const detail = [
      `${t.planted.toLocaleString('en-GB')} trees planted`,
      `Alive among trees classified: ${fmtPct(m.survivalAmongClassified)}`,
      `Confirmed alive of those planted: ${fmtPct(m.confirmedAliveShare)}`,
      `Trees assessed: ${fmtPct(m.assessmentCoverage)}`,
    ];
    const enough = assessed / t.planted >= MIN_ASSESSED;
    if (!enough || m.survivalAmongClassified === null) return { ...base, state: 'partial' as const, detail: [...detail, 'Too few trees assessed to judge this site'] };
    return { ...base, state: m.survivalAmongClassified / 100 >= GOOD_SURVIVAL ? ('good' as const) : ('poor' as const), detail };
  });
  return (
    <div className="space-y-4">
      <PageHeader title="Site map" description="Planting sites you are allowed to see. Colour shows the latest verified survival, but only where at least half of the trees planted have been assessed. Green: 70% or more alive among trees classified. Red: lower. Grey: too few trees assessed to judge. Gold: no verified check yet." />
      {sites.length === 0 ? <EmptyState title="No sites with coordinates yet" body="Sites appear here once they are registered with a location." /> : <SitesMap sites={sites} />}
      <p className="text-xs text-muted-foreground">Mother tree locations are never shown on a map. Map tiles are provided by OpenStreetMap.</p>
    </div>
  );
}

export const instant = false;
