'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import { Avatar, Card, CardHeader, EmptyState, StatusPill } from '@/components/ui';
import { formatDate, formatRelativeDue } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Action, ActionView } from '@/types/domain';

export interface OpenActionsPanelProps {
  actions: Action[];
  propertyId?: string;
}

export function OpenActionsPanel({ actions, propertyId }: OpenActionsPanelProps) {
  const rows = actions.slice(0, 6) as ActionView[];
  const viewAllHref = propertyId ? `/actions?propertyId=${encodeURIComponent(propertyId)}` : '/actions';

  return (
    <Card className="flex flex-col">
      <CardHeader
        title="Open Actions"
        description="Remedial actions ordered by nearest due date"
        actions={
          <Link
            href={viewAllHref}
            className="focus-ring inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-brand-600 hover:bg-brand-50"
          >
            View all
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        }
      />

      {rows.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 />}
          title="No open actions"
          description="All remedial actions for this selection are closed."
          className="flex-1 py-8"
        />
      ) : (
        <ul className="divide-y divide-line rounded-xl border border-line bg-surface">
          {rows.map((action) => (
            <li key={action._id}>
              <Link
                href={`/actions?selected=${encodeURIComponent(action._id)}`}
                className="focus-ring flex flex-wrap items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-canvas"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-meta font-semibold text-ink-muted">{action.reference}</span>
                    <StatusPill kind="priority" value={action.priority} />
                    <StatusPill kind="action" value={action.status} />
                  </div>
                  <p className="mt-1 truncate text-[15px] font-semibold text-ink">{action.title}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-meta text-ink-muted">
                    {action.propertyName && <span>{action.propertyName}</span>}
                    {action.ownerName && (
                      <>
                        <span aria-hidden>·</span>
                        <span className="inline-flex items-center gap-1.5">
                          <Avatar name={action.ownerName} size="sm" className="h-5 w-5 text-[10px]" />
                          {action.ownerName}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 text-sm font-semibold tabular-nums',
                      action.isOverdue ? 'text-danger-700' : 'text-ink',
                    )}
                  >
                    <Clock className="h-3.5 w-3.5" aria-hidden />
                    {formatRelativeDue(action.dueDate)}
                  </span>
                  <p className="text-meta text-ink-muted">{formatDate(action.dueDate)}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
