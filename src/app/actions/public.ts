'use server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

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
  const { consent: _consent, ...d } = parsed.data;
  void _consent;
  const supabase = await createClient();
  const { error } = await supabase.from('member_applications').insert({ ...d, consent_to_data_handling: true, status: 'pending' });
  if (error) { console.error('member application insert failed', error.code); return FAILED; }
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
  const { error } = await supabase.from('seed_requests').insert({ ...d, is_organisation: d.organisation_name !== null, status: 'submitted' });
  if (error) { console.error('seed request insert failed', error.code); return FAILED; }
  return { status: 'success' };
}
