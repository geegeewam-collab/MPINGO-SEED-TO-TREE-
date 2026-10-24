import { createClient } from '@/lib/supabase/server';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';

interface Resource { id: string; title: string; category: string | null; content_type: string; language: string; body: string | null; external_url: string | null; file_url: string | null; source_reference: string | null }
const LANG: Record<string, string> = { en: 'English', sw: 'Kiswahili' };

export async function ResourceList({ q = '', lang = '' }: { q?: string; lang?: string }) {
  const sb = await createClient();
  let query = sb.from('resources').select('id, title, category, content_type, language, body, external_url, file_url, source_reference').eq('approval_status', 'approved').order('created_at', { ascending: false }).limit(200);
  if (lang === 'en' || lang === 'sw') query = query.eq('language', lang);
  const { data, error } = await query;
  const needle = q.trim().toLowerCase();
  const all = (data ?? []) as unknown as Resource[];
  const rows = needle ? all.filter((r) => [r.title, r.category, r.body].some((v) => (v ?? '').toLowerCase().includes(needle))) : all;
  return (
    <div>
      <form className="mb-6 flex flex-wrap gap-2" role="search">
        <input name="q" defaultValue={q} placeholder="Search guides and resources" aria-label="Search resources" className="min-w-[14rem] flex-1 rounded-lg border bg-surface px-3 py-2.5 text-sm" />
        <select name="lang" defaultValue={lang} aria-label="Language" className="rounded-lg border bg-surface px-3 py-2.5 text-sm"><option value="">All languages</option><option value="en">English</option><option value="sw">Kiswahili</option></select>
        <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Search</button>
      </form>
      {error ? <div role="alert" className="rounded-xl border border-error/30 bg-error/5 p-4 text-sm text-error">The library could not be loaded.</div>
        : rows.length === 0 ? <EmptyState title={needle || lang ? 'No matches' : 'The library is being prepared'} body={needle || lang ? 'Try a different search or language.' : 'Reviewed guides will appear here once the team publishes them.'} />
        : (
          <ul className="grid gap-4 md:grid-cols-2">
            {rows.map((r) => (
              <li key={r.id} className="flex flex-col rounded-xl border bg-surface p-5">
                <div className="flex flex-wrap items-center gap-2 text-xs"><StatusBadge value={r.content_type} /><span className="text-muted-foreground">{LANG[r.language] ?? r.language}</span>{r.category && <span className="text-muted-foreground">· {r.category}</span>}</div>
                <h2 className="mt-2 font-semibold">{r.title}</h2>
                {r.body && <p className="mt-2 line-clamp-4 whitespace-pre-line text-sm text-muted-foreground">{r.body}</p>}
                {r.source_reference && <p className="mt-2 text-xs text-muted-foreground">Source: {r.source_reference}</p>}
                {(r.external_url || r.file_url) && <a href={r.external_url ?? r.file_url ?? '#'} target="_blank" rel="noopener noreferrer" className="mt-3 text-sm font-medium text-primary underline-offset-2 hover:underline">Open resource (opens in a new tab)</a>}
              </li>
            ))}
          </ul>)}
    </div>
  );
}
