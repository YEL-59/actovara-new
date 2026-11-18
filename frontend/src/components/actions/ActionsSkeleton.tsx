import { LoadingRegion, Skeleton } from '@/components/ui';

export function ActionRowsSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <LoadingRegion className="overflow-hidden rounded-xl border border-line bg-surface shadow-card">
      <div className="border-b border-line bg-table-head px-6 py-3.5">
        <Skeleton className="h-5 w-full max-w-2xl" />
      </div>
      <div className="divide-y divide-line">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-4 px-6 py-4">
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-3.5 w-36" />
            </div>
            <Skeleton className="hidden h-6 w-20 rounded-full sm:block" />
            <Skeleton className="hidden h-4 w-24 md:block" />
            <Skeleton className="h-6 w-28 rounded-full" />
          </div>
        ))}
      </div>
    </LoadingRegion>
  );
}

export function ActionsSkeleton() {
  return (
    <LoadingRegion label="Loading actions…" className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-14 rounded-xl" />
      <ActionRowsSkeleton />
    </LoadingRegion>
  );
}

export function ActionDetailSkeleton() {
  return (
    <LoadingRegion label="Loading action…" className="space-y-6">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-28 rounded-xl" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-52 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
        <Skeleton className="h-72 rounded-xl" />
      </div>
    </LoadingRegion>
  );
}
