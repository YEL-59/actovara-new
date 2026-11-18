import React from 'react';
import { Card, Skeleton } from '@/components/ui';

export function AdminOrganisationsSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading organisations">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-2 h-8 w-16" />
          </Card>
        ))}
      </div>
      <Card>
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      </Card>
    </div>
  );
}
