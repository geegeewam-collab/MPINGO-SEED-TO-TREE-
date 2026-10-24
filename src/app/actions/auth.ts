'use server';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createHash } from 'node:crypto';
import { createClient } from '@/lib/supabase/server';
import type { FormState } from './public';

async function origin() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  const h = await headers();
  return `${h.get('x-forwarded-proto') ?? 'https'}://${h.get('x-forwarded-host') ?? h.get('host')}`;
}

export async function requestReset(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = z.string().trim().email().max(200).safeParse(formData.get('email'));
  if (!parsed.success) return { status: 'error', message: 'Enter a valid email address.' };
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, { redirectTo: `${await origin()}/auth/confirm?next=/auth/reset-password` });
  if (error) console.error('password reset request failed', error.status);
  // Same answer whether or not the address has an account, so the form cannot be used to discover who has one.
  return { status: 'success', message: 'If that address has an account, a reset link is on its way. It may take a few minutes.' };
}

export async function setPassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = z.object({ password: z.string().min(10, 'Use at least 10 characters').max(128), confirm: z.string() })
    .refine((v) => v.password === v.confirm, { message: 'The two passwords do not match', path: ['confirm'] }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Check the password.' };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { status: 'error', message: 'This link has expired. Request a new reset link.' };
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) { console.error('password update failed', error.status); return { status: 'error', message: 'The password could not be changed. Choose a different one and try again.' }; }
  redirect('/dashboard');
}

export async function signIn(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = z.object({ email: z.string().trim().email().max(200), password: z.string().min(1).max(128) }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: 'error', message: 'Enter your email address and password.' };
  const supabase = await createClient();
  const h = await headers();
  const ip = (h.get('x-forwarded-for') ?? '').split(',')[0].trim() || h.get('x-real-ip') || 'unknown';
  const key = createHash('sha256').update(ip + (process.env.THROTTLE_SALT ?? 'mpingo')).digest('hex');
  const { data: allowed } = await supabase.rpc('allow_submission', { p_key: key, p_kind: 'login', p_limit: 10, p_window: '15 minutes' });
  if (allowed === false) return { status: 'error', message: 'Too many sign-in attempts. Please wait 15 minutes and try again.' };
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { status: 'error', message: 'The email address or password is not correct.' };
  redirect('/dashboard');
}
