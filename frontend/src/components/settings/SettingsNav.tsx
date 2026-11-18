'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BellRing, Building2, ClipboardList, History, Upload, Users } from 'lucide-react';
import { useSession } from '@/lib/session-mock';
import { cn } from '@/lib/utils';
import { ENABLE_CSV_IMPORT } from '@/services';

interface SettingsNavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  visible: boolean;
}

export function SettingsNav() {
  const pathname = usePathname();
  const { can } = useSession();

  const items: SettingsNavItem[] = [
    { href: '/settings', label: 'Organisation', icon: Building2, visible: true },
    { href: '/settings/team', label: 'Team', icon: Users, visible: can('team.manage') },
    { href: '/settings/compliance-types', label: 'Compliance Types', icon: ClipboardList, visible: true },
    { href: '/settings/notifications', label: 'Notifications', icon: BellRing, visible: true },
    { href: '/settings/imports', label: 'Imports', icon: Upload, visible: ENABLE_CSV_IMPORT && can('import.run') },
    { href: '/settings/audit-log', label: 'Audit Log', icon: History, visible: can('audit.view') },
  ];

  return (
    <nav aria-label="Settings sections" className="flex gap-1 overflow-x-auto border-b border-line">
      {items
        .filter((item) => item.visible)
        .map((item) => {
          const active = item.href === '/settings' ? pathname === '/settings' : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'focus-ring -mb-px inline-flex items-center gap-2 whitespace-nowrap rounded-t-lg border-b-2 px-4 py-2.5 text-[15px] font-semibold transition-colors',
                active
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-ink-muted hover:border-line hover:text-ink',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              {item.label}
            </Link>
          );
        })}
    </nav>
  );
}
