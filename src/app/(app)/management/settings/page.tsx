import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';

export default async function SettingsPage() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  const { data: profile } = await sb.from('profiles').select('full_name, email, role, status').eq('id', user?.id ?? '').single();
  const rows: [string, React.ReactNode][] = [
    ['Name', profile?.full_name || '—'],
    ['Email', profile?.email || user?.email || '—'],
    ['Role', <StatusBadge key="r" value={String(profile?.role ?? 'pending')} />],
    ['Account status', <StatusBadge key="s" value={String(profile?.status ?? 'active')} />],
  ];
  return (
    <div>
      <PageHeader title="Settings" description="Your account details. Roles are assigned by an administrator." />
      <dl className="max-w-xl divide-y rounded-xl border bg-surface">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between gap-4 px-4 py-3 text-sm"><dt className="text-muted-foreground">{k}</dt><dd className="font-medium">{v}</dd></div>
        ))}
      </dl>
    </div>
  );
}

export const instant = false;
