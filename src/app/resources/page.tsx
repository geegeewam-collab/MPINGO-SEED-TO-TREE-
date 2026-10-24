import Link from 'next/link';
import { ResourceList } from '@/components/modules/ResourceList';

export const instant = false;

export default async function PublicResourcesPage({ searchParams }: { searchParams: Promise<{ q?: string; lang?: string }> }) {
  const { q, lang } = await searchParams;
  return (
    <div className="min-h-screen bg-background px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">Back to home</Link>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Resource library</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">Guides for collecting, growing and planting Mpingo, published by the network team.</p>
        <div className="mt-8"><ResourceList q={q} lang={lang} /></div>
      </div>
    </div>
  );
}
