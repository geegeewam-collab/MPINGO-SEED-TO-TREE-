import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getModule } from '@/lib/modules';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { RecordForm } from './RecordForm';
import { loadOptions } from './NewRecordPage';

export async function EditRecordPage({ slug, id }: { slug: string; id: string }) {
  const def = getModule(slug);
  if (!def) redirect('/dashboard');
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/login');
  const { data: roleData } = await sb.rpc('current_app_role');
  const role = String(roleData ?? '');
  const { data } = await sb.from(def.table).select('*').eq('id', id).maybeSingle();
  if (!data) redirect(def.basePath);
  const row = data as Record<string, unknown>;
  const status = def.statusColumn && slug !== 'groves' ? String(row[def.statusColumn]) : undefined;
  const allowed = (def.editRoles ?? def.createRoles).includes(role) && (!def.editWhen || !status || def.editWhen.includes(status))
    && !(slug === 'survival' && role === 'coordinator' && row.observer_id !== user.id);
  const locked = def.fields.filter((f) => (def.lockedOnEdit ?? []).includes(f.name));
  const fields = def.fields.filter((f) => !(def.lockedOnEdit ?? []).includes(f.name));
  const keys = Array.from(new Set(fields.filter((f) => f.relation).map((f) => f.relation as string)));
  const entries = allowed ? await Promise.all(keys.map(async (k) => [k, await loadOptions(k, role)] as const)) : [];
  const initial: Record<string, string> = {};
  for (const [k, v] of Object.entries(row)) if (v !== null && v !== undefined) initial[k] = String(v);
  return (
    <div>
      <PageHeader title={`Edit ${def.singular}`} description={locked.length ? `These cannot be changed after saving: ${locked.map((f) => f.label.toLowerCase()).join(', ')}.` : 'Changes are recorded in the audit log.'} />
      {allowed ? (
        <RecordForm slug={def.slug} recordId={id} initial={initial} fields={fields} options={Object.fromEntries(entries)} coords={def.coords} cancelHref={`${def.basePath}/${id}`} submitLabel="Save changes" />
      ) : <EmptyState title="This record cannot be edited" body="Your role may not allow it, or it has moved past the stage where changes are allowed." />}
    </div>
  );
}
