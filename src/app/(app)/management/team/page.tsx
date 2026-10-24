import { redirect } from 'next/navigation';

export default function Page() {
  redirect('/admin');
}

export const instant = false;
