import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AppShell } from '@/components/layout/AppShell';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('full_name, role').eq('id', user.id).single();
  const name = profile?.full_name || user.email || 'Account';
  const role = String(profile?.role ?? 'pending');

  return <AppShell name={name} role={role}>{children}</AppShell>;
}
