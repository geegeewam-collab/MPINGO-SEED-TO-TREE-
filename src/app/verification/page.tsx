import Link from 'next/link';
import { cookies } from 'next/headers';
import { PublicShell } from '@/components/layout/PublicChrome';
import { copy, type Lang } from '@/lib/i18n';

export const instant = false;

export const metadata = { title: 'How verification works' };

export default async function VerificationPage() {
  const lang: Lang = (await cookies()).get('lang')?.value === 'sw' ? 'sw' : 'en';
  const v = copy[lang].verification;
  return (
    <PublicShell lang={lang}>
      <main className="mx-auto max-w-3xl px-5 py-14">
        <h1 className="font-serif text-4xl">{v.title}</h1>
        <p className="mt-4 text-lg text-muted-foreground">{v.intro}</p>
        <ol className="mt-10 space-y-8">
          {v.steps.map(([title, body], i) => (
            <li key={title} className="flex gap-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground" aria-hidden="true">{i + 1}</span>
              <div><h2 className="font-semibold">{title}</h2><p className="mt-1 text-muted-foreground">{body}</p></div>
            </li>
          ))}
        </ol>
        <p className="mt-10 rounded-2xl border bg-surface p-5">{v.unknown}</p>
        <p className="mt-8"><Link href="/" className="font-semibold text-primary hover:underline">{v.back}</Link></p>
      </main>
    </PublicShell>
  );
}
