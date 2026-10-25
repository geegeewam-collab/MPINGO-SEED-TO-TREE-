import Link from 'next/link';
import { cookies } from 'next/headers';
import { ArrowRight, BookOpen, ClipboardCheck, EyeOff, Leaf, MapPin, ShieldCheck, Sprout, Truck, TreeDeciduous } from 'lucide-react';
import { MriLogo } from '@/components/brand/Logo';
import { PublicShell } from '@/components/layout/PublicChrome';
import { brand, whatsappLink } from '@/lib/brand';
import { copy, type Lang } from '@/lib/i18n';
import { createClient } from '@/lib/supabase/server';

export const instant = false;

const btn = 'inline-flex items-center justify-center rounded-lg px-5 py-3 text-sm font-semibold transition-colors';
const primary = `${btn} bg-primary text-primary-foreground hover:opacity-90`;
const outlined = `${btn} border border-primary text-primary hover:bg-accent`;

const STEP_ICONS = [Sprout, Leaf, Truck, MapPin, ClipboardCheck];
const TRUST_ICONS = [ShieldCheck, EyeOff];
const WHO_ICONS = [Sprout, Leaf, MapPin, TreeDeciduous];

async function load() {
  try {
    const sb = await createClient();
    const guides = await sb.from('resources').select('id', { count: 'exact', head: true }).eq('approval_status', 'approved');
    return { guides: guides.count ?? 0 };
  } catch {
    return { guides: 0 };
  }
}

export default async function Home() {
  const lang: Lang = (await cookies()).get('lang')?.value === 'sw' ? 'sw' : 'en';
  const t = copy[lang];
  const { guides } = await load();
  const talk = whatsappLink('Hello, I would like to talk about sponsoring a grove.') || (brand.email ? `mailto:${brand.email}` : '');

  return (
    <PublicShell lang={lang}>
      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-16 pt-10 md:grid-cols-[1.15fr_1fr] md:pt-16">
          <div>
            <p className="font-serif text-lg italic text-primary">{t.tagline}</p>
            <h1 className="mt-3 font-serif text-4xl leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">{t.hero.title}</h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">{t.hero.body}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/join" className={primary}>{t.hero.join}</Link>
              <Link href="/seed-requests/new" className={outlined}>{t.hero.request}</Link>
            </div>
          </div>
          <div className="mx-auto w-full max-w-md md:max-w-none">
            <MriLogo priority alt={t.hero.logoAlt} className="h-auto w-full" />
          </div>
        </section>

        <section aria-labelledby="who" className="mx-auto max-w-6xl px-5 pb-16">
          <h2 id="who" className="font-serif text-2xl sm:text-3xl">{t.who.title}</h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {t.who.items.map(([title, body, href], i) => {
              const Icon = WHO_ICONS[i];
              return (
                <li key={title}>
                  <Link href={href} className="group flex h-full flex-col rounded-2xl border bg-surface p-5 transition-colors hover:border-primary">
                    <Icon size={26} className="text-primary" aria-hidden="true" />
                    <span className="mt-4 text-lg font-semibold">{title}</span>
                    <span className="mt-1 flex-1 text-sm text-muted-foreground">{body}</span>
                    <ArrowRight size={18} className="mt-4 text-primary transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <section id="journey" aria-labelledby="journey-title" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-16">
          <h2 id="journey-title" className="font-serif text-2xl sm:text-3xl">{t.journey.title}</h2>
          <ol className="relative mt-10 grid gap-8 md:grid-cols-5">
            <span aria-hidden="true" className="absolute left-0 right-0 top-7 hidden h-px bg-border md:block" />
            {t.journey.steps.map(([title, body], i) => {
              const Icon = STEP_ICONS[i];
              return (
                <li key={title} className="relative">
                  <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground"><Icon size={24} aria-hidden="true" /></span>
                  <h3 className="mt-4 text-lg font-semibold"><span className="sr-only">{i + 1}. </span>{title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{body}</p>
                </li>
              );
            })}
          </ol>
          <p className="mt-8"><Link href="/resources" className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">{t.journey.read}<ArrowRight size={16} aria-hidden="true" /></Link></p>
        </section>

        <section aria-labelledby="trust" className="border-y bg-surface">
          <div className="mx-auto max-w-6xl px-5 py-16">
            <h2 id="trust" className="font-serif text-2xl sm:text-3xl">{t.trust.title}</h2>
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              {t.trust.items.map(([title, body], i) => {
                const Icon = TRUST_ICONS[i];
                return (
                  <div key={title} className="rounded-2xl border bg-background p-6">
                    <Icon size={24} className="text-primary" aria-hidden="true" />
                    <h3 className="mt-3 text-lg font-semibold">{title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{body}</p>
                  </div>
                );
              })}
            </div>
            <p className="mt-6"><Link href="/verification" className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">{t.trust.link}<ArrowRight size={16} aria-hidden="true" /></Link></p>
          </div>
        </section>

        <section aria-labelledby="library" className="mx-auto max-w-6xl px-5 py-16">
          <div className="flex flex-wrap items-center justify-between gap-5 rounded-2xl bg-primary-deep p-8 text-white">
            <div className="max-w-xl">
              <BookOpen size={26} aria-hidden="true" className="text-gold" />
              <h2 id="library" className="mt-3 font-serif text-2xl">{t.library.title}</h2>
              <p className="mt-1 text-sm text-white/80">{t.library.body}</p>
              <p className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold">
                <span className="rounded-full bg-white/15 px-2.5 py-1">EN</span>
                <span className="rounded-full bg-white/15 px-2.5 py-1">SW</span>
                {guides > 0 && <span className="text-white/80">{guides} {lang === 'sw' ? 'miongozo' : guides === 1 ? 'guide' : 'guides'}</span>}
              </p>
            </div>
            <Link href="/resources" className="rounded-lg bg-white px-5 py-3 text-sm font-semibold text-primary-deep hover:bg-white/90">{t.library.cta}</Link>
          </div>
        </section>

        <section id="about" aria-labelledby="about-title" className="border-y bg-surface scroll-mt-20">
          <div className="mx-auto grid max-w-6xl gap-8 px-5 py-16 md:grid-cols-[1fr_2fr]">
            <h2 id="about-title" className="font-serif text-2xl sm:text-3xl">{t.about.title}</h2>
            <p className="max-w-2xl text-lg leading-relaxed">{t.about.body}</p>
          </div>
        </section>

        <section id="sponsor" aria-labelledby="sponsor-title" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-16">
          <div className="grid gap-6 md:grid-cols-[2fr_1fr] md:items-center">
            <div>
              <h2 id="sponsor-title" className="font-serif text-2xl sm:text-3xl">{t.sponsor.title}</h2>
              <p className="mt-3 max-w-2xl text-lg text-muted-foreground">{t.sponsor.body}</p>
            </div>
            <div>
              {talk
                ? <a href={talk} target={talk.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className={primary}>{t.sponsor.cta}</a>
                : <Link href="/join" className={primary}>{t.sponsor.fallback}</Link>}
            </div>
          </div>
        </section>

        <section aria-labelledby="faq" className="mx-auto max-w-3xl px-5 pb-20">
          <h2 id="faq" className="font-serif text-2xl sm:text-3xl">{t.faq.title}</h2>
          <div className="mt-6 divide-y rounded-2xl border bg-surface">
            {t.faq.items.map(([q, a]) => (
              <details key={q} className="group px-5 py-4">
                <summary className="cursor-pointer list-none font-semibold marker:content-none">{q}</summary>
                <p className="mt-2 text-muted-foreground">{a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
    </PublicShell>
  );
}
