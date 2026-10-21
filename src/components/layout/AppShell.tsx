"use client";
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function AppShell({ name, role, children }: { name: string; role: string; children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen bg-background">
      <Sidebar role={role} collapsed={collapsed} open={open} onClose={() => setOpen(false)} />
      <div className={cn('flex min-h-screen flex-col transition-[padding] duration-200', collapsed ? 'lg:pl-[72px]' : 'lg:pl-[264px]')}>
        <Header name={name} role={role} onMenu={() => setOpen(true)} onCollapse={() => setCollapsed((c) => !c)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
