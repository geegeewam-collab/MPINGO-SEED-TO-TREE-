"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { navigation } from './nav';
import { MriBadge } from '@/components/brand/Logo';

interface SidebarProps { role: string; collapsed: boolean; open: boolean; onClose: () => void }

export function Sidebar({ role, collapsed, open, onClose }: SidebarProps) {
  const path = usePathname();
  const groups = navigation
    .map((g) => ({ ...g, items: g.items.filter((i) => !i.roles || i.roles.includes(role)) }))
    .filter((g) => g.items.length > 0);

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-primary-deep/40 backdrop-blur-sm lg:hidden" onClick={onClose} aria-hidden="true" />}
      <aside
        aria-label="Main navigation"
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-[264px] flex-col border-r bg-surface transition-transform duration-200 lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
          collapsed && 'lg:w-[72px]'
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b px-4">
          <Link href="/dashboard" className="flex items-center gap-3" onClick={onClose}>
            <MriBadge size={36} className="shrink-0" />
            <span className={cn('leading-tight', collapsed && 'lg:hidden')}>
              <span className="block text-sm font-semibold">Mpingo Restoration Initiative</span>
              <span className="block text-xs text-muted-foreground">Seed-to-Tree Network</span>
            </span>
          </Link>
          <button onClick={onClose} className="rounded-md p-2 text-muted-foreground hover:bg-accent lg:hidden" aria-label="Close menu">
            <X size={18} />
          </button>
        </div>
        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
          {groups.map((g) => (
            <div key={g.group}>
              <p className={cn('mb-1 px-3 text-xs font-medium text-muted-foreground', collapsed && 'lg:hidden')}>{g.group}</p>
              <ul className="space-y-0.5">
                {g.items.map((item) => {
                  const active = path === item.href || path.startsWith(item.href + '/');
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        title={item.title}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                          active ? 'bg-primary text-primary-foreground' : 'text-text-secondary hover:bg-accent hover:text-accent-foreground',
                          collapsed && 'lg:justify-center'
                        )}
                      >
                        <item.icon size={18} className="shrink-0" />
                        <span className={cn(collapsed && 'lg:hidden')}>{item.title}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
