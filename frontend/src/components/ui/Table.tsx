import React from 'react';
import { ChevronDown, ChevronUp, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Scrollable table wrapper with card styling (horizontal scroll on tablet). */
export function Table({ className, children, label, ...props }: React.TableHTMLAttributes<HTMLTableElement> & { label?: string }) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-line bg-surface shadow-card">
      <table className={cn('w-full border-collapse text-left', className)} aria-label={label} {...props}>
        {children}
      </table>
    </div>
  );
}

export function THead({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn('bg-table-head', className)} {...props} />;
}

export function TBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn('divide-y divide-line', className)} {...props} />;
}

export function TR({ className, interactive, ...props }: React.HTMLAttributes<HTMLTableRowElement> & { interactive?: boolean }) {
  return <tr className={cn(interactive && 'transition-colors hover:bg-canvas', className)} {...props} />;
}

export type SortDirection = 'asc' | 'desc' | null;

export interface THProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  sortDirection?: SortDirection;
  /** Providing onSort makes the header a sort button. */
  onSort?: () => void;
}

export function TH({ className, children, sortDirection = null, onSort, ...props }: THProps) {
  const ariaSort = sortDirection === 'asc' ? 'ascending' : sortDirection === 'desc' ? 'descending' : onSort ? 'none' : undefined;
  const Icon = sortDirection === 'asc' ? ChevronUp : sortDirection === 'desc' ? ChevronDown : ChevronsUpDown;
  return (
    <th scope="col" aria-sort={ariaSort} className={cn('whitespace-nowrap px-4 py-3.5 text-[15px] font-semibold text-ink first:pl-6', className)} {...props}>
      {onSort ? (
        <button type="button" onClick={onSort} className="focus-ring -mx-1 inline-flex items-center gap-1.5 rounded px-1 hover:text-brand-600">
          {children}
          <Icon className={cn('h-4 w-4', sortDirection ? 'text-brand-600' : 'text-ink-muted')} aria-hidden />
        </button>
      ) : (
        children
      )}
    </th>
  );
}

export function TD({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn('px-4 py-3 align-middle text-[15px] text-ink first:pl-6', className)} {...props} />;
}

/* ------------------------------- Pagination ------------------------------- */
export interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
  className?: string;
}

function pageList(page: number, totalPages: number): (number | '…')[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const pages: (number | '…')[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);
  if (start > 2) pages.push('…');
  for (let p = start; p <= end; p++) pages.push(p);
  if (end < totalPages - 1) pages.push('…');
  pages.push(totalPages);
  return pages;
}

export function Pagination({ page, totalPages, total, limit, onPageChange, className }: PaginationProps) {
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(total, page * limit);
  const btn = 'focus-ring inline-flex h-9 min-w-[2.25rem] items-center justify-center rounded-lg px-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40';
  return (
    <nav aria-label="Pagination" className={cn('flex flex-wrap items-center justify-between gap-3', className)}>
      <p className="text-sm text-ink-muted">
        Showing <span className="font-semibold text-ink">{from}</span>–<span className="font-semibold text-ink">{to}</span> of{' '}
        <span className="font-semibold text-ink">{total}</span>
      </p>
      <div className="flex items-center gap-1">
        <button type="button" className={cn(btn, 'text-ink-muted hover:bg-table-head')} onClick={() => onPageChange(page - 1)} disabled={page <= 1} aria-label="Previous page">
          <ChevronLeft className="h-4 w-4" aria-hidden />
        </button>
        {pageList(page, totalPages).map((p, i) =>
          p === '…' ? (
            <span key={`gap-${i}`} className="px-1 text-ink-subtle" aria-hidden>
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              aria-current={p === page ? 'page' : undefined}
              className={cn(btn, p === page ? 'bg-brand-600 text-white' : 'text-ink hover:bg-table-head')}
            >
              {p}
            </button>
          ),
        )}
        <button type="button" className={cn(btn, 'text-ink-muted hover:bg-table-head')} onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} aria-label="Next page">
          <ChevronRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </nav>
  );
}
