import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { headers } from 'next/headers';
import QRCode from 'qrcode';
import { createClient } from '@/lib/supabase/server';
import { getModule, RELATIONS } from '@/lib/modules';
import { calculateSurvivalMetrics } from '@/lib/calculations/survival';
import { fmtPct } from '@/lib/queries';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { relationLabel } from './NewRecordPage';
import { TransitionPanel, MovementForm, GroveUpdateForm, UpdateToggle } from './ActionPanels';
import { PhotoUploader, RemovePhoto } from './Photos';

type Row = Record<string, unknown>;
const EXTRA: Record<string, [string, string][]> = {
  requests: [['requester_name', 'Requester'], ['email', 'Email'], ['phone', 'Phone'], ['organisation_name', 'Organisation'], ['request_type', 'Request'], ['requested_quantity', 'Quantity'], ['unit', 'Unit'], ['intended_use', 'Intended use'], ['county', 'County'], ['destination_details', 'Destination'], ['desired_date', 'Wanted by'], ['review_notes', 'Review notes']],
  members: [['full_name', 'Name'], ['applicant_type', 'Type'], ['organisation_name', 'Organisation'], ['email', 'Email'], ['phone', 'Phone'], ['county', 'County'], ['location_details', 'Location'], ['experience_notes', 'Experience'], ['participation_goal', 'Hopes'], ['review_notes', 'Review notes']],
  survival: [['verification_notes', 'Reviewer note'], ['verification_date', 'Reviewed on']],
  distributions: [['dispatch_date', 'Dispatched'], ['receipt_date', 'Received']],
};
const fmt = (v: unknown): React.ReactNode => {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (Array.isArray(v)) return v.length ? v.join(', ') : '—';
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v)) return new Date(v).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  return String(v);
};

export async function RecordDetail({ slug, id, saved }: { slug: string; id: string; saved?: boolean }) {
  const def = getModule(slug);
  if (!def) notFound();
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/login');
  const { data: roleData } = await sb.rpc('current_app_role');
  const role = String(roleData ?? '');
  const { data, error } = await sb.from(def.table).select('*').eq('id', id).maybeSingle();
  if (error || !data) notFound();
  const row = data as Row;

  const rows: [string, React.ReactNode][] = [];
  for (const f of def.fields) {
    let v: React.ReactNode = fmt(row[f.name]);
    if (f.type === 'relation' && row[f.name] && RELATIONS[f.relation ?? '']?.person) {
      const { data: ppl } = await sb.rpc('person_options', { p_role: RELATIONS[f.relation ?? ''].person });
      v = ((ppl ?? []) as { id: string; full_name: string }[]).find((x) => x.id === row[f.name])?.full_name ?? 'Assigned';
    } else if (f.type === 'relation' && row[f.name]) {
      const rel = RELATIONS[f.relation ?? ''];
      const { data: rr } = await sb.from(rel.table).select(rel.select).eq('id', String(row[f.name])).maybeSingle();
      v = rr ? relationLabel(f.relation ?? '', rr as unknown as Row) : 'Not visible to you';
    }
    rows.push([f.label, v]);
  }
  for (const [k, label] of EXTRA[slug] ?? []) rows.push([label, fmt(row[k])]);
  rows.push(['Recorded', fmt(row.created_at)]);

  const status = slug === 'groves' ? (row.is_published ? 'published' : 'draft') : def.statusColumn ? String(row[def.statusColumn]) : null;
  const title = String(row.title ?? row.reference ?? row.full_name ?? def.singular);
  const mine = slug === 'survival' && row.observer_id === user.id;
  const editable = def.createRoles.length > 0 && (def.editRoles ?? def.createRoles).includes(role)
    && (!def.editWhen || !status || def.editWhen.includes(status))
    && !(slug === 'survival' && role === 'coordinator' && row.observer_id !== user.id);
  const available = (def.transitions ?? []).filter((t) => status !== null && t.from.includes(status) && t.roles.includes(role));

  // Section data
  let qr: { svg: string; url: string } | null = null;
  let sourcesList: Row[] = [], batchList: Row[] = [], moves: Row[] = [], groveUpdates: Row[] = [];
  let metrics: ReturnType<typeof calculateSurvivalMetrics> | null = null, planted: number | null = null;
  let photos: { id: string; path: string; url: string; mine: boolean }[] = [];
  if (slug === 'seed-lots') {
    const { data: s } = await sb.from('seed_lot_sources').select('mother_trees(id, reference, county)').eq('seed_lot_id', id);
    sourcesList = ((s ?? []) as unknown as { mother_trees: Row | Row[] | null }[]).flatMap((x) => (Array.isArray(x.mother_trees) ? x.mother_trees : x.mother_trees ? [x.mother_trees] : []));
    const { data: b } = await sb.from('nursery_batches').select('id, reference, current_stock').eq('seed_lot_id', id);
    batchList = (b ?? []) as unknown as Row[];
    const h = await headers();
    const origin = process.env.NEXT_PUBLIC_SITE_URL ?? `${h.get('x-forwarded-proto') ?? 'https'}://${h.get('x-forwarded-host') ?? h.get('host')}`;
    const url = `${origin}/trace/${String(row.public_token)}`;
    qr = { svg: await QRCode.toString(url, { type: 'svg', margin: 1, width: 192 }), url };
  }
  if (slug === 'events' || slug === 'survival') {
    const { data: ph } = await sb.from('evidence_photos').select('id, storage_path, uploaded_by').eq('entity_type', slug === 'events' ? 'planting_event' : 'survival_check').eq('entity_id', id).order('created_at');
    const list = (ph ?? []) as unknown as { id: string; storage_path: string; uploaded_by: string }[];
    const { data: signed } = list.length ? await sb.storage.from('evidence').createSignedUrls(list.map((x) => x.storage_path), 3600) : { data: [] };
    photos = list.flatMap((x) => { const u = (signed ?? []).find((y) => y.path === x.storage_path)?.signedUrl; return u ? [{ id: x.id, path: x.storage_path, url: u, mine: x.uploaded_by === user.id || role === 'admin' }] : []; });
  }
  if (slug === 'groves') {
    const { data: gu } = await sb.from('grove_updates').select('id, update_date, title, content, is_public').eq('grove_id', id).order('update_date', { ascending: false });
    groveUpdates = (gu ?? []) as unknown as Row[];
  }
  if (slug === 'batches') {
    const { data: m } = await sb.from('nursery_inventory_movements').select('movement_type, quantity, movement_date, notes').eq('batch_id', id).order('movement_date', { ascending: false }).limit(50);
    moves = (m ?? []) as unknown as Row[];
  }
  if (slug === 'survival') {
    const { data: ev } = await sb.from('planting_events').select('quantity_planted').eq('id', String(row.planting_event_id)).maybeSingle();
    planted = ev ? Number((ev as Row).quantity_planted) : null;
    if (planted !== null) metrics = calculateSurvivalMetrics(planted, Number(row.confirmed_alive), Number(row.confirmed_dead), Number(row.unresolved), Number(row.uninspected));
  }

  return (
    <div className="max-w-4xl space-y-6">
      <Link href={def.basePath} className="text-sm text-muted-foreground hover:text-foreground">Back to {def.title}</Link>
      <PageHeader title={title} description={status ? undefined : undefined} actions={<div className="flex items-center gap-3">{status && <StatusBadge value={status} />}{editable && <Link href={`${def.basePath}/${id}/edit`} className="rounded-lg border px-3 py-1.5 text-sm font-medium hover:bg-accent">Edit</Link>}</div>} />
      {saved && <p role="status" className="rounded-lg border border-success/30 bg-success/10 p-3 text-sm font-medium text-success">Saved.</p>}

      <dl className="divide-y rounded-xl border bg-surface">
        {rows.map(([k, v]) => <div key={k} className="grid gap-1 px-5 py-3 text-sm sm:grid-cols-3"><dt className="text-muted-foreground">{k}</dt><dd className="sm:col-span-2 whitespace-pre-line">{v}</dd></div>)}
      </dl>

      {def.coords && row.latitude !== null && row.latitude !== undefined && (
        <div className="rounded-xl border bg-surface p-5 text-sm">
          <p className="font-medium">Private location</p>
          <p className="mt-1 text-muted-foreground">Visible to authorised staff only. Never shown on public pages.</p>
          <p className="mt-2">{String(row.latitude)}, {String(row.longitude)} {row.location_accuracy ? `(accuracy about ${String(row.location_accuracy)} m)` : ''}, entered {row.capture_method === 'gps' ? 'from GPS' : 'by hand'}</p>
        </div>
      )}

      {metrics && planted !== null && (
        <div className="grid gap-3 sm:grid-cols-3">
          {[['Alive among trees classified', metrics.survivalAmongClassified, 'Alive divided by alive plus dead.'], ['Confirmed alive of those planted', metrics.confirmedAliveShare, `Alive divided by ${planted} planted.`], ['Trees assessed', metrics.assessmentCoverage, 'Alive, dead and unresolved divided by planted.']].map(([l, v, n]) => (
            <div key={String(l)} className="rounded-xl border bg-surface p-4"><p className="text-sm text-muted-foreground">{String(l)}</p><p className="mt-1 text-2xl font-semibold">{fmtPct(v as number | null)}</p><p className="mt-1 text-xs text-muted-foreground">{String(n)}</p></div>
          ))}
        </div>
      )}

      {qr && (
        <div className="flex flex-wrap items-center gap-5 rounded-xl border bg-surface p-5">
          <div className="h-40 w-40 shrink-0 rounded-lg bg-white p-1" role="img" aria-label="QR code for the public record" dangerouslySetInnerHTML={{ __html: qr.svg }} />
          <div className="text-sm"><p className="font-medium">Public record QR code</p><p className="mt-1 break-all text-muted-foreground">{qr.url}</p><p className="mt-2 text-xs text-muted-foreground">Anyone with this link sees the approved public summary only.</p></div>
        </div>
      )}
      {slug === 'seed-lots' && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border bg-surface p-5 text-sm"><p className="font-medium">Source mother trees</p>{sourcesList.length ? <ul className="mt-2 space-y-1">{sourcesList.map((m) => <li key={String(m.id)}><Link className="underline" href={`/provenance/mother-trees/${String(m.id)}`}>{String(m.reference)}</Link> <span className="text-muted-foreground">{String(m.county ?? '')}</span></li>)}</ul> : <p className="mt-2 text-muted-foreground">None visible.</p>}</div>
          <div className="rounded-xl border bg-surface p-5 text-sm"><p className="font-medium">Nursery batches</p>{batchList.length ? <ul className="mt-2 space-y-1">{batchList.map((b) => <li key={String(b.id)}><Link className="underline" href={`/production/batches/${String(b.id)}`}>{String(b.reference)}</Link> <span className="text-muted-foreground">{String(b.current_stock)} in stock</span></li>)}</ul> : <p className="mt-2 text-muted-foreground">No batches sown from this lot yet.</p>}</div>
        </div>
      )}
      {slug === 'batches' && (
        <>
          {['admin', 'coordinator', 'nursery_operator'].includes(role) && <MovementForm batch={id} />}
          <div className="rounded-xl border bg-surface p-5 text-sm"><p className="font-medium">Stock history</p>
            {moves.length === 0 ? <p className="mt-2 text-muted-foreground">No stock movements recorded.</p> : (
              <table className="mt-3 w-full"><thead className="text-left text-muted-foreground"><tr><th className="py-1 font-medium">Date</th><th className="font-medium">Type</th><th className="font-medium">Quantity</th><th className="font-medium">Notes</th></tr></thead>
                <tbody className="divide-y">{moves.map((m, i) => <tr key={i}><td className="py-2">{fmt(m.movement_date)}</td><td><StatusBadge value={String(m.movement_type)} /></td><td>{String(m.quantity)}</td><td className="text-muted-foreground">{fmt(m.notes)}</td></tr>)}</tbody></table>)}
          </div>
        </>
      )}

      {(slug === 'events' || slug === 'survival') && (
        <div className="space-y-3 rounded-xl border bg-surface p-5 text-sm">
          <p className="font-medium">Photo evidence</p>
          {photos.length === 0 ? <p className="text-muted-foreground">No photos yet.</p> : (
            <ul className="grid gap-3 sm:grid-cols-3">{photos.map((p) => (
              <li key={p.id} className="space-y-1.5">
                <a href={p.url} target="_blank" rel="noopener noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url} alt="Field evidence" className="aspect-[4/3] w-full rounded-lg border object-cover" />
                </a>
                {p.mine && !(slug === 'survival' && status === 'verified') && <RemovePhoto kind="evidence" id={p.id} path={p.path} />}
              </li>))}</ul>)}
          {!(slug === 'survival' && status === 'verified') && !['pending', 'sponsor'].includes(role)
            ? <PhotoUploader kind={slug === 'events' ? 'planting_event' : 'survival_check'} recordId={id} />
            : <p className="text-xs text-muted-foreground">Photos cannot be added once a check has been verified.</p>}
        </div>
      )}
      {slug === 'groves' && (
        <>
          <div className="space-y-3 rounded-xl border bg-surface p-5 text-sm">
            <p className="font-medium">Approved photos for the public page</p>
            {((row.approved_photos as string[] | null) ?? []).length === 0 ? <p className="text-muted-foreground">No photos yet.</p> : (
              <ul className="grid gap-3 sm:grid-cols-3">{((row.approved_photos as string[] | null) ?? []).map((u) => (
                <li key={u} className="space-y-1.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={u} alt="Grove photograph" className="aspect-[4/3] w-full rounded-lg border object-cover" />
                  <RemovePhoto kind="grove" path={u} recordId={id} />
                </li>))}</ul>)}
            <p className="text-xs text-muted-foreground">Only add photos you are happy for anyone to see. Do not include faces of people who have not agreed, or anything that shows an exact location.</p>
            <PhotoUploader kind="grove" recordId={id} />
          </div>
          <GroveUpdateForm grove={id} />
          <div className="rounded-xl border bg-surface p-5 text-sm"><p className="font-medium">Updates</p>
            {groveUpdates.length === 0 ? <p className="mt-2 text-muted-foreground">No updates yet.</p> : (
              <ol className="mt-3 divide-y">{groveUpdates.map((u) => (
                <li key={String(u.id)} className="flex flex-wrap items-start justify-between gap-3 py-3">
                  <div><p className="text-xs text-muted-foreground">{fmt(u.update_date)} · {u.is_public ? 'Public' : 'Private'}</p><p className="font-medium">{String(u.title)}</p><p className="text-muted-foreground">{String(u.content)}</p></div>
                  <UpdateToggle grove={id} update={String(u.id)} isPublic={Boolean(u.is_public)} />
                </li>))}</ol>)}
          </div>
        </>
      )}
      {mine && status === 'submitted' && <p className="rounded-lg border bg-surface p-4 text-sm text-muted-foreground">You submitted this check, so a different verifier must review it.</p>}
      {available.length > 0 && !mine && <TransitionPanel slug={slug} id={id} actions={available.map((t) => ({ to: t.to, label: t.label, danger: t.danger }))} askNotes={available.some((t) => t.needsNotes) || !!def.notesColumn} />}
    </div>
  );
}
