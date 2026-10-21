"use client";
import { useSyncExternalStore } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, Wifi, WifiOff, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { locate } from './nav';

function subscribe(cb: () => void) {
  window.addEventListener('online', cb);
  window.addEventListener('offline', cb);
  return () => { window.removeEventListener('online', cb); window.removeEventListener('offline', cb); };
}

interface HeaderProps { name: string; role: string; onMenu: () => void; onCollapse: () => void }

export function Header({ name, role, onMenu, onCollapse }: HeaderProps) {
  const online = useSyncExternalStore(subscribe, () => navigator.onLine, () => true);
  const here = locate(usePathname());

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button onClick={onMenu} className="rounded-md p-2 text-muted-foreground hover:bg-accent lg:hidden" aria-label="Open menu"><Menu size={20} /></button>
        <button onClick={onCollapse} className="hidden rounded-md p-2 text-muted-foreground hover:bg-accent lg:block" aria-label="Collapse or expand navigation"><Menu size={18} /></button>
        {here && (
          <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
            <span className="hidden sm:inline">{here.group}</span>
            <ChevronRight size={14} className="hidden sm:inline" />
            <span className="truncate font-medium text-foreground">{here.title}</span>
          </nav>
        )}
      </div>
      <div className="flex items-center gap-3">
        <span
          role="status"
          className={cn('flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium', online ? 'bg-success/10 text-success' : 'bg-warning/15 text-warning')}
        >
          {online ? <Wifi size={12} /> : <WifiOff size={12} />}
          {online ? 'Online' : 'Offline'}
        </span>
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium leading-none">{name}</p>
          <p className="mt-1 text-xs capitalize text-muted-foreground">{role.replace('_', ' ')}</p>
        </div>
        <form action="/auth/signout" method="post">
          <button type="submit" className="rounded-lg border px-3 py-1.5 text-sm font-medium hover:bg-accent">Sign out</button>
        </form>
      </div>
    </header>
  );
}
