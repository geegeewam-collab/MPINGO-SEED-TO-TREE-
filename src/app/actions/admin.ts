'use server';
import { revalidatePath } from 'next/cache';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import type { FormState } from './public';

export const ROLES = ['admin', 'coordinator', 'verifier', 'nursery_operator', 'grower', 'sponsor', 'pending'] as const;
const fail = (message: string): FormState => ({ status: 'error', message });

async function admin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: role } = await supabase.rpc('current_app_role');
  return role === 'admin' ? { supabase, user } : null;
}

function friendly(e: { code?: string; message: string }) {
  if (e.code === 'P0001') return e.message;
  console.error('admin action failed', e.code);
  return 'The change could not be saved. Please try again.';
}

export async function changeAccess(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = z.object({ id: z.string().uuid(), role: z.enum(ROLES), suspend: z.string().optional() }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail('Choose a role.');
  const a = await admin();
  if (!a) return fail('Only administrators can change access.');
  const { id, role, suspend } = parsed.data;
  if (id === a.user.id && (suspend || role !== 'admin')) return fail('You cannot change your own access. Ask another administrator.');
  const patch = suspend ? { role: 'pending', status: 'suspended' } : { role, status: role === 'pending' ? 'pending' : 'active' };
  const { data, error } = await a.supabase.from('profiles').update(patch).eq('id', id).select('id');
  if (error) return fail(friendly(error));
  if (!data || data.length === 0) return fail('That account could not be found.');
  revalidatePath('/admin');
  return { status: 'success', message: suspend ? 'Access paused.' : 'Access updated.' };
}

export async function inviteStaff(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = z.object({
    email: z.string().trim().email('Enter a valid email address').max(200),
    full_name: z.string().trim().min(2, 'Enter their name').max(120),
    role: z.enum(ROLES).refine((r) => r !== 'pending', 'Choose a role'),
  }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Check the details.' };
  const a = await admin();
  if (!a) return fail('Only administrators can invite people.');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return fail('Invitations are not set up yet. Add SUPABASE_SERVICE_ROLE_KEY to the server settings, or create the account in Supabase and set the role here.');
  const svc = createServiceClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  const { data, error } = await svc.auth.admin.inviteUserByEmail(parsed.data.email, {
    data: { full_name: parsed.data.full_name },
    redirectTo: site ? `${site}/auth/confirm?next=/auth/reset-password` : undefined,
  });
  if (error || !data.user) { console.error('invite failed', error?.status); return fail('The invitation could not be sent. Check that the email address is new and try again.'); }
  const { error: pe } = await svc.from('profiles').upsert({ id: data.user.id, email: parsed.data.email, full_name: parsed.data.full_name, role: parsed.data.role, status: 'active' });
  if (pe) { console.error('profile update failed', pe.code); return fail('The invitation was sent, but the role could not be set. Set it in the table below.'); }
  revalidatePath('/admin');
  return { status: 'success', message: `Invitation sent to ${parsed.data.email}. They will set a password from the email link.` };
}
