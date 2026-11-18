'use client';

import Link from 'next/link';
import { ChevronRight, FileText, MapPin, SquareCheck, TriangleAlert } from 'lucide-react';
import { StatusPill } from '@/components/ui';
import { propertyTypeMeta } from '@/lib/status';
import { cn } from '@/lib/utils';
import type { Property, Rag } from '@/types/domain';

const ragAccent: Record<Rag, string> = {
  green: 'border-l-ok-600',
  amber: 'border-l-warn-600',
  red: 'border-l-danger-600',
};

export function PropertyOverviewCard({ property }: { property: Property }) {
  const certs = property.counts?.certificates ?? 0;
  const overdue = property.counts?.overdue ?? 0;
  const openActions = property.counts?.openActions ?? 0;
  const typeLabel = propertyTypeMeta[property.type].label;

  return (
    <Link
      href={`/properties/${property._id}`}
      className={cn(
        'focus-ring group flex flex-col justify-between rounded-xl border border-line border-l-4 bg-surface p-4 shadow-card transition-shadow hover:shadow-md',
        ragAccent[property.ragStatus],
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={property.coverImageUrl || '/images/properties/wellington-court.svg'}
            alt=""
            className="h-14 w-16 shrink-0 rounded-lg border border-line bg-canvas object-cover"
          />
          <div className="min-w-0">
            <h3 className="truncate text-[16px] font-bold text-ink group-hover:text-brand-600">
              {property.name}
            </h3>
            <p className="truncate text-sm text-ink-muted">{typeLabel}</p>
            <p className="mt-0.5 flex items-center gap-1 truncate text-sm text-ink-muted">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-ink-subtle" aria-hidden />
              <span className="truncate">{property.address.city}</span>
            </p>
          </div>
        </div>
        <StatusPill kind="rag" value={property.ragStatus} variant="icon" className="shrink-0" />
      </div>

      <div className="mt-4 flex items-center justify-between gap-2 border-t border-line/70 pt-3 text-sm">
        <div className="flex items-center gap-1.5 text-ink">
          <FileText className="h-4 w-4 shrink-0 text-ink-muted" aria-hidden />
          <span className="font-bold tabular-nums">{certs}</span>
          <span className="text-ink-muted">Certificates</span>
        </div>

        <div className="flex items-center gap-1.5 text-ink">
          <TriangleAlert
            className={cn('h-4 w-4 shrink-0', overdue > 0 ? 'text-danger-600' : 'text-ink-muted')}
            aria-hidden
          />
          <span className={cn('font-bold tabular-nums', overdue > 0 && 'text-danger-700')}>{overdue}</span>
          <span className="text-ink-muted">Overdue</span>
        </div>

        <div className="flex items-center gap-1.5 text-ink">
          <SquareCheck className="h-4 w-4 shrink-0 text-ink-muted" aria-hidden />
          <span className="font-bold tabular-nums">{openActions}</span>
          <span className="text-ink-muted">{openActions === 1 ? 'Open Action' : 'Open Actions'}</span>
        </div>

        <ChevronRight className="h-4 w-4 shrink-0 text-ink-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-brand-600" aria-hidden />
      </div>
    </Link>
  );
}
