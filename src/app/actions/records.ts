'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getModule, COORD_BOX, type FieldDef } from '@/lib/modules';
import type { FormState } from './public';
import { sendEmail, sendSms, describe, type SendResult } from '@/lib/notify';

type Row = Record<string, unknown>;
const fail = (message: string, fieldErrors?: Record<string, string>): FormState => ({ status: 'error', message, fieldErrors });
const blank = (v: unknown) => (v === '' || v === undefined || v === null ? undefined : v);
const UUID = z.string().uuid();

function friendly(e: { code?: string; message: string }): string {
  if (e.code === 'P0001') return e.message; // our own database rules, written to be read by people
  console.error('database error', e.code);
  if (e.code === '42501') return 'You do not have permission to do that.';
  if (e.code === '23505') return 'That value is already in use. Choose a different one.';
  if (e.code === '23503') return 'One of the linked records does not exist or is not visible to you.';
  return 'Something went wrong and nothing was saved. Please try again.';
}

function fieldSchema(f: FieldDef): z.ZodTypeAny {
  const label = f.label.toLowerCase();
  let s: z.ZodTypeAny;
  if (f.type === 'int') s = z.coerce.number({ error: `Enter ${label}` }).int('Use a whole number').min(f.min ?? 0, `Must be at least ${f.min ?? 0}`);
  else if (f.type === 'number') s = z.coerce.number({ error: `Enter ${label}` });
  else if (f.type === 'url') s = z.string({ error: `Enter ${label}` }).trim().max(500).refine((v) => /^https:\/\/[^\s]+$/.test(v), 'Enter a web address starting with https://');
  else if (f.type === 'date') s = z.string({ error: `Enter ${label}` }).regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a valid date');
  else if (f.type === 'relation') s = z.string({ error: `Choose ${label}` }).uuid('Choose an option from the list');
  else if (f.type === 'select') s = z.enum((f.options ?? []).map((o) => o.value) as [string, ...string[]], { error: 'Choose an option' });
  else s = z.string({ error: `Enter ${label}` }).trim().max(f.type === 'textarea' ? 2000 : 300);
  return z.preprocess(blank, f.required ? s : s.optional());
}

function parseCoords(raw: Record<string, FormDataEntryValue>): { error?: Record<string, string>; value: Row } {
  const num = (k: string) => (raw[k] === undefined || raw[k] === '' ? null : Number(raw[k]));
  const lat = num('latitude'), lng = num('longitude'), acc = num('location_accuracy');
  if (lat === null && lng === null) return { value: {} };
  if (lat === null || lng === null || Number.isNaN(lat) || Number.isNaN(lng)) return { error: { latitude: 'Enter both latitude and longitude as numbers' }, value: {} };
  if (lat < COORD_BOX.latMin || lat > COORD_BOX.latMax || lng < COORD_BOX.lngMin || lng > COORD_BOX.lngMax) {
    return { error: { latitude: 'These coordinates are outside East Africa. Check that latitude and longitude are not swapped.' }, value: {} };
  }
  return { value: { latitude: lat, longitude: lng, location_accuracy: acc !== null && !Number.isNaN(acc) ? acc : null, capture_method: raw.capture_method === 'gps' ? 'gps' : 'manual', capture_timestamp: new Date().toISOString() } };
}

async function session() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: role } = await supabase.rpc('current_app_role');
  return { supabase, user, role: String(role ?? '') };
}

export async function createRecord(slug: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const def = getModule(slug);
  if (!def || def.createRoles.length === 0) return fail('This form does not exist.');
  const { supabase, user, role } = await session();
  if (!def.createRoles.includes(role)) return fail('Your role cannot create these records.');

  const raw = Object.fromEntries(formData);
  const parsed = z.object(Object.fromEntries(def.fields.map((f) => [f.name, fieldSchema(f)]))).safeParse(raw);
  const errors: Record<string, string> = {};
  if (!parsed.success) for (const i of parsed.error.issues) { const k = String(i.path[0]); if (!errors[k]) errors[k] = i.message; }
  const coords = def.coords ? parseCoords(raw) : { value: {} as Row, error: undefined };
  if (coords.error) Object.assign(errors, coords.error);
  const sources = formData.getAll('sources').map(String);
  if (def.sources && !z.array(UUID).min(1).safeParse(sources).success) errors.sources = 'Choose at least one mother tree';
  if (def.slug === 'groves' && raw.slug && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(String(raw.slug))) errors.slug = 'Use lowercase letters, numbers and single hyphens only';
  if (!parsed.success || Object.keys(errors).length) return fail('Please check the highlighted fields.', errors);

  const row: Row = { ...coords.value };
  for (const f of def.fields) row[f.name] = parsed.data[f.name] ?? null;

  if (def.slug === 'mother-trees') Object.assign(row, { created_by: user.id, verification_status: 'pending' });
  if (def.slug === 'batches') row.responsible_operator = role === 'nursery_operator' ? user.id : null;
  if (def.slug === 'groves') row.created_by = user.id;
  if (def.slug === 'sites') Object.assign(row, { created_by: user.id, responsible_grower: role === 'grower' ? user.id : null, status: 'active' });
  if (def.slug === 'distributions') {
    const { data: b } = await supabase.from('nursery_batches').select('nursery_id').eq('id', String(row.source_batch_id)).maybeSingle();
    if (!b) return fail('That nursery batch could not be found.', { source_batch_id: 'Choose a batch from the list' });
    Object.assign(row, { source_nursery_id: (b as Row).nursery_id, status: 'draft', created_by: user.id, request_date: row.request_date ?? new Date().toISOString().slice(0, 10) });
  }
  if (def.slug === 'events') {
    Object.assign(row, { recorder_id: user.id, responsible_grower: role === 'grower' ? user.id : null });
    if (row.distribution_id) {
      const { data: d } = await supabase.from('distributions').select('quantity, status, source_batch_id').eq('id', String(row.distribution_id)).maybeSingle();
      const dist = d as Row | null;
      if (!dist) return fail('That distribution could not be found.', { distribution_id: 'Choose a distribution from the list' });
      if (!['dispatched', 'received'].includes(String(dist.status))) return fail('That distribution has not been dispatched yet.', { distribution_id: 'Not dispatched yet' });
      const { data: used } = await supabase.from('planting_events').select('quantity_planted').eq('distribution_id', String(row.distribution_id));
      const already = ((used ?? []) as Row[]).reduce((a, r) => a + Number(r.quantity_planted), 0);
      const left = Number(dist.quantity) - already;
      if (Number(row.quantity_planted) > left) return fail(`Only ${left} seedlings from this distribution are left to plant.`, { quantity_planted: `No more than ${left}` });
      row.source_batch_id = dist.source_batch_id;
    }
  }
  if (def.slug === 'survival') {
    Object.assign(row, { sample_size: Number(row.confirmed_alive) + Number(row.confirmed_dead) + Number(row.unresolved), created_by: user.id });
  }

  let id: string | null = null;
  if (def.slug === 'seed-lots') {
    const { data, error } = await supabase.rpc('create_seed_lot', { p_lot: row, p_sources: sources });
    if (error) return fail(friendly(error));
    id = String(data);
  } else {
    const { data, error } = await supabase.from(def.table).insert(row).select('id').single();
    if (error) return fail(friendly(error));
    id = String((data as Row).id);
  }
  revalidatePath(def.basePath);
  redirect(`${def.basePath}/${id}?saved=1`);
}

export async function transitionRecord(_prev: FormState, formData: FormData): Promise<FormState> {
  const slug = String(formData.get('slug') ?? ''), id = String(formData.get('id') ?? ''), to = String(formData.get('to') ?? '');
  const notes = String(formData.get('notes') ?? '').trim().slice(0, 1000);
  const def = getModule(slug);
  if (!def || !def.transitions || !UUID.safeParse(id).success) return fail('Unknown record.');
  const { supabase, user, role } = await session();
  const { data, error } = await supabase.from(def.table).select('*').eq('id', id).maybeSingle();
  if (error || !data) return fail('Record not found, or you do not have access to it.');
  const r = data as Row;
  const current = def.slug === 'groves' ? (r.is_published ? 'published' : 'draft') : String(r[def.statusColumn ?? 'status']);
  const t = def.transitions.find((x) => x.to === to && x.from.includes(current));
  if (!t) return fail('That change is not allowed from the current status.');
  if (!t.roles.includes(role)) return fail('Your role cannot make this change.');
  if (t.needsNotes && notes.length < 3) return fail('Please add a short note explaining this decision.', { notes: 'A note is required' });

  if (def.slug === 'distributions' && to === 'dispatched') {
    const { error: e } = await supabase.rpc('dispatch_nursery_batch', { p_distribution_id: id, p_responsible_user: user.id });
    if (e) return fail(friendly(e));
  } else {
    const patch: Row = {};
    if (def.slug === 'groves') Object.assign(patch, { is_published: to === 'published', published_at: to === 'published' ? new Date().toISOString() : null });
    else patch[def.statusColumn ?? 'status'] = to;
    if (def.notesColumn && notes) patch[def.notesColumn] = notes;
    if (def.reviewerColumn) patch[def.reviewerColumn] = user.id;
    if (def.slug === 'distributions' && to === 'received') patch.receipt_date = new Date().toISOString();
    const { data: upd, error: e } = await supabase.from(def.table).update(patch).eq('id', id).select('id');
    if (e) return fail(friendly(e));
    if (!upd || upd.length === 0) return fail('The change was not saved. You may not have permission, or the record changed. Refresh and try again.');
  }
  revalidatePath(def.basePath); revalidatePath(`${def.basePath}/${id}`);
  let extra = '';
  if ((slug === 'requests' || slug === 'members') && ['approved', 'rejected', 'fulfilled', 'cancelled', 'under_review'].includes(to) && r.email) {
    const name = String(r.requester_name ?? r.full_name ?? 'there');
    const what = slug === 'requests' ? 'seed request' : 'membership application';
    const line: Record<string, string> = { approved: 'has been approved', rejected: 'could not be approved', fulfilled: 'has been fulfilled', cancelled: 'has been cancelled', under_review: 'is now being reviewed' };
    const text = `Hello ${name},\n\nYour ${what} ${line[to]}.${notes ? `\n\nNote from the coordinator: ${notes}` : ''}\n\nMpingo Restoration Initiative network`;
    const email: SendResult = await sendEmail(String(r.email), `Your ${what}`, text);
    const sms: SendResult | undefined = r.phone ? await sendSms(String(r.phone), `Your ${what} ${line[to]}. Check your email for details.`) : undefined;
    extra = ` ${describe(email, sms)}`;
  }
  return { status: 'success', message: `Done: ${t.label}.${extra}` };
}

export async function recordMovement(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = z.object({
    batch: UUID, kind: z.enum(['production', 'loss']),
    quantity: z.coerce.number({ error: 'Enter a quantity' }).int('Use a whole number').positive('Quantity must be more than zero'),
    notes: z.string().trim().max(500).optional(),
  }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail('Please check the quantity.', { quantity: parsed.error.issues[0]?.message ?? 'Check this value' });
  const { supabase, user } = await session();
  const fn = parsed.data.kind === 'production' ? 'record_nursery_production' : 'record_nursery_loss';
  const { error } = await supabase.rpc(fn, { p_batch_id: parsed.data.batch, p_quantity: parsed.data.quantity, p_responsible_user: user.id, p_notes: parsed.data.notes || null });
  if (error) return fail(friendly(error));
  revalidatePath(`/production/batches/${parsed.data.batch}`); revalidatePath('/production/batches');
  return { status: 'success', message: parsed.data.kind === 'production' ? 'Production recorded and stock updated.' : 'Loss recorded and stock updated.' };
}

export async function updateRecord(slug: string, id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const def = getModule(slug);
  if (!def || def.createRoles.length === 0 || !UUID.safeParse(id).success) return fail('This form does not exist.');
  const { supabase, user, role } = await session();
  if (!(def.editRoles ?? def.createRoles).includes(role)) return fail('Your role cannot edit these records.');
  const { data: cur } = await supabase.from(def.table).select('*').eq('id', id).maybeSingle();
  if (!cur) return fail('Record not found, or you do not have access to it.');
  const current = cur as Row;
  const status = def.slug === 'groves' ? undefined : def.statusColumn ? String(current[def.statusColumn]) : undefined;
  if (def.editWhen && status && !def.editWhen.includes(status)) return fail('This record can no longer be edited at its current status.');
  if (def.slug === 'survival' && role === 'coordinator' && current.observer_id !== user.id) return fail('Only the person who submitted this check can correct it.');

  const fields = def.fields.filter((f) => !(def.lockedOnEdit ?? []).includes(f.name));
  const raw = Object.fromEntries(formData);
  const parsed = z.object(Object.fromEntries(fields.map((f) => [f.name, fieldSchema(f)]))).safeParse(raw);
  const errors: Record<string, string> = {};
  if (!parsed.success) for (const i of parsed.error.issues) { const k = String(i.path[0]); if (!errors[k]) errors[k] = i.message; }
  const coords = def.coords ? parseCoords(raw) : { value: {} as Row, error: undefined };
  if (coords.error) Object.assign(errors, coords.error);
  if (def.slug === 'groves' && raw.slug && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(String(raw.slug))) errors.slug = 'Use lowercase letters, numbers and single hyphens only';
  if (!parsed.success || Object.keys(errors).length) return fail('Please check the highlighted fields.', errors);

  const patch: Row = { ...coords.value };
  for (const f of fields) patch[f.name] = parsed.data[f.name] ?? null;
  if (def.slug === 'survival') Object.assign(patch, { sample_size: Number(patch.confirmed_alive) + Number(patch.confirmed_dead) + Number(patch.unresolved), submission_status: 'submitted' });
  if (def.slug === 'events' && Number(patch.quantity_planted) !== Number(current.quantity_planted)) {
    const { count } = await supabase.from('survival_checks').select('*', { count: 'exact', head: true }).eq('planting_event_id', id);
    if (count && count > 0) return fail('Survival checks already exist for this planting, so the number planted can no longer change.', { quantity_planted: 'Locked by existing checks' });
  }
  const { data: upd, error } = await supabase.from(def.table).update(patch).eq('id', id).select('id');
  if (error) return fail(friendly(error));
  if (!upd || upd.length === 0) return fail('The change was not saved. You may not have permission, or the record changed. Refresh and try again.');
  revalidatePath(def.basePath); revalidatePath(`${def.basePath}/${id}`);
  redirect(`${def.basePath}/${id}?saved=1`);
}

export async function addGroveUpdate(groveId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = z.object({
    title: z.string().trim().min(2, 'Enter a title').max(150), content: z.string().trim().min(2, 'Write the update').max(2000),
    update_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a date'), is_public: z.string().optional(),
  }).safeParse(Object.fromEntries(formData));
  if (!parsed.success || !UUID.safeParse(groveId).success) return fail('Please check the update.', Object.fromEntries((parsed.success ? [] : parsed.error.issues).map((i) => [String(i.path[0]), i.message])));
  const { supabase, role } = await session();
  if (!['admin', 'coordinator'].includes(role)) return fail('Your role cannot post grove updates.');
  const { error } = await supabase.from('grove_updates').insert({ grove_id: groveId, title: parsed.data.title, content: parsed.data.content, update_date: parsed.data.update_date, is_public: parsed.data.is_public === 'on' });
  if (error) return fail(friendly(error));
  revalidatePath(`/impact/groves/${groveId}`);
  return { status: 'success', message: parsed.data.is_public === 'on' ? 'Update saved and visible on the public grove page once the grove is published.' : 'Update saved as private.' };
}

export async function toggleGroveUpdate(groveId: string, updateId: string, makePublic: boolean): Promise<FormState> {
  const { supabase, role } = await session();
  if (!['admin', 'coordinator'].includes(role) || !UUID.safeParse(updateId).success) return fail('Not allowed.');
  const { data, error } = await supabase.from('grove_updates').update({ is_public: makePublic }).eq('id', updateId).select('id');
  if (error) return fail(friendly(error));
  if (!data || data.length === 0) return fail('The update could not be changed.');
  revalidatePath(`/impact/groves/${groveId}`);
  return { status: 'success', message: makePublic ? 'Now public.' : 'Now private.' };
}
