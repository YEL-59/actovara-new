'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSession } from '@/lib/session-mock';
import { Logo } from './Logo';
import { isActive, navForRole } from './nav';

/**
 * Navy sidebar from the mock-ups.
 * - `variant="responsive"` (in the page layout): hidden <640px, 72px icon rail 640–1024px,
 *   262px (or 72px when collapsed) >1024px.
 * - `variant="drawer"`: always full width, used inside the mobile drawer.
 */
export function Sidebar({
  variant = 'responsive',
  collapsed = false,
  onToggleCollapse,
  onNavigate,
}: {
  variant?: 'responsive' | 'drawer';
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onNavigate?: () => void;
}) {
  const pathname = usePathname() ?? '';
  const { role } = useSession();
  const items = navForRole(role);
  const rail = variant === 'responsive';
  const isCollapsed = rail && collapsed;

  return (
    <div className="relative flex h-full flex-col bg-sidebar text-sidebar-text">
      <div
        className={cn(
          'px-6 pb-7 pt-6 transition-all duration-200',
          rail && (isCollapsed ? 'flex justify-center px-0' : 'sm:max-lg:flex sm:max-lg:justify-center sm:max-lg:px-0'),
        )}
      >
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="focus-ring block rounded-lg focus-visible:ring-offset-sidebar"
          aria-label="Actovara home"
        >
          {rail ? (
            isCollapsed ? (
              <Logo compact />
            ) : (
              <>
                <Logo className="hidden lg:inline-flex" />
                <Logo compact className="lg:hidden" />
              </>
            )
          ) : (
            <Logo />
          )}
        </Link>
      </div>

      {/* No overflow clipping on the rail, so the hover labels can show outside it. */}
      <nav aria-label="Main" className={cn('flex-1 pb-6', rail && !isCollapsed ? 'lg:overflow-y-auto' : !rail ? 'overflow-y-auto' : '')}>
        <ul className={cn('space-y-1.5 px-2.5', rail && (isCollapsed ? 'px-3' : 'sm:max-lg:px-3'))}>
          {items.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <li key={href} className="group/nav relative">
                <Link
                  href={href}
                  onClick={onNavigate}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'focus-ring flex h-14 items-center gap-4 rounded-lg px-5 text-[17px] font-medium transition-colors focus-visible:ring-offset-sidebar',
                    rail && (isCollapsed ? 'justify-center px-0' : 'sm:max-lg:justify-center sm:max-lg:px-0'),
                    active
                      ? 'bg-brand-600 text-white shadow-[0_6px_16px_-6px_rgb(29_88_176/0.7)]'
                      : 'text-white/90 hover:bg-sidebar-hover hover:text-white',
                  )}
                >
                  <Icon className="h-6 w-6 shrink-0" strokeWidth={1.75} aria-hidden />
                  <span className={cn(rail && (isCollapsed ? 'sr-only' : 'sm:max-lg:sr-only'))}>{label}</span>
                </Link>
                {rail && (
                  <span
                    role="presentation"
                    className={cn(
                      'pointer-events-none absolute left-full top-1/2 z-50 ml-3 hidden -translate-y-1/2 whitespace-nowrap rounded-lg bg-ink px-3 py-1.5 text-meta font-semibold text-white opacity-0 shadow-pop transition-opacity group-focus-within/nav:opacity-100 group-hover/nav:opacity-100',
                      isCollapsed ? 'block' : 'sm:max-lg:block',
                    )}
                  >
                    {label}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {rail && onToggleCollapse && (
        <div className="hidden border-t border-white/10 p-3 lg:block">
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={cn(
              'focus-ring flex h-10 w-full items-center gap-2.5 rounded-lg px-3 text-sm font-medium text-sidebar-muted transition-colors hover:bg-sidebar-hover hover:text-white focus-visible:ring-offset-sidebar',
              isCollapsed && 'justify-center px-0',
            )}
          >
            {isCollapsed ? (
              <ChevronRight className="h-5 w-5 shrink-0" aria-hidden />
            ) : (
              <>
                <ChevronLeft className="h-5 w-5 shrink-0" aria-hidden />
                <span>Collapse sidebar</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
