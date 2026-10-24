"use client";
import Link from 'next/link';
import { useActionState } from 'react';
import { signIn } from '@/app/actions/auth';
import type { FormState } from '@/app/actions/public';
import { Field, inputClass } from '@/components/forms/Field';
import { Rings } from '@/components/brand/Rings';

export default function LoginPage() {
  const [state, action, pending] = useActionState<FormState, FormData>(signIn, { status: 'idle' });
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-primary-deep p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <Rings className="pointer-events-none absolute -right-40 -top-40 h-[40rem] w-[40rem] text-white/10" />
        <Link href="/" className="relative text-sm font-medium text-white/80 hover:text-white">Mpingo Seed-to-Tree Network</Link>
        <div className="relative max-w-md">
          <p className="font-serif text-4xl leading-tight">Every Mpingo, followed from seed to living tree.</p>
          <p className="mt-4 text-sm text-white/70">Sign in to record, review and report the restoration work.</p>
        </div>
      </aside>
      <main className="flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-sm">
          <h1 className="font-serif text-3xl">Sign in</h1>
          <p className="mt-1 text-sm text-muted-foreground">Staff, growers and partners with an account.</p>
          <form action={action} className="mt-8 space-y-5" noValidate>
            <Field label="Email address" name="email"><input id="email" name="email" type="email" required autoComplete="email" className={inputClass} /></Field>
            <Field label="Password" name="password"><input id="password" name="password" type="password" required autoComplete="current-password" className={inputClass} /></Field>
            {state.status === 'error' && <p role="alert" className="rounded-lg border border-error/30 bg-error/5 p-3 text-sm text-error">{state.message}</p>}
            <button type="submit" disabled={pending} className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground disabled:opacity-60">{pending ? 'Signing in…' : 'Sign in'}</button>
          </form>
          <div className="mt-6 space-y-2 text-sm text-muted-foreground">
            <p><Link href="/auth/forgot-password" className="text-primary hover:underline">Forgot your password?</Link></p>
            <p>No account yet? <Link href="/join" className="text-primary hover:underline">Join the network</Link></p>
          </div>
        </div>
      </main>
    </div>
  );
}
