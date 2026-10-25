import Link from 'next/link';
import { PublicShell } from '@/components/layout/PublicChrome';

export const inputClass = 'w-full rounded-lg border bg-surface px-3 py-2.5 text-sm placeholder:text-muted-foreground aria-[invalid=true]:border-error';

export function Field({ label, name, error, hint, children }: { label: string; name: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="text-sm font-medium">{label}</label>
      {children}
      {hint && !error && <p id={`${name}-hint`} className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p id={`${name}-error`} role="alert" className="text-xs text-error">{error}</p>}
    </div>
  );
}

export function PublicFormShell({ title, intro, children }: { title: string; intro: string; children: React.ReactNode }) {
  return (
    <PublicShell mobileBar={false}>
      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
        <h1 className="font-serif text-3xl tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-2 text-muted-foreground">{intro}</p>
        <div className="mt-8 rounded-2xl border bg-surface p-5 sm:p-8">{children}</div>
      </main>
    </PublicShell>
  );
}

export function SuccessPanel({ title, body }: { title: string; body: string }) {
  return (
    <PublicShell mobileBar={false}>
      <main className="flex justify-center px-4 py-16">
        <div role="status" className="w-full max-w-md rounded-2xl border bg-surface p-10 text-center">
          <h1 className="font-serif text-2xl">{title}</h1>
          <p className="mt-3 text-muted-foreground">{body}</p>
          <Link href="/" className="mt-6 inline-block rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">Return home</Link>
        </div>
      </main>
    </PublicShell>
  );
}
