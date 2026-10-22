"use client";
import { useActionState } from 'react';
import { submitSeedRequest, type FormState } from '@/app/actions/public';
import { Field, PublicFormShell, SuccessPanel, inputClass } from '@/components/forms/Field';

const initial: FormState = { status: 'idle' };

export default function NewSeedRequestPage() {
  const [state, action, pending] = useActionState(submitSeedRequest, initial);
  const e = state.fieldErrors ?? {};
  if (state.status === 'success') {
    return <SuccessPanel title="Request received" body="Thank you. A coordinator will check availability and contact you by email with the next steps. This is a request, not a confirmed allocation." />;
  }
  return (
    <PublicFormShell title="Request seed or seedlings" intro="Tell us what you would like to grow and where. Requests are reviewed against available, verified supply.">
      <form action={action} className="space-y-5" noValidate>
        <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Your name" name="requester_name" error={e.requester_name}><input id="requester_name" name="requester_name" required className={inputClass} aria-invalid={!!e.requester_name} autoComplete="name" /></Field>
          <Field label="Email address" name="email" error={e.email}><input id="email" name="email" type="email" required className={inputClass} aria-invalid={!!e.email} autoComplete="email" /></Field>
          <Field label="Phone (optional)" name="phone" error={e.phone}><input id="phone" name="phone" type="tel" className={inputClass} autoComplete="tel" /></Field>
          <Field label="Organisation (optional)" name="organisation_name" error={e.organisation_name}><input id="organisation_name" name="organisation_name" className={inputClass} /></Field>
          <Field label="I am requesting" name="request_type" error={e.request_type}>
            <select id="request_type" name="request_type" className={inputClass} defaultValue="seedlings"><option value="seedlings">Seedlings</option><option value="seeds">Seeds</option></select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Quantity" name="requested_quantity" error={e.requested_quantity}><input id="requested_quantity" name="requested_quantity" type="number" min={1} step={1} required className={inputClass} aria-invalid={!!e.requested_quantity} /></Field>
            <Field label="Unit" name="unit" error={e.unit}>
              <select id="unit" name="unit" className={inputClass} defaultValue="seedlings"><option value="seedlings">seedlings</option><option value="seeds">seeds</option><option value="kg">kg of seed</option></select>
            </Field>
          </div>
        </div>
        <Field label="What will you do with them?" name="intended_use" error={e.intended_use}><textarea id="intended_use" name="intended_use" rows={3} required className={inputClass} aria-invalid={!!e.intended_use} /></Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="County where they will be grown" name="county" error={e.county}><input id="county" name="county" required className={inputClass} aria-invalid={!!e.county} /></Field>
          <Field label="Date you would like them (optional)" name="desired_date" error={e.desired_date}><input id="desired_date" name="desired_date" type="date" className={inputClass} /></Field>
        </div>
        <Field label="Where exactly (optional)" name="destination_details" error={e.destination_details} hint="A village, ward or landmark is enough. Do not enter exact coordinates here."><input id="destination_details" name="destination_details" className={inputClass} /></Field>
        {state.status === 'error' && <p role="alert" className="rounded-lg border border-error/30 bg-error/5 p-3 text-sm text-error">{state.message}</p>}
        <button type="submit" disabled={pending} className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground disabled:opacity-60">{pending ? 'Sending…' : 'Submit request'}</button>
      </form>
    </PublicFormShell>
  );
}
