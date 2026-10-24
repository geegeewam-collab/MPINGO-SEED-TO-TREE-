import Link from 'next/link';
import { Rings } from '@/components/brand/Rings';

const STAGES = [
  ['Seed', 'Mother trees are registered and every seed lot records which trees it came from.'],
  ['Nursery', 'Batches are sown, counted and tracked, so stock is never a guess.'],
  ['Distribution', 'Seedlings leave a nursery only through an approved, recorded transfer.'],
  ['Planting', 'Growers record where and when trees go in the ground.'],
  ['Survival', 'Field checks are reviewed by a second person before any result is published.'],
];

const btn = 'inline-flex items-center rounded-lg px-5 py-3 text-sm font-medium transition-colors';

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <span className="font-serif text-xl">Mpingo Seed-to-Tree Network</span>
        <nav aria-label="Main" className="flex items-center gap-5 text-sm">
          <Link href="/resources" className="hidden text-muted-foreground hover:text-foreground sm:inline">Resources</Link>
          <Link href="/join" className="hidden text-muted-foreground hover:text-foreground sm:inline">Join</Link>
          <Link href="/login" className="rounded-lg border px-4 py-2 font-medium hover:bg-accent">Sign in</Link>
        </nav>
      </header>

      <main>
        <section className="relative mx-auto max-w-6xl overflow-hidden px-5 pb-20 pt-12 sm:pt-20">
          <Rings className="pointer-events-none absolute -right-32 -top-24 h-[34rem] w-[34rem] text-primary/10" />
          <div className="relative max-w-2xl">
            <h1 className="font-serif text-5xl leading-[1.05] tracking-tight sm:text-6xl">Follow every Mpingo from seed to living tree.</h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">A shared record for the people restoring African blackwood in Kenya: where seed comes from, how nurseries grow it, where it is planted, and whether it survives.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/join" className={`${btn} bg-primary text-primary-foreground hover:opacity-90`}>Join the network</Link>
              <Link href="/seed-requests/new" className={`${btn} border hover:bg-accent`}>Request seed or seedlings</Link>
            </div>
          </div>
        </section>

        <section aria-labelledby="journey" className="border-y bg-surface">
          <div className="mx-auto max-w-6xl px-5 py-16">
            <h2 id="journey" className="font-serif text-3xl">One connected journey</h2>
            <ol className="mt-10 grid gap-8 md:grid-cols-5">
              {STAGES.map(([t, d], i) => (
                <li key={t} className="relative">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground" aria-hidden="true">{i + 1}</span>
                  <h3 className="mt-4 font-semibold">{t}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{d}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section aria-labelledby="trust" className="mx-auto max-w-6xl px-5 py-16">
          <h2 id="trust" className="font-serif text-3xl">Results you can check</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {[
              ['Verified, not claimed', 'A survival figure is published only after a second person has reviewed the field check.'],
              ['Honest about the unknown', 'Trees that could not be confirmed are never counted as alive or dead.'],
              ['Locations stay protected', 'Exact positions of mother trees and planting sites are private. Public pages show an approved summary only.'],
            ].map(([t, d]) => (
              <div key={t} className="rounded-2xl border bg-surface p-6"><h3 className="font-semibold">{t}</h3><p className="mt-2 text-sm text-muted-foreground">{d}</p></div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-20">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-primary-deep p-8 text-white">
            <div><h2 className="font-serif text-2xl">Learn how to collect, grow and plant Mpingo</h2><p className="mt-1 text-sm text-white/70">Guides published by the network team, in English and Kiswahili.</p></div>
            <Link href="/resources" className="rounded-lg bg-white px-5 py-3 text-sm font-medium text-primary-deep hover:bg-white/90">Open the library</Link>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-6 text-sm text-muted-foreground">
          <span>Mpingo Seed-to-Tree Network</span>
          <span className="flex gap-5"><Link href="/join" className="hover:text-foreground">Join</Link><Link href="/seed-requests/new" className="hover:text-foreground">Request seed</Link><Link href="/login" className="hover:text-foreground">Staff sign in</Link></span>
        </div>
      </footer>
    </div>
  );
}
