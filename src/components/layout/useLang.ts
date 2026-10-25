"use client";
import { useSyncExternalStore } from 'react';
import type { Lang } from '@/lib/i18n';

const EVENT = 'mri-lang';
const subscribe = (cb: () => void) => { window.addEventListener(EVENT, cb); return () => window.removeEventListener(EVENT, cb); };
const read = (): Lang => (/(?:^|; )lang=sw(?:;|$)/.test(document.cookie) ? 'sw' : 'en');

// Pages that know the language on the server pass it in; client-only pages read the cookie.
export function useLang(initial?: Lang): Lang {
  const fromCookie = useSyncExternalStore(subscribe, read, () => 'en' as Lang);
  return initial ?? fromCookie;
}

export function setLang(next: Lang) {
  document.cookie = `lang=${next}; path=/; max-age=31536000; SameSite=Lax`;
  window.dispatchEvent(new Event(EVENT));
}
