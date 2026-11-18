'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Building, ChevronDown, LogOut, Menu, Settings, ShieldCheck } from 'lucide-react';
import { Avatar, Badge, DropdownMenu, useToast, type MenuItem } from '@/components/ui';
import { roleLabel } from '@/lib/permissions';
import { useSession } from '@/lib/session-mock';
import { authService } from '@/services/auth.service';
import type { Role } from '@/types/domain';
import { Logo } from './Logo';
import { homeFor, rolesForPath } from './nav';

const ROLE_OPTIONS: Role[] = ['org_admin', 'manager', 'platform_admin'];

export function TopBar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { user, org, role, switchRole, signOut } = useSession();
  const router = useRouter();
  const pathname = usePathname() ?? '';
  const toast = useToast();
  if (!user || !role) return null;

  const onRoleChange = (next: Role) => {
    if (next === role) return;
    switchRole(next);
    const allowed = rolesForPath(pathname);
    if (allowed && !allowed.includes(next)) router.push(homeFor(next));
    toast.toast({ tone: 'info', title: `Viewing as ${roleLabel[next]}`, description: 'Demo role switch. Menus and permissions update to match.' });
  };

  const menu: MenuItem[] = [
    ...(role !== 'platform_admin' ? [{ label: 'Settings', icon: <Settings aria-hidden />, onSelect: () => router.push('/settings') }] : []),
    {
      label: 'Sign out',
      icon: <LogOut aria-hidden />,
      danger: true,
      onSelect: () => {
        // Best effort: the session ends locally even if the logout call fails.
        authService.logout().catch(() => undefined);
        signOut(); // AppShell then routes to /login?signedOut=1
      },
    },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onOpenMenu}
          className="focus-ring -ml-1 inline-flex h-10 w-10 items-center justify-center rounded-lg text-ink hover:bg-table-head sm:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-6 w-6" aria-hidden />
        </button>
        <Logo compact tone="dark" className="sm:hidden" />

        <p className="hidden min-w-0 items-center gap-2 text-sm font-semibold text-ink sm:flex">
          {org ? <Building className="h-4 w-4 shrink-0 text-ink-muted" aria-hidden /> : <ShieldCheck className="h-4 w-4 shrink-0 text-ink-muted" aria-hidden />}
          <span className="truncate">{org ? org.name : 'Actovara platform console'}</span>
        </p>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <label className="flex items-center gap-2">
            <span className="hidden text-meta font-medium text-ink-muted md:inline">Demo role</span>
            <span className="sr-only md:hidden">Demo role</span>
            <span className="relative">
              <select
                value={role}
                onChange={(e) => onRoleChange(e.target.value as Role)}
                className="focus-ring h-9 cursor-pointer appearance-none rounded-lg border border-line bg-surface pl-3 pr-8 text-sm font-semibold text-ink shadow-card hover:border-ink-subtle/60"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {roleLabel[r]}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" aria-hidden />
            </span>
          </label>

          <DropdownMenu
            label="Account menu"
            items={menu}
            trigger={
              <span className="flex items-center gap-2.5 rounded-lg py-1 pl-1 pr-2 hover:bg-table-head">
                <Avatar name={user.name} size="sm" />
                <span className="hidden min-w-0 text-left leading-tight lg:block">
                  <span className="block truncate text-sm font-semibold text-ink">{user.name}</span>
                  <span className="block truncate text-[12px] text-ink-muted">{user.email}</span>
                </span>
                <Badge tone={role === 'org_admin' ? 'info' : role === 'manager' ? 'neutral' : 'purple'} className="hidden sm:inline-flex">
                  {roleLabel[role]}
                </Badge>
                <span className="sr-only">Account menu for {user.name}</span>
                <ChevronDown className="h-4 w-4 text-ink-muted" aria-hidden />
              </span>
            }
          />
        </div>
      </div>
    </header>
  );
}
