'use client';

import { CalendarClock, Mail, Phone, UserRound } from 'lucide-react';
import { Card, CardHeader, EmptyState, StatusPill } from '@/components/ui';
import { formatDate, formatRelativeDue, daysUntil } from '@/lib/format';
import { requirementStatusMeta, toneClasses } from '@/lib/status';
import { cn } from '@/lib/utils';
import type { Property, RequirementStatus, RequirementView } from '@/types/domain';

const ORDER: RequirementStatus[] = ['overdue', 'missing', 'due_soon', 'valid', 'store_only', 'not_applicable'];

export function OverviewTab({
  property: p,
  requirements,
  onOpenStatus,
}: {
  property: Property;
  requirements: RequirementView[];
  /** Jump to the register filtered by status. */
  onOpenStatus: (status: RequirementStatus) => void;
}) {
  const counts = ORDER.map((s) => ({ status: s, count: requirements.filter((r) => r.status === s).length }));
  const upcoming = requirements
    .filter((r) => r.nextDueDate && (r.status === 'valid' || r.status === 'due_soon' || r.status === 'overdue'))
    .sort((a, b) => a.nextDueDate!.localeCompare(b.nextDueDate!))
    .slice(0, 5);

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <div className="space-y-5 lg:col-span-2">
        <Card>
          <CardHeader title="Requirement status" description={`${requirements.length} requirements in the register`} />
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {counts.map(({ status, count }) => {
              const meta = requirementStatusMeta[status];
              const t = toneClasses[meta.tone];
              const Icon = meta.icon;
              return (
                <li key={status}>
                  <button
                    type="button"
                    onClick={() => onOpenStatus(status)}
                    className={cn('focus-ring flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-shadow hover:shadow-md', t.tile)}
                  >
                    <Icon className={cn('h-6 w-6 shrink-0', t.icon)} aria-hidden />
                    <span className="min-w-0">
                      <span className="block text-2xl font-bold leading-none tabular-nums text-ink">{count}</span>
                      <span className="mt-1 block truncate text-sm font-medium text-ink-muted">{meta.label}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card>
          <CardHeader title="Next due" description="The five soonest expiry dates" />
          {upcoming.length === 0 ? (
            <EmptyState icon={<CalendarClock />} title="Nothing due" description="No dated certificates on this property yet." className="py-8" />
          ) : (
            <ul className="divide-y divide-line">
              {upcoming.map((r) => {
                const overdue = daysUntil(r.nextDueDate!) < 0;
                return (
                  <li key={r._id} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="font-semibold text-ink">{r.complianceType.name}</p>
                      <p className={cn('text-sm', overdue ? 'font-semibold text-danger-700' : 'text-ink-muted')}>
                        {formatDate(r.nextDueDate)} · {formatRelativeDue(r.nextDueDate)}
                      </p>
                    </div>
                    <StatusPill kind="requirement" value={r.status} />
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      <div className="space-y-5">
        <Card>
          <CardHeader title="Property details" />
          <dl className="space-y-2 text-[15px]">
            <Row label="Reference" value={p.reference} />
            <Row label="Units" value={p.units ?? '—'} />
            <Row label="Floors" value={p.floors ?? '—'} />
            <Row label="Open actions" value={p.counts?.openActions ?? 0} />
            <Row label="Current certificates" value={p.counts?.certificates ?? 0} />
            <Row label="Added" value={formatDate(p.createdAt)} />
          </dl>
        </Card>
        <Card>
          <CardHeader title="Contacts" />
          {p.contacts.length === 0 ? (
            <p className="text-sm text-ink-muted">No contacts recorded.</p>
          ) : (
            <ul className="space-y-4">
              {p.contacts.map((c, i) => (
                <li key={`${c.name}-${i}`} className="text-[15px]">
                  <p className="flex items-center gap-2 font-semibold text-ink">
                    <UserRound className="h-4 w-4 text-ink-muted" aria-hidden />
                    {c.name}
                    {c.role && <span className="font-normal text-ink-muted">· {c.role}</span>}
                  </p>
                  {c.email && (
                    <a href={`mailto:${c.email}`} className="focus-ring ml-6 mt-1 flex items-center gap-2 rounded text-sm text-brand-600 hover:underline">
                      <Mail className="h-3.5 w-3.5" aria-hidden />
                      {c.email}
                    </a>
                  )}
                  {c.phone && (
                    <a href={`tel:${c.phone.replace(/\s/g, '')}`} className="focus-ring ml-6 mt-1 flex items-center gap-2 rounded text-sm text-brand-600 hover:underline">
                      <Phone className="h-3.5 w-3.5" aria-hidden />
                      {c.phone}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="text-right font-semibold tabular-nums text-ink">{value}</dd>
    </div>
  );
}
