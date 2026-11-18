'use client';

import { LoadingRegion, Skeleton } from '@/components/ui';

export function ReportRowsSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <LoadingRegion className="overflow-hidden rounded-xl border border-line bg-surface shadow-card">
      <div className="border-b border-line bg-table-head px-6 py-3.5">
        <Skeleton className="h-5 w-full max-w-xl" />
      </div>
      <div className="divide-y divide-line">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-4 px-6 py-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-36" />
            </div>
            <Skeleton className="hidden h-4 w-28 sm:block" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </LoadingRegion>
  );
}

export function ReportsSkeleton() {
  return (
    <LoadingRegion className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-12 rounded-xl" />
      <ReportRowsSkeleton />
    </LoadingRegion>
  );
}

export function ReportPreviewSkeleton() {
  return (
    <LoadingRegion className="mx-auto max-w-[210mm] space-y-6">
      <Skeleton className="h-10 w-64" />
      <div className="space-y-6 rounded-xl border border-line bg-surface p-8 shadow-card">
        <div className="flex justify-between gap-4 border-b border-line pb-6">
          <div className="space-y-2">
            <Skeleton className="h-7 w-56" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-8 w-24 rounded-full" />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-48 rounded-lg" />
        <Skeleton className="h-40 rounded-lg" />
      </div>
    </LoadingRegion>
  );
}
