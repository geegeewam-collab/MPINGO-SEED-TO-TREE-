import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const sb = await createClient();
  const { data: role } = await sb.rpc('current_app_role');
  if (role !== 'admin') redirect('/dashboard');
  return children;
}
