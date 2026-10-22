import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { calculateSurvivalMetrics } from '@/lib/calculations/survival';
import { fmtPct } from '@/lib/queries';

export const instant = false;

interface Check { inspection_date: string; alive: number; dead: number; unresolved: number; uninspected: number }
interface Grove {
  title: string; description: string | null; sponsor_name: string | null; photos: string[] | null; site_county: string | null;
  planting: { date: string | null; species: string; quantity: number } | null;
  latest_verified_check: Check | null;
  updates: { date: string; title: string; content: string; photo_url: string | null }[];
}
const date = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

export default async function GrovePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('public_grove', { p_slug: slug });
  if (error || !data) notFound();
  const g = data as Grove;
  const ck = g.latest_verified_check;
  const m = ck && g.planting ? calculateSurvivalMetrics(g.planting.quantity, ck.alive, ck.dead, ck.unresolved, ck.uninspected) : null;

  return (
    <main className="min-h-screen bg-background px-4 py-12 sm:py-16">
      <div className="mx-auto max-w-3xl space-y-10">
        <header>
          {g.sponsor_name && <p className="text-sm text-muted-foreground">Supported by {g.sponsor_name}</p>}
          <h1 className="mt-1 text-4xl font-semibold tracking-tight">{g.title}</h1>
          {g.description && <p className="mt-3 max-w-2xl text-muted-foreground">{g.description}</p>}
        </header>

        <section aria-labelledby="planting" className="rounded-2xl border bg-surface p-6">
          <h2 id="planting" className="font-semibold">Planting</h2>
          {g.planting ? (
            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-3">
              <div><dt className="text-muted-foreground">Trees planted</dt><dd className="mt-1 text-2xl font-semibold">{g.planting.quantity.toLocaleString('en-GB')}</dd></div>
              <div><dt className="text-muted-foreground">Planted on</dt><dd className="mt-1 font-medium">{g.planting.date ? date(g.planting.date) : 'Not recorded'}</dd></div>
              <div><dt className="text-muted-foreground">County</dt><dd className="mt-1 font-medium">{g.site_county ?? 'Not published'}</dd></div>
            </dl>
          ) : <p className="mt-2 text-sm text-muted-foreground">Planting details have not been published yet.</p>}
        </section>

        <section aria-labelledby="survival" className="rounded-2xl border bg-surface p-6">
          <h2 id="survival" className="font-semibold">Verified survival</h2>
          {ck && m ? (
            <>
              <p className="mt-1 text-sm text-muted-foreground">Field check on {date(ck.inspection_date)}, reviewed by a second person before publication.</p>
              <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-3">
                <div><dt className="text-muted-foreground">Alive among trees classified</dt><dd className="mt-1 text-2xl font-semibold">{fmtPct(m.survivalAmongClassified)}</dd></div>
                <div><dt className="text-muted-foreground">Confirmed alive of those planted</dt><dd className="mt-1 text-2xl font-semibold">{fmtPct(m.confirmedAliveShare)}</dd></div>
                <div><dt className="text-muted-foreground">Trees assessed</dt><dd className="mt-1 text-2xl font-semibold">{fmtPct(m.assessmentCoverage)}</dd></div>
              </dl>
              <p className="mt-4 text-xs text-muted-foreground">{ck.alive} alive, {ck.dead} dead, {ck.unresolved} could not be confirmed, {ck.uninspected} not inspected. Trees that could not be confirmed are not counted as alive or dead.</p>
            </>
          ) : <p className="mt-2 text-sm text-muted-foreground">No verified survival check has been published yet.</p>}
        </section>

        {g.photos && g.photos.length > 0 && (
          <section aria-label="Photographs" className="grid gap-3 sm:grid-cols-2">
            {g.photos.map((src) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={src} src={src} alt={`Photograph from ${g.title}`} className="aspect-[4/3] w-full rounded-xl border object-cover" />
            ))}
          </section>
        )}

        {g.updates.length > 0 && (
          <section aria-labelledby="updates">
            <h2 id="updates" className="mb-4 font-semibold">Updates</h2>
            <ol className="space-y-6 border-l pl-6">
              {g.updates.map((u, i) => (
                <li key={`${u.date}-${i}`}>
                  <p className="text-xs text-muted-foreground">{date(u.date)}</p>
                  <h3 className="mt-0.5 font-medium">{u.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{u.content}</p>
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>
    </main>
  );
}
