import { LoadingRegion, Skeleton } from '@/components/ui';

export function DashboardSkeleton() {
  return (
    <LoadingRegion label="Loading dashboard…" className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 sm:gap-5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center rounded-2xl border border-line bg-surface p-6 shadow-card">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="mt-4 h-32 w-56 rounded-t-full" />
            <Skeleton className="mt-4 h-7 w-28 rounded-full" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>

      <div className="rounded-xl border border-line bg-surface p-6 shadow-card">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-6 w-44" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-10 w-52 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    </LoadingRegion>
  );
}
