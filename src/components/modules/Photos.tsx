"use client";
import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { addGrovePhoto, removeEvidencePhoto, removeGrovePhoto } from '@/app/actions/photos';

type Kind = 'planting_event' | 'survival_check' | 'grove';
const MAX_SIDE = 1600;

async function shrink(file: File): Promise<Blob> {
  if (typeof createImageBitmap !== 'function') { if (file.size <= 5 * 1024 * 1024) return file; throw new Error('too-large'); }
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bmp.width * scale); canvas.height = Math.round(bmp.height * scale);
  canvas.getContext('2d')?.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  return await new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('encode'))), 'image/jpeg', 0.82));
}

export function PhotoUploader({ kind, recordId }: { kind: Kind; recordId: string }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [msgs, setMsgs] = useState<{ ok: boolean; text: string }[]>([]);
  const [busy, setBusy] = useState(false);

  async function onPick(files: FileList | null) {
    if (!files || files.length === 0) return;
    if (!navigator.onLine) { setMsgs([{ ok: false, text: 'Photos can only be added while you are online. Save the record now and add photos when you have a connection.' }]); return; }
    setBusy(true); setMsgs([]);
    const supabase = createClient();
    const out: { ok: boolean; text: string }[] = [];
    for (const file of Array.from(files)) {
      try {
        if (!file.type.startsWith('image/')) throw new Error('type');
        const blob = await shrink(file);
        const name = `${crypto.randomUUID()}.jpg`;
        const bucket = kind === 'grove' ? 'grove-photos' : 'evidence';
        const path = kind === 'grove' ? `${recordId}/${name}` : `${kind}/${recordId}/${name}`;
        const up = await supabase.storage.from(bucket).upload(path, blob, { contentType: 'image/jpeg', upsert: false });
        if (up.error) throw new Error('upload');
        if (kind === 'grove') {
          const r = await addGrovePhoto(recordId, supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl);
          if (r.status !== 'success') { await supabase.storage.from(bucket).remove([path]); throw new Error(r.message ?? 'save'); }
        } else {
          const ins = await supabase.from('evidence_photos').insert({ entity_type: kind, entity_id: recordId, storage_path: path });
          if (ins.error) { await supabase.storage.from(bucket).remove([path]); throw new Error('save'); }
        }
        out.push({ ok: true, text: `${file.name}: saved` });
      } catch (e) {
        const why = e instanceof Error ? e.message : '';
        out.push({ ok: false, text: `${file.name}: not saved. ${why === 'type' ? 'Only photos can be added.' : why === 'too-large' ? 'The photo is too large.' : why === 'upload' ? 'The upload failed or is not allowed.' : why.length > 8 ? why : 'It could not be attached to this record.'}` });
      }
    }
    setMsgs(out); setBusy(false);
    if (input.current) input.current.value = '';
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" multiple hidden onChange={(e) => void onPick(e.target.files)} />
      <button type="button" disabled={busy} onClick={() => input.current?.click()} className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-60">{busy ? 'Uploading…' : 'Add photos'}</button>
      <ul aria-live="polite" className="space-y-1 text-xs">{msgs.map((m, i) => <li key={i} className={m.ok ? 'text-success' : 'text-error'}>{m.text}</li>)}</ul>
    </div>
  );
}

export function RemovePhoto({ kind, id, path, recordId }: { kind: 'evidence' | 'grove'; id?: string; path?: string; recordId?: string }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState('');
  return (
    <span>
      <button type="button" disabled={pending} onClick={() => { if (!window.confirm('Remove this photo?')) return; start(async () => { const r = kind === 'evidence' ? await removeEvidencePhoto(id ?? '', path ?? '') : await removeGrovePhoto(recordId ?? '', path ?? ''); if (r.status !== 'success') setMsg(r.message ?? ''); }); }}
        className="rounded-md border border-error/40 px-2 py-0.5 text-xs font-medium text-error hover:bg-error/5 disabled:opacity-60">Remove</button>
      {msg && <span role="alert" className="ml-2 text-xs text-error">{msg}</span>}
    </span>
  );
}
