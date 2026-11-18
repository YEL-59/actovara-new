'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ShieldAlert, X } from 'lucide-react';
import { Drawer, EmptyState, Skeleton } from '@/components/ui';
import { roleLabel } from '@/lib/permissions';
import { useSession } from '@/lib/session-mock';
import { cn } from '@/lib/utils';
import { DemoBanner } from './DemoBanner';
import { homeFor, rolesForPath } from './nav';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

/** Authenticated layout: sidebar (drawer / rail / full), top bar, demo banner and a role guard for routes. */
export function AppShell({ children }: { children: React.ReactNode }) {
  const { ready, user, signedOutByUser } = useSession();
  const router = useRouter();
  const pathname = usePathname() ?? '/dashboard';
  const [menuOpen, setMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem('actovara.sidebar.collapsed') === '1') {
        setCollapsed(true);
      }
    } catch {
      /* ignore storage errors */
    }
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('actovara.sidebar.collapsed', next ? '1' : '0');
      } catch {
        /* ignore storage errors */
      }
      return next;
    });
  };

  // Unauthenticated → /login, then back to the page they asked for.
  useEffect(() => {
    if (!ready || user) return;
    if (signedOutByUser) router.replace('/login?signedOut=1');
    else router.replace(`/login?next=${encodeURIComponent(`${pathname}${window.location.search}`)}`);
  }, [ready, user, signedOutByUser, pathname, router]);

  if (!ready || !user) return <ShellSkeleton />;

  return (
    <div className="flex min-h-screen">
      <a href="#main" className="focus-ring sr-only z-[60] rounded-lg bg-surface px-4 py-2 font-semibold text-brand-700 focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        Skip to main content
      </a>

      <aside
        className={cn(
          'sticky top-0 z-40 hidden h-screen shrink-0 transition-[width] duration-200 ease-out sm:block print:hidden',
          collapsed ? 'sm:w-rail' : 'sm:w-rail lg:w-sidebar',
        )}
      >
        <Sidebar collapsed={collapsed} onToggleCollapse={toggleCollapsed} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="print:hidden">
          <DemoBanner />
          <TopBar onOpenMenu={() => setMenuOpen(true)} />
        </div>
        <main id="main" tabIndex={-1} className="flex-1 px-4 py-6 outline-none sm:px-6 lg:px-8 lg:py-8 print:p-0">
          <div key={pathname} className="page-enter">
            <RouteGuard>{children}</RouteGuard>
          </div>
        </main>
      </div>

      <Drawer open={menuOpen} onClose={() => setMenuOpen(false)} title="Navigation" side="left" width="max-w-[280px]" bare>
        <div className="relative h-full">
          <Sidebar variant="drawer" onNavigate={() => setMenuOpen(false)} />
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            className="focus-ring absolute right-3 top-3 rounded-lg p-2 text-sidebar-muted hover:bg-sidebar-hover hover:text-white"
            aria-label="Close navigation menu"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </Drawer>
    </div>
  );
}

function RouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  const { role } = useSession();
  const allowed = rolesForPath(pathname);
  if (role && allowed && !allowed.includes(role)) {
    return (
      <EmptyState
        className="mx-auto mt-6 max-w-xl"
        icon={<ShieldAlert />}
        title={`Not available to the ${roleLabel[role]} role`}
        description="This area belongs to another role. Use the demo role switcher in the top bar, or go back to your home screen."
        action={
          <Link href={homeFor(role)} className="focus-ring inline-flex h-10 items-center rounded-lg bg-brand-600 px-4 font-semibold text-white hover:bg-brand-700">
            Go to my home screen
          </Link>
        }
      />
    );
  }
  return <>{children}</>;
}

function ShellSkeleton() {
  return (
    <div className="flex min-h-screen" aria-busy="true" aria-label="Loading">
      <div className="hidden h-screen shrink-0 bg-sidebar sm:block sm:w-rail lg:w-sidebar" />
      <div className="flex-1 p-6 lg:p-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-3 h-4 w-72" />
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      </div>
    </div>
  );
}
