import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PublicShell } from '@/components/layout/PublicChrome';
import { brand } from '@/lib/brand';

export const instant = false;

interface Trace {
  reference: string; species: string; collection_date: string; quantity: number; unit: string; status: string;
  source_tree_count: number; source_counties: string[];
}

export default async function PublicTracePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createClient();
  // Public-safe summary only: no exact collection place and no coordinates.
  const { data, error } = await supabase.rpc('public_trace', { p_token: token });
  if (error || !data) notFound();
  const lot = data as Trace;
  const rows: [string, React.ReactNode][] = [
    ['Species', lot.species],
    ['Collected', new Date(lot.collection_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })],
    ['Quantity', `${lot.quantity.toLocaleString('en-GB')} ${lot.unit}`],
    ['Source trees', `${lot.source_tree_count} recorded`],
    ['Source counties', lot.source_counties.length ? lot.source_counties.join(', ') : 'Not published'],
    ['Status', <StatusBadge key="s" value={lot.status} />],
  ];
  return (
    <PublicShell mobileBar={false}>
    <main className="px-4 py-12">
      <div className="mx-auto max-w-xl">
        <p className="text-sm text-muted-foreground">{brand.name}: seed lot record</p>
        <h1 className="mt-1 font-serif text-3xl">{lot.reference}</h1>
        <dl className="mt-8 divide-y rounded-2xl border bg-surface">
          {rows.map(([k, v]) => (
            <div key={k} className="flex items-center justify-between gap-4 px-5 py-3.5 text-sm"><dt className="text-muted-foreground">{k}</dt><dd className="text-right font-medium">{v}</dd></div>
          ))}
        </dl>
        <p className="mt-4 text-xs text-muted-foreground">This page shows the approved public summary of the record. Exact collection places are not published.</p>
      </div>
    </main>
    </PublicShell>
  );
}
