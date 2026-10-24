"use client";
import { useActionState } from 'react';
import { submitMembership, type FormState } from '@/app/actions/public';
import { Field, PublicFormShell, SuccessPanel, inputClass } from '@/components/forms/Field';

const initial: FormState = { status: 'idle' };

export default function JoinPage() {
  const [state, action, pending] = useActionState(submitMembership, initial);
  const e = state.fieldErrors ?? {};
  if (state.status === 'success') {
    return <SuccessPanel title="Application received" body="Thank you. A coordinator will review your details and contact you by email." />;
  }
  return (
    <PublicFormShell title="Join the network" intro="Growers, nurseries, researchers and restoration partners can register here. A coordinator reviews every application.">
      <form action={action} className="space-y-5" noValidate>
        <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Full name" name="full_name" error={e.full_name}><input id="full_name" name="full_name" required className={inputClass} aria-invalid={!!e.full_name} autoComplete="name" /></Field>
          <Field label="Email address" name="email" error={e.email}><input id="email" name="email" type="email" required className={inputClass} aria-invalid={!!e.email} autoComplete="email" /></Field>
          <Field label="Organisation (optional)" name="organisation_name" error={e.organisation_name}><input id="organisation_name" name="organisation_name" className={inputClass} /></Field>
          <Field label="Phone (optional)" name="phone" error={e.phone}><input id="phone" name="phone" type="tel" className={inputClass} autoComplete="tel" /></Field>
          <Field label="I am a" name="applicant_type" error={e.applicant_type}>
            <select id="applicant_type" name="applicant_type" className={inputClass} defaultValue="grower">
              <option value="grower">Individual grower</option><option value="nursery">Nursery operator</option><option value="researcher">Researcher or academic</option>
              <option value="organisation">Conservation organisation</option><option value="student">Student or volunteer</option><option value="other">Other</option>
            </select>
          </Field>
          <Field label="County or region" name="county" error={e.county}><input id="county" name="county" required className={inputClass} aria-invalid={!!e.county} /></Field>
        </div>
        <Field label="Where you would grow or work (optional)" name="location_details" error={e.location_details}><input id="location_details" name="location_details" className={inputClass} /></Field>
        <Field label="Your experience (optional)" name="experience_notes" error={e.experience_notes}><textarea id="experience_notes" name="experience_notes" rows={3} className={inputClass} /></Field>
        <Field label="What you hope to do (optional)" name="participation_goal" error={e.participation_goal}><textarea id="participation_goal" name="participation_goal" rows={3} className={inputClass} /></Field>
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" name="directory_opt_in" className="mt-1 h-4 w-4" />
          <span>Optional: list my name, organisation and county in the members&apos; directory that other network members can see. My email and phone are never shown there.</span>
        </label>
        <div className="space-y-1.5">
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" name="consent" className="mt-1 h-4 w-4" aria-invalid={!!e.consent} />
            <span>I agree that the network may store and use my details to review this application and contact me.</span>
          </label>
          {e.consent && <p role="alert" className="text-xs text-error">{e.consent}</p>}
        </div>
        {state.status === 'error' && <p role="alert" className="rounded-lg border border-error/30 bg-error/5 p-3 text-sm text-error">{state.message}</p>}
        <button type="submit" disabled={pending} className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground disabled:opacity-60">{pending ? 'Sending…' : 'Submit application'}</button>
      </form>
    </PublicFormShell>
  );
}
