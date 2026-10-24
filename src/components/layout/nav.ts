import type { ElementType } from 'react';
import {
  LayoutDashboard, FileText, TreeDeciduous, Package, Factory, Truck, Map,
  Calendar, CheckCircle2, Users, UserCog, ClipboardList, Settings, BookOpen, Contact,
} from 'lucide-react';

// roles: who sees the link. Omitted means every signed-in person with a role. The database rules decide what they can actually open.
export interface NavItem { title: string; href: string; icon: ElementType; roles?: string[] }
export interface NavGroup { group: string; items: NavItem[] }

const STAFF = ['admin', 'coordinator'];
const FIELD = ['admin', 'coordinator', 'verifier'];

export const navigation: NavGroup[] = [
  { group: 'Workspace', items: [{ title: 'Overview', href: '/dashboard', icon: LayoutDashboard }] },
  { group: 'Network', items: [
    { title: 'Directory', href: '/network/directory', icon: Contact },
    { title: 'Resource Library', href: '/network/library', icon: BookOpen },
    { title: 'Seed Requests', href: '/network/requests', icon: FileText, roles: STAFF },
    { title: 'Members', href: '/management/members', icon: Users, roles: STAFF },
    { title: 'Manage Resources', href: '/management/resources', icon: BookOpen, roles: STAFF },
  ] },
  { group: 'Provenance', items: [
    { title: 'Mother Trees', href: '/provenance/mother-trees', icon: TreeDeciduous, roles: FIELD },
    { title: 'Seed Lots', href: '/provenance/seed-lots', icon: Package, roles: FIELD },
  ] },
  { group: 'Nursery operations', items: [
    { title: 'Nurseries', href: '/production/nurseries', icon: Factory, roles: [...FIELD, 'nursery_operator'] },
    { title: 'Nursery Batches', href: '/production/batches', icon: Package, roles: [...FIELD, 'nursery_operator'] },
    { title: 'Distributions', href: '/production/distributions', icon: Truck, roles: [...FIELD, 'nursery_operator', 'grower'] },
  ] },
  { group: 'Field operations', items: [
    { title: 'Site Map', href: '/restoration/map', icon: Map, roles: [...FIELD, 'grower'] },
    { title: 'Field Entry', href: '/field', icon: Calendar, roles: [...FIELD, 'grower'] },
    { title: 'Planting Sites', href: '/restoration/sites', icon: Map, roles: [...FIELD, 'grower'] },
    { title: 'Planting Events', href: '/restoration/events', icon: Calendar, roles: [...FIELD, 'grower'] },
    { title: 'Survival Checks', href: '/restoration/survival', icon: CheckCircle2, roles: FIELD },
  ] },
  { group: 'Impact', items: [
    { title: 'Sponsor Groves', href: '/impact/groves', icon: TreeDeciduous, roles: STAFF },
    { title: 'Reports', href: '/reports', icon: FileText, roles: FIELD },
  ] },
  { group: 'Administration', items: [
    { title: 'People and Access', href: '/admin', icon: UserCog, roles: ['admin'] },
    { title: 'Audit Log', href: '/admin/audit', icon: ClipboardList, roles: ['admin'] },
    { title: 'My Account', href: '/management/settings', icon: Settings },
  ] },
];

export function locate(path: string): { group: string; title: string } | null {
  let best: { group: string; title: string; len: number } | null = null;
  for (const g of navigation) for (const i of g.items) {
    if ((path === i.href || path.startsWith(i.href + '/')) && (!best || i.href.length > best.len)) best = { group: g.group, title: i.title, len: i.href.length };
  }
  return best ? { group: best.group, title: best.title } : null;
}
