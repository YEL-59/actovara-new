'use client';

import Link from 'next/link';
import { Building2, FileText, SquareCheck, TriangleAlert } from 'lucide-react';
import { KpiTile } from '@/components/ui';
import type { DashboardSummary } from '@/types/domain';

export interface KpiRowProps {
  kpis: DashboardSummary['kpis'];
  propertyId?: string;
}

export function KpiRow({ kpis, propertyId }: KpiRowProps) {
  const qs = propertyId ? `&propertyId=${encodeURIComponent(propertyId)}` : '';
  const propQs = propertyId ? `?propertyId=${encodeURIComponent(propertyId)}` : '';

  const items = [
    {
      label: 'Certificates (In Date)',
      value: kpis.certificatesInDate,
      icon: <FileText />,
      tone: 'ok' as const,
      trend: {
        value: Math.abs(kpis.trends.certificatesInDate),
        direction: (kpis.trends.certificatesInDate >= 0 ? 'up' : 'down') as 'up' | 'down',
        tone: 'ok' as const,
      },
      href: `/certificates?status=valid${qs}`,
    },
    {
      label: 'Overdue (Certs & Actions)',
      value: kpis.overdueItems,
      icon: <TriangleAlert />,
      tone: 'danger' as const,
      trend: {
        value: Math.abs(kpis.trends.overdueItems),
        direction: (kpis.trends.overdueItems >= 0 ? 'up' : 'down') as 'up' | 'down',
        tone: 'danger' as const,
      },
      href: `/certificates?status=overdue${qs}`,
    },
    {
      label: 'Open Actions',
      value: kpis.openActions,
      icon: <SquareCheck />,
      tone: 'warn' as const,
      trend: {
        value: Math.abs(kpis.trends.openActions),
        direction: (kpis.trends.openActions >= 0 ? 'up' : 'down') as 'up' | 'down',
        tone: 'warn' as const,
      },
      href: `/actions?status=open${qs}`,
    },
    {
      label: 'Total Properties',
      value: kpis.totalProperties,
      icon: <Building2 />,
      tone: 'neutral' as const,
      href: propertyId ? `/properties/${propertyId}` : `/properties${propQs}`,
    },
  ];

  return (
    <section aria-label="Key performance indicators" className="stagger-children grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className="focus-ring block rounded-xl transition-shadow hover:shadow-md"
        >
          <KpiTile
            label={item.label}
            value={item.value}
            icon={item.icon}
            tone={item.tone}
            trend={item.trend}
          />
        </Link>
      ))}
    </section>
  );
}
