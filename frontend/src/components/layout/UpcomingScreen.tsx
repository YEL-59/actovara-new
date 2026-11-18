'use client';

import { Construction, Inbox } from 'lucide-react';
import { Alert, Card, EmptyState, KpiTile, Skeleton } from '@/components/ui';
import { useApi } from '@/lib/hooks/useApi';
import type { Tone } from '@/lib/status';
import type { ApiEnvelope } from '@/types/domain';
import { PageHeader } from './PageHeader';

export interface PreviewStat {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  tone?: Tone;
}

/**
 * Interim screen used by TASK-004 so every nav item opens a working route.
 * It already reads live mock data and shows all four data states (loading / empty / error / default).
 * Each screen's own task replaces it.
 */
export function UpcomingScreen<T>({
  title,
  description,
  task,
  scope,
  load,
  summarise,
  isEmpty,
}: {
  title: string;
  description: string;
  task: string;
  scope: string[];
  load: () => Promise<ApiEnvelope<T>>;
  summarise: (data: T) => PreviewStat[];
  isEmpty?: (data: T) => boolean;
}) {
  const { data, error, loading, reload } = useApi(load);

  return (
    <>
      <PageHeader title={title} description={description} />

      {error ? (
        <Alert tone="error"title="Could not load data" onRetry={reload}>
          {error}
        </Alert>
      ) : loading || data === undefined ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-busy="true" aria-label="Loading">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-[92px] rounded-xl" />
          ))}
        </div>
      ) : isEmpty?.(data) ? (
        <EmptyState icon={<Inbox />} title="Nothing here yet" description="No records match. Add the first one once this screen is built." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summarise(data).map((s) => (
            <KpiTile key={s.label} label={s.label} value={s.value} icon={s.icon} tone={s.tone ?? 'neutral'} />
          ))}
        </div>
      )}

      <Card className="mt-6">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
            <Construction className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-ink">Full screen coming in {task}</h2>
            <p className="mt-1 text-sm text-ink-muted">The figures above already come from the demo data. This screen will add:</p>
            <ul className="mt-3 grid gap-x-6 gap-y-1.5 text-sm text-ink sm:grid-cols-2">
              {scope.map((s) => (
                <li key={s} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" aria-hidden />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>
    </>
  );
}
