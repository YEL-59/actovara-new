import { Building, Building2, ChartNoAxesColumn, FileText, House, Settings, SquareCheck, type LucideIcon } from 'lucide-react';
import type { Role } from '@/types/domain';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: Role[];
}

const ORG: Role[] = ['org_admin', 'manager'];

/** Sidebar order follows the mock-ups (01-dashboard.png / 02-properties.png). */
export const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: House, roles: ORG },
  { href: '/properties', label: 'Properties', icon: Building2, roles: ORG },
  { href: '/certificates', label: 'Certificates', icon: FileText, roles: ORG },
  { href: '/actions', label: 'Actions', icon: SquareCheck, roles: ORG },
  { href: '/reports', label: 'Reports', icon: ChartNoAxesColumn, roles: ORG },
  { href: '/settings', label: 'Settings', icon: Settings, roles: ORG },
  { href: '/admin/organisations', label: 'Organisations', icon: Building, roles: ['platform_admin'] },
];

export function navForRole(role: Role | null | undefined): NavItem[] {
  return role ? NAV_ITEMS.filter((i) => i.roles.includes(role)) : [];
}

export function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Landing route after sign-in / role switch. */
export function homeFor(role: Role | null | undefined): string {
  return role === 'platform_admin' ? '/admin/organisations' : '/dashboard';
}

/** Which roles may open a route (UI guard only; the API enforces the same rules). */
export function rolesForPath(pathname: string): Role[] | null {
  const item = NAV_ITEMS.find((i) => isActive(pathname, i.href));
  return item ? item.roles : null;
}
