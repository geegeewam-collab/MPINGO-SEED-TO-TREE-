"use client";
import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import { MriBadge } from '@/components/brand/Logo';
import { brand, whatsappLink } from '@/lib/brand';
import { copy, type Lang } from '@/lib/i18n';
import { setLang, useLang } from './useLang';
import { PrototypeNotice } from './PrototypeNotice';

const primary = 'inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90';
const outlined = 'inline-flex items-center justify-center rounded-lg border border-primary px-4 py-2 text-sm font-semibold text-primary hover:bg-accent';

function LangToggle({ lang }: { lang: Lang }) {
  // A full reload is the one reliable way to make the server-rendered page pick up the new language cookie.
  const pick = (next: Lang) => { if (next !== lang) { setLang(next); window.location.reload(); } };
  return (
    <div role="group" aria-label={copy[lang].nav.language} className="flex overflow-hidden rounded-lg border text-sm font-semibold">
      {(['en', 'sw'] as const).map((l) => (
        <button key={l} type="button" onClick={() => pick(l)} aria-pressed={lang === l} lang={l}
          className={`px-2.5 py-1.5 ${lang === l ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-accent'}`}>{l === 'en' ? 'EN' : 'SW'}</button>
      ))}
    </div>
  );
}

export function PublicHeader({ lang: initial }: { lang?: Lang }) {
  const lang = useLang(initial);
  const t = copy[lang].nav;
  const link = 'text-foreground hover:underline underline-offset-4';
  return (
    <header className="sticky top-0 z-30 border-b bg-background">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <MriBadge size={40} />
          <span className="min-w-0 font-serif text-base leading-tight sm:text-xl">{brand.name}</span>
        </Link>
        <nav aria-label={t.menu} className="flex items-center gap-5 text-sm font-medium">
          <Link href="/#journey" className={`hidden lg:inline ${link}`}>{t.how}</Link>
          <Link href="/resources" className={`hidden md:inline ${link}`}>{t.library}</Link>
          <Link href="/seed-requests/new" className={`hidden md:inline ${link}`}>{t.request}</Link>
          <LangToggle lang={lang} />
          <Link href="/join" className={`max-md:hidden ${primary}`}>{t.join}</Link>
          <Link href="/login" className={`max-md:hidden ${outlined}`}>{t.signIn}</Link>
        </nav>
      </div>
    </header>
  );
}

// Phone users: the three things people come to do, always in reach.
export function MobileBar({ lang: initial }: { lang?: Lang }) {
  const lang = useLang(initial);
  const t = copy[lang];
  const wa = whatsappLink();
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-surface md:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="mx-auto flex max-w-xl items-center gap-2 px-3 py-2.5">
        <Link href="/join" className={`${primary} flex-1`}>{t.nav.join}</Link>
        <Link href="/seed-requests/new" className={`${outlined} flex-1`}>{t.nav.request}</Link>
        <Link href="/login" className={`${outlined} flex-1`}>{t.nav.signIn}</Link>
        {wa && <a href={wa} target="_blank" rel="noopener noreferrer" aria-label={t.bar.whatsapp} className={`${outlined} px-3`}><MessageCircle size={18} /></a>}
      </div>
    </div>
  );
}

export function PublicFooter({ lang: initial }: { lang?: Lang }) {
  const lang = useLang(initial);
  const t = copy[lang];
  const wa = whatsappLink();
  return (
    <footer className="border-t bg-surface pb-20 md:pb-0">
      <div className="mx-auto grid max-w-6xl gap-6 px-5 py-10 text-sm md:grid-cols-[1fr_auto]">
        <div className="max-w-md">
          <p className="font-serif text-lg">{t.footer.rights}</p>
          <p className="mt-1 text-foreground">{t.tagline}</p>
          <p className="mt-3 text-muted-foreground">{t.footer.location} {t.footer.privacy}</p>
        </div>
        <div className="flex flex-col gap-2 md:items-end">
          {brand.email && <a href={`mailto:${brand.email}`} className="font-medium text-primary hover:underline">{brand.email}</a>}
          {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">{t.footer.whatsapp}</a>}
          <Link href="/verification" className="text-foreground hover:underline">{t.trust.link}</Link>
        </div>
      </div>
    </footer>
  );
}

export function PublicShell({ lang, mobileBar = true, children }: { lang?: Lang; mobileBar?: boolean; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <PrototypeNotice />
      <PublicHeader lang={lang} />
      {children}
      <PublicFooter lang={lang} />
      {mobileBar && <MobileBar lang={lang} />}
    </div>
  );
}
