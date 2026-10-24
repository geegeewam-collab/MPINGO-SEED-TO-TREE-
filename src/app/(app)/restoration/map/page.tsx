import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { SitesMap, type MapSite } from '@/components/map/SitesMap';

type Row = Record<string, unknown>;

export default async function MapPage() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/login');
  const { data: role } = await sb.rpc('current_app_role');
  if (!['admin', 'coordinator', 'verifier', 'grower'].includes(String(role ?? ''))) redirect('/dashboard');

  const [s, e, c] = await Promise.all([
    sb.from('planting_sites').select('id, name, latitude, longitude').not('latitude', 'is', null).not('longitude', 'is', null).limit(1000),
    sb.from('planting_events').select('id, site_id, quantity_planted').limit(5000),
    sb.from('survival_checks').select('planting_event_id, confirmed_alive, confirmed_dead').eq('submission_status', 'verified').order('inspection_date', { ascending: false }).limit(5000),
  ]);
  const latest = new Map<string, Row>();
  for (const k of (c.data ?? []) as Row[]) if (!latest.has(String(k.planting_event_id))) latest.set(String(k.planting_event_id), k);
  const bySite = new Map<string, { alive: number; dead: number; planted: number }>();
  for (const ev of (e.data ?? []) as Row[]) {
    const t = bySite.get(String(ev.site_id)) ?? { alive: 0, dead: 0, planted: 0 };
    t.planted += Number(ev.quantity_planted);
    const k = latest.get(String(ev.id));
    if (k) { t.alive += Number(k.confirmed_alive); t.dead += Number(k.confirmed_dead); }
    bySite.set(String(ev.site_id), t);
  }
  const sites: MapSite[] = ((s.data ?? []) as Row[]).map((r) => {
    const t = bySite.get(String(r.id));
    const classified = t ? t.alive + t.dead : 0;
    const state: MapSite['state'] = classified === 0 ? 'unchecked' : t && t.alive / classified >= 0.7 ? 'good' : 'poor';
    const detail = !t ? 'No plantings recorded' : classified === 0 ? `${t.planted} trees planted, no verified check yet` : `${t.planted} trees planted, ${Math.round((t.alive / classified) * 100)}% alive among trees classified`;
    return { id: String(r.id), name: String(r.name), lat: Number(r.latitude), lng: Number(r.longitude), state, detail };
  });
  return (
    <div className="space-y-4">
      <PageHeader title="Site map" description="Planting sites you are allowed to see. Colour shows the latest verified survival: green is 70% or more alive among trees classified, red is lower, gold has no verified check yet." />
      {sites.length === 0 ? <EmptyState title="No sites with coordinates yet" body="Sites appear here once they are registered with a location." /> : <SitesMap sites={sites} />}
      <p className="text-xs text-muted-foreground">Mother tree locations are never shown on a map. Map tiles are provided by OpenStreetMap.</p>
    </div>
  );
}

export const instant = false;
