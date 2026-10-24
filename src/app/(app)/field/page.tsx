import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { FieldClient, type Pick } from '@/components/field/FieldClient';

type Row = Record<string, unknown>;

export default async function FieldPage() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/login');
  const { data: roleData } = await sb.rpc('current_app_role');
  const role = String(roleData ?? '');
  if (!['admin', 'coordinator', 'verifier', 'grower'].includes(role)) return <EmptyState title="Field entry is for growers and field staff" body="Your role does not record planting or survival checks." />;
  const [s, d, e] = await Promise.all([
    sb.from('planting_sites').select('id, name').order('created_at', { ascending: false }).limit(300),
    sb.from('distributions').select('id, reference, quantity').in('status', ['dispatched', 'received']).order('created_at', { ascending: false }).limit(300),
    role === 'grower' ? Promise.resolve({ data: [] as Row[] }) : sb.from('planting_events').select('id, reference, species, quantity_planted').order('created_at', { ascending: false }).limit(500),
  ]);
  const sites: Pick[] = ((s.data ?? []) as Row[]).map((r) => ({ id: String(r.id), label: String(r.name) }));
  const distributions: Pick[] = ((d.data ?? []) as Row[]).map((r) => ({ id: String(r.id), label: `${r.reference} · ${r.quantity} seedlings` }));
  const events: Pick[] = ((e.data ?? []) as Row[]).map((r) => ({ id: String(r.id), label: `${r.reference} · ${r.quantity_planted} ${r.species}`, planted: Number(r.quantity_planted) }));
  return (
    <div>
      <PageHeader title="Field entry" description="Record plantings and survival checks from the field. Without a connection, records wait on this device and are sent automatically. They are not in the system until you see them confirmed." />
      <FieldClient userId={user.id} role={role} sites={sites} distributions={distributions} events={events} />
    </div>
  );
}

export const instant = false;
