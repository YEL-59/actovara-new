'use client';

import { LoadingRegion, Skeleton } from '@/components/ui';

export function PropertyDetailSkeleton() {
  return (
    <LoadingRegion label="Loading property…" className="space-y-5">
      <Skeleton className="h-4 w-28" />
      <div className="flex flex-col gap-5 rounded-xl border border-line bg-surface p-4 shadow-card sm:flex-row sm:p-5">
        <Skeleton className="aspect-[16/10] w-full rounded-lg sm:w-48 lg:w-56" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-full max-w-md" />
          <Skeleton className="h-7 w-28 rounded-md" />
          <div className="flex gap-2 pt-1">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-8 w-32" />
          </div>
        </div>
      </div>
      <div className="flex gap-3 border-b border-line pb-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-24" />
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <Skeleton className="h-64 lg:col-span-2" />
        <Skeleton className="h-64" />
      </div>
    </LoadingRegion>
  );
}
