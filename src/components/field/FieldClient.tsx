"use client";
import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { queueOperation, listOperations, updateOperation, removeOperation, refreshQueueCount, type QueuedOperation, type EntityType } from '@/lib/offline/db';
import { syncQueue, isNetworkError, explain } from '@/lib/offline/sync';
import { inputClass } from '@/components/forms/Field';

export interface Pick { id: string; label: string; planted?: number }
type Gps = 'idle' | 'locating' | 'captured' | 'denied' | 'unavailable';
type Notice = { tone: 'ok' | 'wait' | 'error'; text: string } | null;
const today = () => new Date().toISOString().slice(0, 10);
const num = (v: string) => (v.trim() === '' ? NaN : Number(v));
const blankToNull = (v: string) => (v.trim() === '' ? null : v.trim());

function L({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-1.5 text-sm"><span className="font-medium">{label}</span>{children}</label>;
}

export function FieldClient({ userId, role, sites, distributions, events }: { userId: string; role: string; sites: Pick[]; distributions: Pick[]; events: Pick[] }) {
  const canPlant = ['admin', 'coordinator', 'grower'].includes(role);
  const canCheck = ['admin', 'coordinator', 'verifier'].includes(role);
  const [tab, setTab] = useState<'plant' | 'check'>(canPlant ? 'plant' : 'check');
  const [notice, setNotice] = useState<Notice>(null);
  const [queue, setQueue] = useState<QueuedOperation[]>([]);
  const [busy, setBusy] = useState(false);
  // planting form
  const [p, setP] = useState({ site: '', dist: '', date: today(), species: 'Dalbergia melanoxylon', qty: '', notes: '', lat: '', lng: '', acc: '', method: 'manual' });
  const [gps, setGps] = useState<Gps>('idle');
  // survival form
  const [c, setC] = useState({ event: '', date: today(), alive: '', dead: '', unres: '', unins: '', method: 'full_census', notes: '' });

  const reload = useCallback(async () => { setQueue(await listOperations(userId)); await refreshQueueCount(userId); }, [userId]);
  const send = useCallback(async () => {
    setBusy(true);
    const r = await syncQueue(userId);
    await reload();
    setBusy(false);
    if (r.stopped === 'signed-out') setNotice({ tone: 'error', text: 'Your sign-in has expired. Sign in again to send the waiting records.' });
    else if (r.stopped === 'offline') setNotice({ tone: 'wait', text: 'Still offline. Records stay on this device until you are connected.' });
    else if (r.sent > 0) setNotice({ tone: 'ok', text: `${r.sent} record${r.sent === 1 ? '' : 's'} sent and confirmed by the system.` });
  }, [userId, reload]);

  useEffect(() => {
    const first = setTimeout(() => void send(), 0);
    const onOnline = () => void send();
    window.addEventListener('online', onOnline);
    const t = setInterval(() => { if (navigator.onLine) void send(); }, 60000);
    return () => { clearTimeout(first); window.removeEventListener('online', onOnline); clearInterval(t); };
  }, [send]);

  function capture() {
    if (!('geolocation' in navigator)) { setGps('unavailable'); return; }
    setGps('locating');
    navigator.geolocation.getCurrentPosition(
      (pos) => { setP((s) => ({ ...s, lat: pos.coords.latitude.toFixed(6), lng: pos.coords.longitude.toFixed(6), acc: String(Math.round(pos.coords.accuracy)), method: 'gps' })); setGps('captured'); },
      () => setGps('denied'), { enableHighAccuracy: true, timeout: 15000 });
  }

  async function submit(entityType: EntityType, payload: QueuedOperation['payload'], summary: string, reset: () => void) {
    setBusy(true); setNotice(null);
    const save = async () => { await queueOperation({ entityType, payload, summary, userId }); reset(); await reload(); };
    if (!navigator.onLine) { await save(); setBusy(false); setNotice({ tone: 'wait', text: 'Saved on this device only. It has not reached the system yet. It will be sent when you are online.' }); return; }
    const { error } = await createClient().from(entityType === 'planting_event' ? 'planting_events' : 'survival_checks').insert(payload);
    if (!error) { reset(); setNotice({ tone: 'ok', text: 'Saved. The system has confirmed this record.' }); }
    else if (isNetworkError(error)) { await save(); setNotice({ tone: 'wait', text: 'The connection dropped. Saved on this device only; it will be sent automatically.' }); }
    else setNotice({ tone: 'error', text: `Not saved. ${explain(error)}` });
    setBusy(false);
  }

  function plant(e: React.FormEvent) {
    e.preventDefault();
    const qty = num(p.qty), lat = num(p.lat), lng = num(p.lng);
    if (!p.site) return setNotice({ tone: 'error', text: 'Choose the planting site.' });
    if (!Number.isInteger(qty) || qty < 1) return setNotice({ tone: 'error', text: 'Enter the number of trees planted as a whole number.' });
    const hasCoords = !Number.isNaN(lat) || !Number.isNaN(lng);
    if (hasCoords && (Number.isNaN(lat) || Number.isNaN(lng) || lat < -12 || lat > 6 || lng < 28 || lng > 43)) return setNotice({ tone: 'error', text: 'Check the coordinates: they should be in East Africa, with latitude first.' });
    const payload = { id: crypto.randomUUID(), site_id: p.site, distribution_id: blankToNull(p.dist), planting_date: p.date, species: p.species.trim() || 'Dalbergia melanoxylon', quantity_planted: qty, notes: blankToNull(p.notes), recorder_id: userId, responsible_grower: role === 'grower' ? userId : null,
      ...(hasCoords ? { latitude: lat, longitude: lng, location_accuracy: Number.isNaN(num(p.acc)) ? null : num(p.acc), capture_method: p.method, capture_timestamp: new Date().toISOString() } : {}) };
    void submit('planting_event', payload, `Planting of ${qty} trees on ${p.date}`, () => { setP((s) => ({ ...s, qty: '', notes: '', lat: '', lng: '', acc: '', method: 'manual' })); setGps('idle'); });
  }

  const planted = events.find((x) => x.id === c.event)?.planted ?? 0;
  const counts = [c.alive, c.dead, c.unres, c.unins].map((v) => (v.trim() === '' ? 0 : Number(v)));
  const total = counts.reduce((a, b) => a + b, 0);
  function check(e: React.FormEvent) {
    e.preventDefault();
    if (!c.event) return setNotice({ tone: 'error', text: 'Choose the planting you inspected.' });
    if (counts.some((n) => !Number.isInteger(n) || n < 0)) return setNotice({ tone: 'error', text: 'Counts must be whole numbers, zero or more.' });
    if (total !== planted) return setNotice({ tone: 'error', text: `The four counts add up to ${total}, but ${planted} trees were planted. Put every tree you did not check under "Not inspected".` });
    const payload = { id: crypto.randomUUID(), planting_event_id: c.event, inspection_date: c.date, confirmed_alive: counts[0], confirmed_dead: counts[1], unresolved: counts[2], uninspected: counts[3], sample_size: counts[0] + counts[1] + counts[2], inspection_method: c.method, notes: blankToNull(c.notes), created_by: userId, observer_id: userId };
    void submit('survival_check', payload, `Survival check of ${events.find((x) => x.id === c.event)?.label ?? 'a planting'} on ${c.date}`, () => setC((s) => ({ ...s, alive: '', dead: '', unres: '', unins: '', notes: '' })));
  }

  const toneClass = { ok: 'border-success/30 bg-success/10 text-success', wait: 'border-warning/30 bg-warning/10 text-warning', error: 'border-error/30 bg-error/5 text-error' };
  const GPS_TEXT: Record<Gps, string> = { idle: 'GPS is used only when you press the button.', locating: 'Finding your position…', captured: 'Coordinates captured.', denied: 'Location permission was denied. Type the coordinates instead.', unavailable: 'GPS is not available here. Type the coordinates instead.' };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div role="tablist" aria-label="What are you recording?" className="grid grid-cols-2 gap-2 rounded-xl border bg-surface p-1">
        {canPlant && <button role="tab" aria-selected={tab === 'plant'} onClick={() => setTab('plant')} className={`rounded-lg px-4 py-3 text-sm font-medium ${tab === 'plant' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}>Record planting</button>}
        {canCheck && <button role="tab" aria-selected={tab === 'check'} onClick={() => setTab('check')} className={`rounded-lg px-4 py-3 text-sm font-medium ${tab === 'check' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}>Survival check</button>}
      </div>

      {notice && <p role={notice.tone === 'error' ? 'alert' : 'status'} className={`rounded-lg border p-3 text-sm font-medium ${toneClass[notice.tone]}`}>{notice.text}</p>}

      {tab === 'plant' && canPlant && (
        <form onSubmit={plant} className="space-y-4 rounded-2xl border bg-surface p-5" noValidate>
          <L label="Planting site"><select value={p.site} onChange={(e) => setP({ ...p, site: e.target.value })} className={inputClass}><option value="">{sites.length ? 'Choose a site…' : 'No sites yet. Register one first.'}</option>{sites.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select></L>
          <L label="Seedlings came from (optional)"><select value={p.dist} onChange={(e) => setP({ ...p, dist: e.target.value })} className={inputClass}><option value="">Not linked to a distribution</option>{distributions.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}</select></L>
          <div className="grid gap-4 sm:grid-cols-2">
            <L label="Planting date"><input type="date" value={p.date} onChange={(e) => setP({ ...p, date: e.target.value })} className={inputClass} /></L>
            <L label="Trees planted"><input inputMode="numeric" value={p.qty} onChange={(e) => setP({ ...p, qty: e.target.value })} className={inputClass} /></L>
          </div>
          <fieldset className="space-y-3 rounded-xl border p-4"><legend className="px-1 text-sm font-medium">Location (private)</legend>
            <div className="grid grid-cols-3 gap-3">
              <input aria-label="Latitude" placeholder="Latitude" inputMode="decimal" value={p.lat} onChange={(e) => setP({ ...p, lat: e.target.value, method: 'manual' })} className={inputClass} />
              <input aria-label="Longitude" placeholder="Longitude" inputMode="decimal" value={p.lng} onChange={(e) => setP({ ...p, lng: e.target.value, method: 'manual' })} className={inputClass} />
              <input aria-label="Accuracy in metres" placeholder="Accuracy (m)" inputMode="decimal" value={p.acc} onChange={(e) => setP({ ...p, acc: e.target.value })} className={inputClass} />
            </div>
            <div className="flex flex-wrap items-center gap-3"><button type="button" onClick={capture} disabled={gps === 'locating'} className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-accent">Use my location</button><span role="status" className="text-xs text-muted-foreground">{GPS_TEXT[gps]}</span></div>
          </fieldset>
          <L label="Notes (optional)"><textarea rows={2} value={p.notes} onChange={(e) => setP({ ...p, notes: e.target.value })} className={inputClass} /></L>
          <button disabled={busy} className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground disabled:opacity-60">{busy ? 'Saving…' : 'Save planting'}</button>
        </form>
      )}

      {tab === 'check' && canCheck && (
        <form onSubmit={check} className="space-y-4 rounded-2xl border bg-surface p-5" noValidate>
          <L label="Planting inspected"><select value={c.event} onChange={(e) => setC({ ...c, event: e.target.value })} className={inputClass}><option value="">{events.length ? 'Choose a planting…' : 'No plantings available'}</option>{events.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}</select></L>
          <div className="grid gap-4 sm:grid-cols-2">
            <L label="Inspection date"><input type="date" value={c.date} onChange={(e) => setC({ ...c, date: e.target.value })} className={inputClass} /></L>
            <L label="Method"><select value={c.method} onChange={(e) => setC({ ...c, method: e.target.value })} className={inputClass}><option value="full_census">Full census</option><option value="random_sample">Sample (some trees not checked)</option><option value="other">Other</option></select></L>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <L label="Confirmed alive"><input inputMode="numeric" value={c.alive} onChange={(e) => setC({ ...c, alive: e.target.value })} className={inputClass} /></L>
            <L label="Confirmed dead"><input inputMode="numeric" value={c.dead} onChange={(e) => setC({ ...c, dead: e.target.value })} className={inputClass} /></L>
            <L label="Could not be confirmed"><input inputMode="numeric" value={c.unres} onChange={(e) => setC({ ...c, unres: e.target.value })} className={inputClass} /></L>
            <L label="Not inspected"><input inputMode="numeric" value={c.unins} onChange={(e) => setC({ ...c, unins: e.target.value })} className={inputClass} /></L>
          </div>
          <p role="status" className={`text-sm ${c.event && total === planted ? 'text-success' : 'text-muted-foreground'}`}>{c.event ? `Counts add up to ${total} of ${planted} planted.` : 'Choose a planting to see how many were planted.'} If you checked only a sample, count every tree you did not check as &quot;Not inspected&quot;.</p>
          <L label="Notes (optional)"><textarea rows={2} value={c.notes} onChange={(e) => setC({ ...c, notes: e.target.value })} className={inputClass} /></L>
          <button disabled={busy} className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground disabled:opacity-60">{busy ? 'Saving…' : 'Submit for verification'}</button>
        </form>
      )}

      <section aria-labelledby="queue" className="rounded-2xl border bg-surface p-5">
        <div className="flex items-center justify-between gap-3"><h2 id="queue" className="text-sm font-semibold">Waiting on this device</h2><button onClick={() => void send()} disabled={busy || queue.length === 0} className="rounded-lg border px-3 py-1.5 text-sm font-medium hover:bg-accent disabled:opacity-50">Send now</button></div>
        {queue.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">Nothing is waiting. Everything you saved has been confirmed by the system.</p> : (
          <ul className="mt-3 divide-y text-sm">{queue.map((o) => (
            <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
              <div><p className="font-medium">{o.summary}</p><p className={o.status === 'failed' ? 'text-error' : 'text-muted-foreground'}>{o.status === 'failed' ? `Not accepted: ${o.lastError}` : o.status === 'syncing' ? 'Sending…' : 'Waiting for a connection. Not in the system yet.'}</p></div>
              {o.status === 'failed' && <span className="flex gap-2"><button onClick={async () => { await updateOperation(o.id, { status: 'pending', lastError: null }); void send(); }} className="rounded-md border px-2.5 py-1 text-xs font-medium hover:bg-accent">Try again</button><button onClick={async () => { if (window.confirm('Discard this record? It has not been saved anywhere else.')) { await removeOperation(o.id, userId); await reload(); } }} className="rounded-md border border-error/40 px-2.5 py-1 text-xs font-medium text-error hover:bg-error/5">Discard</button></span>}
            </li>))}</ul>)}
      </section>
    </div>
  );
}
