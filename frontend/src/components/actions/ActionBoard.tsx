'use client';

import Link from 'next/link';
import { TriangleAlert } from 'lucide-react';
import { Badge, StatusPill } from '@/components/ui';
import { formatDate } from '@/lib/format';
import { actionStatusMeta } from '@/lib/status';
import { cn } from '@/lib/utils';
import type { ActionStatus, ActionView } from '@/types/domain';

const COLUMNS: ActionStatus[] = ['open', 'in_progress', 'awaiting_verification', 'closed'];

export function ActionBoard({ rows }: { rows: ActionView[] }) {
  return (
    <div className="stagger-children grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {COLUMNS.map((status) => {
        const meta = actionStatusMeta[status];
        const items = rows.filter((a) => a.status === status);
        return (
          <section key={status} aria-label={meta.label} className="flex flex-col rounded-xl border border-line bg-canvas p-3">
            <header className="mb-3 flex items-center justify-between gap-2 px-1">
              <StatusPill kind="action" value={status} variant="dot" />
              <span className="rounded-full bg-surface px-2 py-0.5 text-meta font-semibold tabular-nums text-ink-muted shadow-sm">
                {items.length}
              </span>
            </header>
            {items.length === 0 ? (
              <p className="rounded-lg border border-dashed border-line bg-surface/60 px-3 py-6 text-center text-meta text-ink-muted">
                No {meta.label.toLowerCase()} actions
              </p>
            ) : (
              <ul className="space-y-2.5">
                {items.map((a) => (
                  <li key={a._id}>
                    <Link
                      href={`/actions/${a._id}`}
                      className="focus-ring block rounded-xl border border-line bg-surface p-3.5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card-hover"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-meta font-semibold text-ink-muted">{a.reference}</span>
                        <StatusPill kind="priority" value={a.priority} />
                      </div>
                      <p className="mt-1.5 line-clamp-2 text-sm font-semibold text-ink">{a.title}</p>
                      <p className="mt-1 truncate text-meta text-ink-muted">{a.propertyName}</p>
                      <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-2 text-meta">
                        <span className="truncate text-ink-muted">{a.ownerName}</span>
                        <span className={cn('inline-flex items-center gap-1 whitespace-nowrap font-medium', a.isOverdue ? 'text-danger-700' : 'text-ink-muted')}>
                          {a.isOverdue && <TriangleAlert className="h-3 w-3 shrink-0" aria-hidden />}
                          {a.isOverdue ? (
                            <Badge tone="danger">Overdue</Badge>
                          ) : (
                            formatDate(a.dueDate)
                          )}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
