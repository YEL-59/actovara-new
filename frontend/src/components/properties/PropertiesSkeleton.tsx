'use client';

import { LoadingRegion, Skeleton } from '@/components/ui';

export function PropertiesSkeleton() {
  return (
    <LoadingRegion label="Loading properties…" className="space-y-4">
      <div className="grid grid-cols-1 gap-3 rounded-xl border border-line bg-surface p-4 sm:grid-cols-2 lg:grid-cols-12">
        <Skeleton className="h-10 lg:col-span-5" />
        <Skeleton className="h-10 lg:col-span-2" />
        <Skeleton className="h-10 lg:col-span-2" />
        <Skeleton className="h-10 lg:col-span-2" />
        <Skeleton className="h-10 lg:col-span-1" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Skeleton className="h-10 w-52" />
        <Skeleton className="h-10 w-64" />
      </div>

      <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-card">
        <div className="border-b border-line bg-table-head px-6 py-3.5">
          <Skeleton className="h-5 w-full max-w-2xl" />
        </div>
        <div className="divide-y divide-line">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between gap-4 px-6 py-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-11 w-16 rounded-md" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3.5 w-56" />
                </div>
              </div>
              <Skeleton className="hidden h-6 w-24 rounded-full sm:block" />
              <Skeleton className="hidden h-6 w-28 rounded-full md:block" />
              <Skeleton className="hidden h-8 w-36 lg:block" />
              <Skeleton className="h-7 w-10 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </LoadingRegion>
  );
}
