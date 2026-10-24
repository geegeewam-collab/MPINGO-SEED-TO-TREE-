'use server';
import { z } from 'zod';
import { headers } from 'next/headers';
import { createHash } from 'node:crypto';
import { createClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/notify';

export interface FormState { status: 'idle' | 'success' | 'error'; message?: string; fieldErrors?: Record<string, string> }

const optional = (max: number) => z.string().trim().max(max).optional().transform((v) => (v ? v : null));

const memberSchema = z.object({
  full_name: z.string().trim().min(2, 'Enter your name').max(120),
  organisation_name: optional(150),
  email: z.string().trim().email('Enter a valid email address').max(200),
  phone: optional(40),
  applicant_type: z.enum(['grower', 'nursery', 'researcher', 'organisation', 'student', 'other']),
  county: z.string().trim().min(2, 'Enter your county or region').max(100),
  location_details: optional(300),
  experience_notes: optional(1000),
  participation_goal: optional(1000),
  directory_opt_in: z.literal('on').optional(),
  consent: z.literal('on', { error: 'Please confirm that we may store and use your details to review this application' }),
});

const requestSchema = z.object({
  requester_name: z.string().trim().min(2, 'Enter your name').max(120),
  email: z.string().trim().email('Enter a valid email address').max(200),
  phone: optional(40),
  organisation_name: optional(150),
  request_type: z.enum(['seeds', 'seedlings']),
  requested_quantity: z.coerce.number({ error: 'Enter a quantity' }).int('Use a whole number').positive('Quantity must be more than zero').max(1_000_000),
  unit: z.enum(['kg', 'seeds', 'seedlings']),
  intended_use: z.string().trim().min(5, 'Tell us briefly what you plan to do with them').max(1000),
  county: z.string().trim().min(2, 'Enter the county where they will be grown').max(100),
  destination_details: optional(300),
  desired_date: optional(10),
});

type Db = Awaited<ReturnType<typeof createClient>>;
// At most five submissions per hour from one connection. The address is stored only as a salted hash.
async function withinLimit(supabase: Db, kind: string): Promise<boolean> {
  const h = await headers();
  const ip = (h.get('x-forwarded-for') ?? '').split(',')[0].trim() || h.get('x-real-ip') || 'unknown';
  const key = createHash('sha256').update(ip + (process.env.THROTTLE_SALT ?? 'mpingo')).digest('hex');
  const { data, error } = await supabase.rpc('allow_submission', { p_key: key, p_kind: kind, p_limit: 5, p_window: '1 hour' });
  if (error) { console.error('throttle check failed', error.code); return true; }
  return data !== false;
}
const TOO_MANY: FormState = { status: 'error', message: 'Too many submissions from your connection. Please try again in an hour.' };

function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'form');
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

const FAILED: FormState = { status: 'error', message: 'We could not save this just now. Nothing was submitted, so please try again in a moment.' };

export async function submitMembership(_prev: FormState, formData: FormData): Promise<FormState> {
  const raw = Object.fromEntries(formData);
  if (raw.website) return { status: 'success' }; // hidden spam trap: pretend success, store nothing
  const parsed = memberSchema.safeParse(raw);
  if (!parsed.success) return { status: 'error', message: 'Please check the highlighted fields.', fieldErrors: fieldErrors(parsed.error) };
  const { consent: _consent, directory_opt_in, ...d } = parsed.data;
  void _consent;
  const supabase = await createClient();
  if (!(await withinLimit(supabase, 'join'))) return TOO_MANY;
  const { error } = await supabase.from('member_applications').insert({ ...d, directory_opt_in: directory_opt_in === 'on', consent_to_data_handling: true, status: 'pending' });
  if (error) { console.error('member application insert failed', error.code); return FAILED; }
  await sendEmail(d.email, 'We received your application', `Hello ${d.full_name},\n\nThank you for applying to join the Mpingo restoration network. A coordinator will review your application and contact you.\n\nMpingo Restoration Initiative network`);
  return { status: 'success' };
}

export async function submitSeedRequest(_prev: FormState, formData: FormData): Promise<FormState> {
  const raw = Object.fromEntries(formData);
  if (raw.website) return { status: 'success' };
  const parsed = requestSchema.safeParse(raw);
  if (!parsed.success) return { status: 'error', message: 'Please check the highlighted fields.', fieldErrors: fieldErrors(parsed.error) };
  const d = parsed.data;
  if (d.request_type === 'seedlings' && d.unit !== 'seedlings') return { status: 'error', message: 'Please check the highlighted fields.', fieldErrors: { unit: 'Seedlings are counted in seedlings' } };
  if (d.request_type === 'seeds' && d.unit === 'seedlings') return { status: 'error', message: 'Please check the highlighted fields.', fieldErrors: { unit: 'Seeds are counted in kg or seeds' } };
  const supabase = await createClient();
  if (!(await withinLimit(supabase, 'request'))) return TOO_MANY;
  const { error } = await supabase.from('seed_requests').insert({ ...d, is_organisation: d.organisation_name !== null, status: 'submitted' });
  if (error) { console.error('seed request insert failed', error.code); return FAILED; }
  await sendEmail(d.email, 'We received your seed request', `Hello ${d.requester_name},\n\nThank you. We received your request for ${d.requested_quantity} ${d.unit}. A coordinator will check availability and contact you. This is a request, not a confirmed allocation.\n\nMpingo Restoration Initiative network`);
  return { status: 'success' };
}
