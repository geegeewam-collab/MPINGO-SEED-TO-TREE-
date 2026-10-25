import { cookies } from 'next/headers';
import { ResourceList } from '@/components/modules/ResourceList';
import { PublicShell } from '@/components/layout/PublicChrome';
import { copy, type Lang } from '@/lib/i18n';

export const instant = false;
export const metadata = { title: 'Library' };

export default async function PublicResourcesPage({ searchParams }: { searchParams: Promise<{ q?: string; lang?: string }> }) {
  const { q, lang } = await searchParams;
  const ui: Lang = (await cookies()).get('lang')?.value === 'sw' ? 'sw' : 'en';
  return (
    <PublicShell lang={ui}>
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <h1 className="font-serif text-3xl tracking-tight sm:text-4xl">{copy[ui].nav.library}</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">{copy[ui].library.title}. {copy[ui].library.body}</p>
        <div className="mt-8"><ResourceList q={q} lang={lang} /></div>
      </main>
    </PublicShell>
  );
}
