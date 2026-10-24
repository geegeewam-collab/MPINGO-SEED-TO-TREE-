'use server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import type { FormState } from './public';

const fail = (message: string): FormState => ({ status: 'error', message });
const UUID = z.string().uuid();

async function who() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: role } = await supabase.rpc('current_app_role');
  return { supabase, user, role: String(role ?? '') };
}

export async function removeEvidencePhoto(id: string, path: string): Promise<FormState> {
  if (!UUID.safeParse(id).success) return fail('Unknown photo.');
  const { supabase, user } = await who();
  if (!user) return fail('Sign in again.');
  const { data, error } = await supabase.from('evidence_photos').delete().eq('id', id).select('entity_type, entity_id');
  if (error) { console.error('photo delete failed', error.code); return fail('The photo could not be removed.'); }
  if (!data || data.length === 0) return fail('You cannot remove this photo. It may belong to someone else, or its check has been verified.');
  await supabase.storage.from('evidence').remove([path]);
  const row = data[0] as { entity_type: string; entity_id: string };
  revalidatePath(row.entity_type === 'planting_event' ? `/restoration/events/${row.entity_id}` : `/restoration/survival/${row.entity_id}`);
  return { status: 'success', message: 'Photo removed.' };
}

function groveFolder(groveId: string) {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/grove-photos/${groveId}/`;
}

export async function addGrovePhoto(groveId: string, url: string): Promise<FormState> {
  if (!UUID.safeParse(groveId).success || !url.startsWith(groveFolder(groveId))) return fail('That photo address is not allowed.');
  const { supabase, role } = await who();
  if (!['admin', 'coordinator'].includes(role)) return fail('Your role cannot publish grove photos.');
  const { data: g } = await supabase.from('groves').select('approved_photos').eq('id', groveId).maybeSingle();
  if (!g) return fail('Grove not found.');
  const current = ((g as { approved_photos: string[] | null }).approved_photos ?? []);
  const { data, error } = await supabase.from('groves').update({ approved_photos: [...current, url] }).eq('id', groveId).select('id');
  if (error || !data?.length) { console.error('grove photo add failed', error?.code); return fail('The photo could not be added to the grove.'); }
  revalidatePath(`/impact/groves/${groveId}`);
  return { status: 'success', message: 'Photo added. It appears on the public page once the grove is published.' };
}

export async function removeGrovePhoto(groveId: string, url: string): Promise<FormState> {
  if (!UUID.safeParse(groveId).success || !url.startsWith(groveFolder(groveId))) return fail('That photo address is not allowed.');
  const { supabase, role } = await who();
  if (!['admin', 'coordinator'].includes(role)) return fail('Your role cannot remove grove photos.');
  const { data: g } = await supabase.from('groves').select('approved_photos').eq('id', groveId).maybeSingle();
  const current = ((g as { approved_photos: string[] | null } | null)?.approved_photos ?? []);
  const { data, error } = await supabase.from('groves').update({ approved_photos: current.filter((u) => u !== url) }).eq('id', groveId).select('id');
  if (error || !data?.length) return fail('The photo could not be removed.');
  await supabase.storage.from('grove-photos').remove([url.slice(groveFolder(groveId).length - groveId.length - 1)]);
  revalidatePath(`/impact/groves/${groveId}`);
  return { status: 'success', message: 'Photo removed.' };
}
