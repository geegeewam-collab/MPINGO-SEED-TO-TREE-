import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AppShell } from '@/components/layout/AppShell';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await supabase.from('profiles').select('full_name, role, status').eq('id', user.id).maybeSingle();
  const name = profile?.full_name || user.email || 'Account';
  const role = String(profile?.role ?? 'pending');

  if (role === 'pending') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-6">
        <div role="status" className="w-full max-w-md rounded-2xl border bg-surface p-8 text-center">
          <h1 className="text-2xl font-semibold">{profile?.status === 'suspended' ? 'Access paused' : 'Waiting for access'}</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {profile?.status === 'suspended'
              ? 'An administrator has paused this account. Please contact the network coordinator.'
              : 'Your account is created, but an administrator has not given it a role yet. You will be able to sign in to your workspace as soon as that is done.'}
          </p>
          <form action="/auth/signout" method="post" className="mt-6"><button className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent">Sign out</button></form>
        </div>
      </main>
    );
  }
  return <AppShell name={name} role={role} userId={user.id}>{children}</AppShell>;
}
