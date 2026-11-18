'use client';

import Link from 'next/link';
import { ArrowRight, ClipboardList, Eye, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DashboardSummary } from '@/types/domain';

export interface KnowActProveBarProps {
  data: DashboardSummary;
  propertyId?: string;
}

export function KnowActProveBar({ data, propertyId }: KnowActProveBarProps) {
  const qs = propertyId ? `&propertyId=${encodeURIComponent(propertyId)}` : '';
  const propQs = propertyId ? `?propertyId=${encodeURIComponent(propertyId)}` : '';

  const overdueCerts = data.urgentRequirements.filter((r) => r.status === 'overdue').length;
  const missingCerts = data.urgentRequirements.filter((r) => r.status === 'missing').length;
  const dueSoonCerts = data.urgentRequirements.filter((r) => r.status === 'due_soon').length;

  const urgentOrOverdueActions = data.openActions.filter(
    (a) => a.isOverdue || a.priority === 'urgent',
  ).length;
  const awaitingVerification = data.openActions.filter(
    (a) => a.status === 'awaiting_verification',
  ).length;

  const knowParts = [
    overdueCerts > 0 ? `${overdueCerts} overdue` : null,
    missingCerts > 0 ? `${missingCerts} missing` : null,
    dueSoonCerts > 0 ? `${dueSoonCerts} due soon` : null,
  ].filter(Boolean);

  const pillars = [
    {
      step: 'KNOW',
      title: 'What needs attention',
      icon: Eye,
      accent: overdueCerts + missingCerts > 0 ? 'border-l-danger-600' : dueSoonCerts > 0 ? 'border-l-warn-600' : 'border-l-ok-600',
      badgeClass: overdueCerts + missingCerts > 0 ? 'bg-danger-100 text-danger-700' : 'bg-brand-50 text-brand-700',
      summary: knowParts.length > 0 ? knowParts.join(' · ') : 'All tracked certificates in date',
      detail: 'Missing certificates, upcoming expiries, and identified property risks.',
      href: `/certificates?status=overdue${qs}`,
      cta: 'Review certificates',
    },
    {
      step: 'ACT',
      title: 'What needs to be done',
      icon: ClipboardList,
      accent: urgentOrOverdueActions > 0 ? 'border-l-danger-600' : data.kpis.openActions > 0 ? 'border-l-warn-600' : 'border-l-ok-600',
      badgeClass: urgentOrOverdueActions > 0 ? 'bg-danger-100 text-danger-700' : 'bg-warn-100 text-warn-700',
      summary: `${data.kpis.openActions} open action${data.kpis.openActions === 1 ? '' : 's'}${urgentOrOverdueActions > 0 ? ` · ${urgentOrOverdueActions} urgent/overdue` : ''}`,
      detail: 'Corrective actions with priority, assigned owner, and target due dates.',
      href: `/actions?status=open${qs}`,
      cta: 'Manage actions',
    },
    {
      step: 'PROVE',
      title: 'Evidence & audit trail',
      icon: ShieldCheck,
      accent: awaitingVerification > 0 ? 'border-l-warn-600' : 'border-l-ok-600',
      badgeClass: 'bg-ok-100 text-ok-700',
      summary: `${awaitingVerification} awaiting verification · ${data.gauges.actionsClosed}% actions closed`,
      detail: 'Uploaded completion evidence, verification sign-off, and dated audit reports.',
      href: awaitingVerification > 0 ? `/actions?status=awaiting_verification${qs}` : `/reports${propQs}`,
      cta: awaitingVerification > 0 ? 'Verify evidence' : 'View reports',
    },
  ];

  return (
    <section aria-label="Know. Act. Prove. workflow" className="stagger-children grid grid-cols-1 gap-4 lg:grid-cols-3">
      {pillars.map((p) => {
        const Icon = p.icon;
        return (
          <Link
            key={p.step}
            href={p.href}
            className={cn(
              'focus-ring group flex flex-col justify-between rounded-xl border border-line border-l-4 bg-surface p-4 shadow-card transition-shadow hover:shadow-md',
              p.accent,
            )}
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold tracking-wider', p.badgeClass)}>
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                  {p.step}
                </span>
                <span className="text-xs font-medium text-ink-muted">{p.title}</span>
              </div>
              <p className="mt-2.5 text-[15px] font-bold text-ink">{p.summary}</p>
              <p className="mt-1 text-sm text-ink-muted">{p.detail}</p>
            </div>
            <div className="mt-3 flex items-center gap-1 text-sm font-semibold text-brand-600">
              <span>{p.cta}</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </div>
          </Link>
        );
      })}
    </section>
  );
}
