"use client";
import { useActionState } from 'react';
import { useState, useTransition } from 'react';
import { transitionRecord, recordMovement, addGroveUpdate, toggleGroveUpdate } from '@/app/actions/records';
import type { FormState } from '@/app/actions/public';
import { cn } from '@/lib/utils';
import { inputClass } from '@/components/forms/Field';

const idle: FormState = { status: 'idle' };

function Result({ state }: { state: FormState }) {
  if (state.status === 'success') return <p role="status" className="text-sm font-medium text-success">{state.message}</p>;
  if (state.status === 'error') return <p role="alert" className="text-sm text-error">{state.message}</p>;
  return null;
}

export function TransitionPanel({ slug, id, actions, askNotes }: { slug: string; id: string; actions: { to: string; label: string; danger?: boolean }[]; askNotes: boolean }) {
  const [state, action, pending] = useActionState(transitionRecord, idle);
  return (
    <form action={action} className="space-y-3 rounded-xl border bg-surface p-5">
      <h2 className="text-sm font-semibold">Actions</h2>
      <input type="hidden" name="slug" value={slug} /><input type="hidden" name="id" value={id} />
      {askNotes && (
        <div className="space-y-1.5">
          <label htmlFor="notes" className="text-sm text-muted-foreground">Note (required for some decisions)</label>
          <textarea id="notes" name="notes" rows={2} className={inputClass} />
          {state.fieldErrors?.notes && <p role="alert" className="text-xs text-error">{state.fieldErrors.notes}</p>}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {actions.map((a) => (
          <button key={a.to} type="submit" name="to" value={a.to} disabled={pending}
            className={cn('rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-60', a.danger ? 'border border-error/40 text-error hover:bg-error/5' : 'bg-primary text-primary-foreground')}>{a.label}</button>
        ))}
      </div>
      <Result state={state} />
    </form>
  );
}

export function MovementForm({ batch }: { batch: string }) {
  const [state, action, pending] = useActionState(recordMovement, idle);
  return (
    <form action={action} className="space-y-3 rounded-xl border bg-surface p-5">
      <h2 className="text-sm font-semibold">Record stock change</h2>
      <input type="hidden" name="batch" value={batch} />
      <div className="grid gap-3 sm:grid-cols-3">
        <select name="kind" aria-label="Type of change" className={inputClass} defaultValue="production"><option value="production">Seedlings produced</option><option value="loss">Seedlings lost</option></select>
        <input name="quantity" type="number" min={1} step={1} inputMode="numeric" aria-label="Quantity" placeholder="Quantity" className={inputClass} required />
        <input name="notes" aria-label="Notes" placeholder="Notes (optional)" className={inputClass} />
      </div>
      {state.fieldErrors?.quantity && <p role="alert" className="text-xs text-error">{state.fieldErrors.quantity}</p>}
      <button type="submit" disabled={pending} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60">{pending ? 'Saving…' : 'Save'}</button>
      <Result state={state} />
    </form>
  );
}

export function GroveUpdateForm({ grove }: { grove: string }) {
  const [state, action, pending] = useActionState(addGroveUpdate.bind(null, grove), idle);
  const e = state.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-3 rounded-xl border bg-surface p-5">
      <h2 className="text-sm font-semibold">Post an update</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="sm:col-span-2"><input name="title" placeholder="Title" aria-label="Title" className={inputClass} required />{e.title && <p role="alert" className="mt-1 text-xs text-error">{e.title}</p>}</div>
        <div><input name="update_date" type="date" aria-label="Date" className={inputClass} required />{e.update_date && <p role="alert" className="mt-1 text-xs text-error">{e.update_date}</p>}</div>
      </div>
      <textarea name="content" rows={3} placeholder="What happened at the grove?" aria-label="Update text" className={inputClass} required />
      {e.content && <p role="alert" className="text-xs text-error">{e.content}</p>}
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="is_public" className="h-4 w-4" /> Show on the public grove page</label>
      <button type="submit" disabled={pending} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60">{pending ? 'Saving…' : 'Save update'}</button>
      <Result state={state} />
    </form>
  );
}

export function UpdateToggle({ grove, update, isPublic }: { grove: string; update: string; isPublic: boolean }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState('');
  return (
    <span className="inline-flex items-center gap-2">
      <button type="button" disabled={pending} onClick={() => start(async () => { const r = await toggleGroveUpdate(grove, update, !isPublic); setMsg(r.message ?? ''); })}
        className="rounded-md border px-2.5 py-1 text-xs font-medium hover:bg-accent disabled:opacity-60">{isPublic ? 'Make private' : 'Make public'}</button>
      {msg && <span role="status" className="text-xs text-muted-foreground">{msg}</span>}
    </span>
  );
}
