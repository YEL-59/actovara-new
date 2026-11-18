'use client';

import { LoadingRegion, Skeleton } from '@/components/ui';

export function CertificateRowsSkeleton() {
  return (
    <LoadingRegion label="Loading certificates…" className="overflow-hidden rounded-xl border border-line bg-surface shadow-card">
      <div className="border-b border-line bg-table-head px-6 py-3.5">
        <Skeleton className="h-5 w-full max-w-2xl" />
      </div>
      <div className="divide-y divide-line">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-4 px-6 py-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3.5 w-24" />
            </div>
            <Skeleton className="hidden h-4 w-36 sm:block" />
            <Skeleton className="hidden h-4 w-24 md:block" />
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
        ))}
      </div>
    </LoadingRegion>
  );
}

export function CertificatesSkeleton() {
  return (
    <LoadingRegion label="Loading certificates…" className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[88px] rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12">
        <Skeleton className="h-10 lg:col-span-4" />
        <Skeleton className="h-10 lg:col-span-3" />
        <Skeleton className="h-10 lg:col-span-3" />
        <Skeleton className="h-10 lg:col-span-2" />
      </div>
      <div className="h-[420px] rounded-xl border border-line bg-surface" />
    </LoadingRegion>
  );
}
