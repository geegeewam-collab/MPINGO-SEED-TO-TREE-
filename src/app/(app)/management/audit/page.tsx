import { redirect } from 'next/navigation';

export default function Page() {
  redirect('/admin/audit');
}

export const instant = false;
