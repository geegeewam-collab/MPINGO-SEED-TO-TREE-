"use client";
import { useActionState } from 'react';
import { setPassword } from '@/app/actions/auth';
import type { FormState } from '@/app/actions/public';
import { Field, PublicFormShell, inputClass } from '@/components/forms/Field';

export default function ResetPasswordPage() {
  const [state, action, pending] = useActionState<FormState, FormData>(setPassword, { status: 'idle' });
  return (
    <PublicFormShell title="Choose a password" intro="Use at least 10 characters. A few random words work well.">
      <form action={action} className="space-y-5" noValidate>
        <Field label="New password" name="password"><input id="password" name="password" type="password" required autoComplete="new-password" className={inputClass} /></Field>
        <Field label="Repeat the password" name="confirm"><input id="confirm" name="confirm" type="password" required autoComplete="new-password" className={inputClass} /></Field>
        {state.status === 'error' && <p role="alert" className="rounded-lg border border-error/30 bg-error/5 p-3 text-sm text-error">{state.message}</p>}
        <button type="submit" disabled={pending} className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground disabled:opacity-60">{pending ? 'Saving…' : 'Save password'}</button>
      </form>
    </PublicFormShell>
  );
}
