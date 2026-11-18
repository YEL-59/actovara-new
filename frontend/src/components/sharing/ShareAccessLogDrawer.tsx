'use client';

import { Globe, History } from 'lucide-react';
import { Alert, Badge, Drawer, EmptyState, LoadingRegion, Skeleton } from '@/components/ui';
import { useApi } from '@/lib/hooks/useApi';
import { formatDateTime } from '@/lib/format';
import { sharingService } from '@/services';
import type { ShareLink } from '@/types/domain';
import { accessOutcomeMeta } from './shareState';

/** Who opened a landlord link, when, and whether they got in. */
export function ShareAccessLogDrawer({ link, onClose }: { link: ShareLink | null; onClose: () => void }) {
  const open = !!link;
  const { data, error, loading, reload } = useApi(() => (link ? sharingService.accesses(link._id) : Promise.resolve({ success: true, statusCode: 200, message: 'OK', data: [] })), [link?._id]);
  const rows = data ?? [];

  return (
    <Drawer open={open} onClose={onClose} title="Access log" description={link ? `Link ending …${link.tokenHint}` : undefined} width="max-w-lg">
      {loading && !data ? (
        <LoadingRegion label="Loading access log" className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </LoadingRegion>
      ) : error ? (
        <Alert tone="error" title="Could not load the access log" onRetry={reload}>
          {error}
        </Alert>
      ) : rows.length === 0 ? (
        <EmptyState icon={<History />} title="Not opened yet" description="Visits to this link will appear here, including blocked attempts." />
      ) : (
        <ol className="space-y-3" aria-label="Access attempts, newest first">
          {rows.map((a) => {
            const meta = accessOutcomeMeta[a.outcome];
            return (
              <li key={a._id} className="rounded-xl border border-line bg-surface p-3.5 shadow-card">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <time dateTime={a.accessedAt} className="text-sm font-semibold text-ink">
                    {formatDateTime(a.accessedAt)}
                  </time>
                  <Badge tone={meta.tone} dot>
                    {meta.label}
                  </Badge>
                </div>
                <p className="mt-1.5 flex items-center gap-1.5 text-meta text-ink-muted">
                  <Globe className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  <span className="truncate">
                    {a.userAgent} · IP {a.ip}
                  </span>
                </p>
              </li>
            );
          })}
        </ol>
      )}
    </Drawer>
  );
}
