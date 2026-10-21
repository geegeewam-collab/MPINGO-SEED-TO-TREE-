import type { ElementType } from 'react';
import {
  LayoutDashboard, FileText, TreeDeciduous, Package, Factory, Truck, Map,
  Calendar, CheckCircle2, Users, UserCog, ClipboardList, Settings, BookOpen,
} from 'lucide-react';

export interface NavItem { title: string; href: string; icon: ElementType; adminOnly?: boolean }
export interface NavGroup { group: string; items: NavItem[] }

export const navigation: NavGroup[] = [
  { group: 'Workspace', items: [{ title: 'Overview', href: '/dashboard', icon: LayoutDashboard }] },
  { group: 'Network', items: [
    { title: 'Members', href: '/management/members', icon: Users },
    { title: 'Seed Requests', href: '/network/requests', icon: FileText },
  ] },
  { group: 'Provenance', items: [
    { title: 'Mother Trees', href: '/provenance/mother-trees', icon: TreeDeciduous },
    { title: 'Seed Lots', href: '/provenance/seed-lots', icon: Package },
  ] },
  { group: 'Nursery operations', items: [
    { title: 'Nurseries', href: '/production/nurseries', icon: Factory },
    { title: 'Nursery Batches', href: '/production/batches', icon: Package },
    { title: 'Distributions', href: '/production/distributions', icon: Truck },
  ] },
  { group: 'Field operations', items: [
    { title: 'Planting Sites', href: '/restoration/sites', icon: Map },
    { title: 'Planting Events', href: '/restoration/events', icon: Calendar },
    { title: 'Survival Checks', href: '/restoration/survival', icon: CheckCircle2 },
  ] },
  { group: 'Impact', items: [
    { title: 'Sponsor Groves', href: '/impact/groves', icon: TreeDeciduous },
    { title: 'Reports', href: '/reports', icon: FileText },
  ] },
  { group: 'Knowledge', items: [{ title: 'Resource Library', href: '/resources', icon: BookOpen }] },
  { group: 'Administration', items: [
    { title: 'Team and Access', href: '/management/team', icon: UserCog, adminOnly: true },
    { title: 'Audit Log', href: '/management/audit', icon: ClipboardList, adminOnly: true },
    { title: 'Settings', href: '/management/settings', icon: Settings },
  ] },
];

export function locate(path: string): { group: string; title: string } | null {
  for (const g of navigation) {
    for (const i of g.items) {
      if (path === i.href || path.startsWith(i.href + '/')) return { group: g.group, title: i.title };
    }
  }
  return null;
}
