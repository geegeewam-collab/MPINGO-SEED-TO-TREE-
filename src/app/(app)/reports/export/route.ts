import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type Row = Record<string, unknown>;
// Spreadsheet programs run cells that start with = + - @ as formulas, so those cells are prefixed with an apostrophe.
const cell = (v: unknown) => {
  let s = v === null || v === undefined ? '' : String(v);
  if (/^[=+\-@]/.test(s)) s = `'${s}`;
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse('Sign in to export reports.', { status: 401 });
  const { data: role } = await supabase.rpc('current_app_role');
  if (!['admin', 'coordinator', 'verifier'].includes(String(role ?? ''))) return new NextResponse('Your role cannot export reports.', { status: 403 });

  const [ev, ck] = await Promise.all([
    supabase.from('planting_events').select('id, reference, species, planting_date, quantity_planted').order('planting_date', { ascending: false }).limit(5000),
    supabase.from('survival_checks').select('planting_event_id, inspection_date, confirmed_alive, confirmed_dead, unresolved, uninspected')
      .eq('submission_status', 'verified').order('inspection_date', { ascending: false }).limit(5000),
  ]);
  if (ev.error || ck.error) return new NextResponse('The report could not be generated.', { status: 500 });
  const latest = new Map<string, Row>();
  for (const c of (ck.data ?? []) as unknown as Row[]) if (!latest.has(String(c.planting_event_id))) latest.set(String(c.planting_event_id), c);

  const head = ['planting_reference', 'species', 'planting_date', 'trees_planted', 'latest_verified_check', 'alive', 'dead', 'unresolved', 'not_inspected', 'survival_among_classified_pct', 'confirmed_alive_share_pct', 'assessment_coverage_pct'];
  const lines = [head.join(',')];
  for (const e of (ev.data ?? []) as unknown as Row[]) {
    const c = latest.get(String(e.id));
    const planted = Number(e.quantity_planted);
    const alive = c ? Number(c.confirmed_alive) : null, dead = c ? Number(c.confirmed_dead) : null, unres = c ? Number(c.unresolved) : null;
    const classified = alive !== null && dead !== null ? alive + dead : 0;
    const pct = (n: number, d: number) => (d > 0 ? (n / d * 100).toFixed(1) : '');
    lines.push([e.reference, e.species, e.planting_date, planted, c?.inspection_date ?? '', alive ?? '', dead ?? '', unres ?? '', c?.uninspected ?? '',
      alive !== null ? pct(alive, classified) : '', alive !== null ? pct(alive, planted) : '', alive !== null && dead !== null && unres !== null ? pct(alive + dead + unres, planted) : ''].map(cell).join(','));
  }
  return new NextResponse(lines.join('\n') + '\n', { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="mpingo-survival-report.csv"' } });
}
