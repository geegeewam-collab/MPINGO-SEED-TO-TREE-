"use client";
import React, { useState } from 'react';
import {
  LayoutDashboard,
  FileText,
  TreeDeciduous,
  Package,
  Factory,
  Truck,
  Map,
  Calendar,
  CheckCircle2,
  Users,
  UserCog,
  ClipboardList,
  Settings,
  BookOpen,
  Menu,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

const navigation: NavGroup[] = [
  {
    group: 'General',
    items: [
      { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { title: 'Reports', href: '/reports', icon: FileText },
    ],
  },
  {
    group: 'Provenance',
    items: [
      { title: 'Mother Trees', href: '/provenance/mother-trees', icon: TreeDeciduous },
      { title: 'Seed Lots', href: '/provenance/seed-lots', icon: Package },
    ],
  },
  {
    group: 'Production',
    items: [
      { title: 'Nurseries', href: '/production/nurseries', icon: Factory },
      { title: 'Nursery Batches', href: '/production/batches', icon: Package },
      { title: 'Distributions', href: '/production/distributions', icon: Truck },
    ],
  },
  {
    group: 'Restoration',
    items: [
      { title: 'Planting Sites', href: '/restoration/sites', icon: Map },
      { title: 'Planting Events', href: '/restoration/events', icon: Calendar },
      { title: 'Survival Checks', href: '/restoration/survival', icon: CheckCircle2 },
    ],
  },
  {
    group: 'Management',
    items: [
      { title: 'Network Members', href: '/management/members', icon: Users },
      { title: 'Team', href: '/management/team', icon: UserCog },
      { title: 'Audit Log', href: '/management/audit', icon: ClipboardList },
      { title: 'Settings', href: '/management/settings', icon: Settings },
    ],
  },
  {
    group: 'Other',
    items: [
      { title: 'Resources', href: '/resources', icon: BookOpen },
    ],
  },
];

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 p-2 bg-primary text-primary-foreground rounded-md lg:hidden"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-background border-r transition-transform duration-300 ease-in-out lg:translate-x-0",
          !isOpen && "-translate-x-full lg:w-20"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 font-bold text-xl border-b flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-full shrink-0" />
            {isOpen && <span>Mpingo</span>}
          </div>

          <nav className="flex-1 overflow-y-auto p-4 space-y-8">
            {navigation.map((group) => (
              <div key={group.group} className="space-y-2">
                {isOpen && (
                  <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {group.group}
                  </h3>
                )}
                <div className="space-y-1">
                  {group.items.map((item) => (
                    <a
                      key={item.title}
                      href={item.href}
                      className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors hover:bg-accent hover:text-accent-foreground group"
                    >
                      <item.icon size={20} className="shrink-0 text-muted-foreground group-hover:text-foreground" />
                      {isOpen && <span>{item.title}</span>}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
}
