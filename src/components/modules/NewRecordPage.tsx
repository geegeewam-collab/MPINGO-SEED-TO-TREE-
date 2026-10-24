import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getModule, RELATIONS, type Opt } from '@/lib/modules';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { RecordForm } from './RecordForm';

const UNIT: Record<string, string> = { current_stock: 'in stock', quantity_planted: 'trees', quantity: 'seedlings' };

export function relationLabel(key: string, r: Record<string, unknown>): string {
  const rel = RELATIONS[key];
  return rel.label.map((k) => (typeof r[k] === 'number' ? `${r[k]} ${UNIT[k] ?? ''}`.trim() : String(r[k] ?? ''))).filter(Boolean).join(' · ');
}

export async function loadOptions(key: string, role?: string): Promise<Opt[]> {
  const rel = RELATIONS[key];
  if (!rel) return [];
  const sb = await createClient();
  if (rel.person) {
    const { data } = await sb.rpc('person_options', { p_role: rel.person });
    return ((data ?? []) as { id: string; full_name: string }[]).map((p) => ({ value: p.id, label: p.full_name }));
  }
  if (key === 'seed-lots' && role === 'nursery_operator') {
    const { data } = await sb.rpc('lot_options');
    return ((data ?? []) as { id: string; reference: string; species: string }[]).map((l) => ({ value: l.id, label: `${l.reference} · ${l.species}` }));
  }
  const { data } = await sb.from(rel.table).select(rel.select).order('created_at', { ascending: false }).limit(500);
  return ((data ?? []) as unknown as Record<string, unknown>[]).map((r) => ({
    value: String(r.id),
    label: relationLabel(key, r),
  }));
}

export async function NewRecordPage({ slug }: { slug: string }) {
  const def = getModule(slug);
  if (!def) redirect('/dashboard');
  const sb = await createClient();
  const { data: role } = await sb.rpc('current_app_role');
  const allowed = def.createRoles.includes(String(role ?? ''));
  const keys = Array.from(new Set(def.fields.filter((f) => f.relation).map((f) => f.relation as string)));
  const entries = allowed ? await Promise.all(keys.map(async (k) => [k, await loadOptions(k, String(role ?? ''))] as const)) : [];
  const sources = allowed && def.sources ? await loadOptions('mother-trees') : undefined;
  return (
    <div>
      <PageHeader title={`New ${def.singular}`} description="Required fields are marked. Nothing is saved until the form is submitted successfully." />
      {allowed ? (
        <RecordForm slug={def.slug} fields={def.fields} options={Object.fromEntries(entries)} coords={def.coords} sources={sources} cancelHref={def.basePath} submitLabel={`Save ${def.singular}`} />
      ) : (
        <EmptyState title="Your role cannot create these records" body="Ask an administrator if you need access." />
      )}
    </div>
  );
}
