"use client";
import { useActionState } from 'react';
import { requestReset } from '@/app/actions/auth';
import type { FormState } from '@/app/actions/public';
import { Field, PublicFormShell, inputClass } from '@/components/forms/Field';

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState<FormState, FormData>(requestReset, { status: 'idle' });
  return (
    <PublicFormShell title="Reset your password" intro="Enter the email address you sign in with and we will send you a link to choose a new password.">
      <form action={action} className="space-y-5" noValidate>
        <Field label="Email address" name="email"><input id="email" name="email" type="email" required autoComplete="email" className={inputClass} /></Field>
        {state.status === 'error' && <p role="alert" className="rounded-lg border border-error/30 bg-error/5 p-3 text-sm text-error">{state.message}</p>}
        {state.status === 'success' && <p role="status" className="rounded-lg border border-success/30 bg-success/10 p-3 text-sm text-success">{state.message}</p>}
        <button type="submit" disabled={pending} className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground disabled:opacity-60">{pending ? 'Sending…' : 'Send reset link'}</button>
      </form>
    </PublicFormShell>
  );
}
