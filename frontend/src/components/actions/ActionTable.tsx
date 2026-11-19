'use client';

import Link from 'next/link';
import { ShieldCheck, TriangleAlert } from 'lucide-react';
import { Badge, StatusPill, Table, TBody, TD, TH, THead, TR } from '@/components/ui';
import { formatDate, formatRelativeDue } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { ActionView } from '@/types/domain';
import { ActionQuickActions } from './ActionQuickActions';

export interface ActionTableProps {
  rows: ActionView[];
  /** Called after a lifecycle step (verify, reopen, …) so the page can reload. */
  onChanged?: () => void;
}

/** "Verified by … · date" line for closed actions — the approver and date the client asked to see. */
export function VerifiedMeta({ action, className }: { action: ActionView; className?: string }) {
  if (action.status !== 'closed' || !action.closure) return null;
  return (
    <span className={cn('inline-flex items-center gap-1 text-meta text-ok-700', className)}>
      <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden />
      Verified by {action.verifiedByName ?? 'Org Admin'} · {formatDate(action.closure.verifiedAt)}
    </span>
  );
}

export function ActionTable({ rows, onChanged }: ActionTableProps) {
  return (
    <>
      {/* Mobile stacked cards (<640px) */}
      <ul className="space-y-3 sm:hidden">
        {rows.map((a) => (
          <li key={a._id} className="rounded-xl border border-line bg-surface p-4 shadow-card">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-meta font-semibold text-ink-muted">{a.reference}</p>
                <Link href={`/actions/${a._id}`} className="focus-ring mt-0.5 block rounded text-[15px] font-semibold text-ink hover:text-brand-600">
                  {a.title}
                </Link>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <StatusPill kind="action" value={a.status} />
                <ActionQuickActions action={a} onChanged={onChanged} showPrimaryVerify={false} />
              </div>
            </div>
            <p className="mt-1.5 text-sm text-ink-muted">{a.propertyName}</p>
            <VerifiedMeta action={a} className="mt-1" />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-2.5 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill kind="priority" value={a.priority} />
                {a.isOverdue && (
                  <Badge tone="danger" dot>
                    Overdue
                  </Badge>
                )}
              </div>
              <span className={cn('text-meta font-medium', a.isOverdue ? 'text-danger-700' : 'text-ink-muted')}>
                {formatDate(a.dueDate)}
              </span>
            </div>
          </li>
        ))}
      </ul>

      {/* Desktop / tablet table (>=640px) */}
      <div className="hidden sm:block">
        <Table label="Remedial actions">
          <THead>
            <tr>
              <TH>Action</TH>
              <TH>Property</TH>
              <TH>Priority</TH>
              <TH className="hidden md:table-cell">Owner</TH>
              <TH>Due date</TH>
              <TH>Status</TH>
              <TH className="w-12 text-right">
                <span className="sr-only">Row actions</span>
              </TH>
            </tr>
          </THead>
          <TBody>
            {rows.map((a) => (
              <TR key={a._id} interactive>
                <TD>
                  <Link href={`/actions/${a._id}`} className="focus-ring group block rounded">
                    <span className="text-meta font-semibold text-ink-muted">{a.reference}</span>
                    <span className="block font-semibold text-ink group-hover:text-brand-600">{a.title}</span>
                  </Link>
                  {a.source === 'report_finding' && a.sourceRef && (
                    <span className="mt-0.5 block text-meta text-ink-muted">Ref: {a.sourceRef}</span>
                  )}
                </TD>
                <TD>
                  <Link href={`/properties/${a.propertyId}`} className="focus-ring rounded text-sm text-ink hover:text-brand-600 hover:underline">
                    {a.propertyName}
                  </Link>
                </TD>
                <TD>
                  <StatusPill kind="priority" value={a.priority} />
                </TD>
                <TD className="hidden whitespace-nowrap text-ink-muted md:table-cell">{a.ownerName}</TD>
                <TD className="whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    {a.isOverdue && <TriangleAlert className="h-3.5 w-3.5 shrink-0 text-danger-600" aria-hidden />}
                    <span className={cn(a.isOverdue ? 'font-semibold text-danger-700' : 'text-ink')}>{formatDate(a.dueDate)}</span>
                  </div>
                  <span className={cn('block text-meta', a.isOverdue ? 'text-danger-700' : 'text-ink-muted')}>
                    {a.status === 'closed' ? 'Completed' : formatRelativeDue(a.dueDate)}
                  </span>
                </TD>
                <TD>
                  <StatusPill kind="action" value={a.status} variant="dot" />
                  <VerifiedMeta action={a} className="mt-1 flex whitespace-nowrap" />
                </TD>
                <TD className="text-right">
                  <ActionQuickActions action={a} onChanged={onChanged} />
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </div>
    </>
  );
}
