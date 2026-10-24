"use client";
import { useActionState } from 'react';
import { changeAccess, inviteStaff } from '@/app/actions/admin';
import type { FormState } from '@/app/actions/public';
import { inputClass } from '@/components/forms/Field';

export interface Person { id: string; full_name: string | null; email: string | null; role: string; status: string | null }
const ROLE_LABEL: Record<string, string> = { admin: 'Administrator', coordinator: 'Coordinator', verifier: 'Verifier', nursery_operator: 'Nursery operator', grower: 'Grower', sponsor: 'Sponsor', pending: 'No access yet' };
const idle: FormState = { status: 'idle' };

function Msg({ s }: { s: FormState }) {
  if (s.status === 'success') return <p role="status" className="text-xs font-medium text-success">{s.message}</p>;
  if (s.status === 'error') return <p role="alert" className="text-xs text-error">{s.message}</p>;
  return null;
}

function Row({ p, me }: { p: Person; me: boolean }) {
  const [s, action, pending] = useActionState(changeAccess, idle);
  return (
    <tr className="align-top">
      <td className="px-4 py-3"><p className="font-medium">{p.full_name || '—'}{me && <span className="ml-2 text-xs text-muted-foreground">(you)</span>}</p><p className="text-xs text-muted-foreground">{p.email}</p></td>
      <td className="px-4 py-3">
        <form action={action} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="id" value={p.id} />
          <select name="role" defaultValue={p.role} disabled={me} aria-label={`Role for ${p.full_name ?? p.email}`} className={`${inputClass} max-w-[11rem]`}>
            {Object.entries(ROLE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <button disabled={pending || me} className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">Save</button>
          {!me && p.role !== 'pending' && <button name="suspend" value="1" disabled={pending} className="rounded-lg border border-error/40 px-3 py-2 text-sm font-medium text-error hover:bg-error/5">Pause access</button>}
        </form>
        <Msg s={s} />
      </td>
      <td className="px-4 py-3 text-xs capitalize text-muted-foreground">{p.status === 'suspended' ? 'Paused' : p.role === 'pending' ? 'Waiting' : 'Active'}</td>
    </tr>
  );
}

export function PeopleAdmin({ people, myId, canInvite }: { people: Person[]; myId: string; canInvite: boolean }) {
  const [s, action, pending] = useActionState(inviteStaff, idle);
  return (
    <div className="space-y-8">
      <form action={action} className="space-y-3 rounded-xl border bg-surface p-5">
        <h2 className="text-sm font-semibold">Invite someone</h2>
        {!canInvite && <p className="text-xs text-muted-foreground">Invitations by email are not set up on this server yet. Until then, create the account in Supabase and set its role in the table below.</p>}
        <div className="grid gap-3 sm:grid-cols-4">
          <input name="full_name" placeholder="Full name" aria-label="Full name" className={inputClass} required />
          <input name="email" type="email" placeholder="Email address" aria-label="Email address" className={inputClass} required />
          <select name="role" aria-label="Role" className={inputClass} defaultValue="grower">{Object.entries(ROLE_LABEL).filter(([v]) => v !== 'pending').map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
          <button disabled={pending || !canInvite} className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50">{pending ? 'Sending…' : 'Send invitation'}</button>
        </div>
        <Msg s={s} />
      </form>
      <div className="overflow-x-auto rounded-xl border bg-surface">
        <table className="w-full text-sm">
          <thead className="bg-sage/50 text-left text-muted-foreground"><tr><th scope="col" className="px-4 py-3 font-medium">Person</th><th scope="col" className="px-4 py-3 font-medium">Role</th><th scope="col" className="px-4 py-3 font-medium">Status</th></tr></thead>
          <tbody className="divide-y">{people.map((p) => <Row key={p.id} p={p} me={p.id === myId} />)}</tbody>
        </table>
      </div>
    </div>
  );
}
