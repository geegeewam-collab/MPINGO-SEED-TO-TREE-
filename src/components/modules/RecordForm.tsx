"use client";
import { useActionState, useState } from 'react';
import Link from 'next/link';
import { createRecord, updateRecord } from '@/app/actions/records';
import type { FormState } from '@/app/actions/public';
import type { FieldDef, Opt } from '@/lib/modules';
import { Field, inputClass } from '@/components/forms/Field';

type Gps = 'idle' | 'locating' | 'captured' | 'denied' | 'unavailable';
const GPS_TEXT: Record<Gps, string> = {
  idle: 'GPS is only used when you press the button. You can also type coordinates.',
  locating: 'Finding your position…',
  captured: 'Coordinates captured. They are saved only when you submit this form.',
  denied: 'Location permission was denied. Type the coordinates instead.',
  unavailable: 'GPS is not available on this device. Type the coordinates instead.',
};

function Coords({ errors, initial }: { errors: Record<string, string>; initial: Record<string, string> }) {
  const [lat, setLat] = useState(initial.latitude ?? ''), [lng, setLng] = useState(initial.longitude ?? ''), [acc, setAcc] = useState(initial.location_accuracy ?? ''), [method, setMethod] = useState(initial.capture_method ?? 'manual');
  const [gps, setGps] = useState<Gps>('idle');
  function capture() {
    if (!('geolocation' in navigator)) { setGps('unavailable'); return; }
    setGps('locating');
    navigator.geolocation.getCurrentPosition(
      (p) => { setLat(p.coords.latitude.toFixed(6)); setLng(p.coords.longitude.toFixed(6)); setAcc(String(Math.round(p.coords.accuracy))); setMethod('gps'); setGps('captured'); },
      () => setGps('denied'), { enableHighAccuracy: true, timeout: 15000 });
  }
  const typed = (set: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => { set(e.target.value); setMethod('manual'); };
  return (
    <fieldset className="space-y-4 rounded-xl border p-4">
      <legend className="px-1 text-sm font-medium">Location (private, staff only)</legend>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Latitude" name="latitude" error={errors.latitude}><input id="latitude" name="latitude" inputMode="decimal" value={lat} onChange={typed(setLat)} className={inputClass} placeholder="-0.3031" /></Field>
        <Field label="Longitude" name="longitude"><input id="longitude" name="longitude" inputMode="decimal" value={lng} onChange={typed(setLng)} className={inputClass} placeholder="36.0800" /></Field>
        <Field label="Accuracy (metres)" name="location_accuracy"><input id="location_accuracy" name="location_accuracy" inputMode="decimal" value={acc} onChange={(e) => setAcc(e.target.value)} className={inputClass} /></Field>
      </div>
      <input type="hidden" name="capture_method" value={method} />
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={capture} disabled={gps === 'locating'} className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-accent disabled:opacity-60">Use my location</button>
        <p role="status" className="text-xs text-muted-foreground">{GPS_TEXT[gps]}</p>
      </div>
    </fieldset>
  );
}

export function RecordForm({ slug, fields, options, coords, sources, cancelHref, submitLabel, recordId, initial = {} }: {
  slug: string; fields: FieldDef[]; options: Record<string, Opt[]>; coords?: boolean; sources?: Opt[]; cancelHref: string; submitLabel: string; recordId?: string; initial?: Record<string, string>;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(recordId ? updateRecord.bind(null, slug, recordId) : createRecord.bind(null, slug), { status: 'idle' });
  const e = state.fieldErrors ?? {};
  return (
    <form action={action} className="max-w-3xl space-y-5 rounded-2xl border bg-surface p-5 sm:p-8" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        {fields.map((f) => {
          const wide = f.type === 'textarea';
          const common = { id: f.name, name: f.name, className: inputClass, 'aria-invalid': !!e[f.name], 'aria-describedby': e[f.name] ? `${f.name}-error` : f.hint ? `${f.name}-hint` : undefined };
          const list = f.type === 'relation' ? options[f.relation ?? ''] ?? [] : f.options ?? [];
          return (
            <div key={f.name} className={wide ? 'sm:col-span-2' : undefined}>
              <Field label={f.required ? f.label : `${f.label} (optional)`} name={f.name} error={e[f.name]} hint={f.hint}>
                {f.type === 'textarea' ? <textarea {...common} rows={3} defaultValue={initial[f.name]} />
                  : f.type === 'select' || f.type === 'relation' ? (
                    <select {...common} defaultValue={initial[f.name] ?? f.defaultValue ?? ''}>
                      <option value="" disabled={!!f.required}>{f.type === 'relation' && list.length === 0 ? 'Nothing available yet' : 'Choose…'}</option>
                      {list.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>)
                  : <input {...common} type={f.type === 'date' ? 'date' : f.type === 'url' ? 'url' : 'text'} inputMode={f.type === 'int' ? 'numeric' : f.type === 'number' ? 'decimal' : undefined} defaultValue={initial[f.name] ?? f.defaultValue} />}
              </Field>
            </div>
          );
        })}
      </div>
      {sources && (
        <fieldset className="rounded-xl border p-4">
          <legend className="px-1 text-sm font-medium">Source mother trees</legend>
          {sources.length === 0 ? <p className="text-sm text-muted-foreground">No mother trees are registered yet. Add one first.</p> : (
            <div className="grid gap-2 sm:grid-cols-2">{sources.map((o) => (
              <label key={o.value} className="flex items-center gap-2 text-sm"><input type="checkbox" name="sources" value={o.value} className="h-4 w-4" />{o.label}</label>
            ))}</div>)}
          {e.sources && <p role="alert" className="mt-2 text-xs text-error">{e.sources}</p>}
        </fieldset>
      )}
      {coords && <Coords errors={e} initial={initial} />}
      {state.status === 'error' && <p role="alert" className="rounded-lg border border-error/30 bg-error/5 p-3 text-sm text-error">{state.message}</p>}
      <div className="flex gap-3">
        <button type="submit" disabled={pending} className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60">{pending ? 'Saving…' : submitLabel}</button>
        <Link href={cancelHref} className="rounded-lg border px-5 py-2.5 text-sm font-medium hover:bg-accent">Cancel</Link>
      </div>
    </form>
  );
}
