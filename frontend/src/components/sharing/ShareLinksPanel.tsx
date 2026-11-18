'use client';

import { useMemo, useState } from 'react';
import { Ban, ExternalLink, History, Link2, Lock, Plus, Share2 } from 'lucide-react';
import { ShareWithLandlordModal } from '@/components/reports/ShareWithLandlordModal';
import { Alert, Badge, Button, EmptyState, LoadingRegion, SegmentedControl, Skeleton } from '@/components/ui';
import { useApi } from '@/lib/hooks/useApi';
import { formatDate, formatDateTime, formatRelativeDue } from '@/lib/format';
import { demoService, sharingService } from '@/services';
import type { ShareLink } from '@/types/domain';
import { RevokeShareLinkModal } from './RevokeShareLinkModal';
import { ShareAccessLogDrawer } from './ShareAccessLogDrawer';
import { shareLinkState, shareStateMeta, type ShareLinkState } from './shareState';

type Filter = 'all' | ShareLinkState;

interface Props {
  propertyId: string;
  propertyName: string;
  canManage: boolean;
  archived?: boolean;
}

function PanelSkeleton() {
  return (
    <LoadingRegion label="Loading share links" className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-4 rounded-xl border border-line bg-surface p-4 shadow-card">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-full max-w-md" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </LoadingRegion>
  );
}

/** Property detail → Sharing tab (P1, Q-007): create, list, revoke and audit landlord links. */
export function ShareLinksPanel({ propertyId, propertyName, canManage, archived }: Props) {
  const { data, error, loading, reload } = useApi(() => sharingService.list(propertyId), [propertyId]);
  const [filter, setFilter] = useState<Filter>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [revoking, setRevoking] = useState<ShareLink | null>(null);
  const [logFor, setLogFor] = useState<ShareLink | null>(null);

  const rows = useMemo(() => data ?? [], [data]);
  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: rows.length, active: 0, expired: 0, revoked: 0 };
    for (const l of rows) c[shareLinkState(l)] += 1;
    return c;
  }, [rows]);
  const visible = filter === 'all' ? rows : rows.filter((l) => shareLinkState(l) === filter);

  const canCreate = canManage && !archived;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-ink">Landlord share links</h2>
          <p className="mt-0.5 text-sm text-ink-muted">
            Read-only page showing certificate status and open actions. Landlords never see files, notes, owners or history.
          </p>
        </div>
        {canManage && (
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setCreateOpen(true)} disabled={!canCreate} className="shrink-0">
            Create share link
          </Button>
        )}
      </div>

      {!canManage && (
        <Alert tone="info" title="View only">
          Only organisation admins can create or revoke landlord links.
        </Alert>
      )}
      {canManage && archived && (
        <Alert tone="warning" title="Property archived">
          Restore this property to create new links. Existing links show a &ldquo;no longer shared&rdquo; page while it is archived.
        </Alert>
      )}

      {rows.length > 0 && (
        <SegmentedControl<Filter>
          label="Filter share links"
          variant="soft"
          value={filter}
          onChange={setFilter}
          items={(['all', 'active', 'expired', 'revoked'] as Filter[]).map((v) => ({
            value: v,
            label: `${v === 'all' ? 'All' : shareStateMeta[v].label} (${counts[v]})`,
          }))}
        />
      )}

      {loading && !data ? (
        <PanelSkeleton />
      ) : error ? (
        <Alert tone="error" title="Could not load share links" onRetry={reload}>
          {error}
        </Alert>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<Share2 />}
          title="No share links yet"
          description="Create a link to give a landlord a live, read-only view of this property's compliance."
          action={
            canCreate ? (
              <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setCreateOpen(true)}>
                Create share link
              </Button>
            ) : undefined
          }
        />
      ) : visible.length === 0 ? (
        <EmptyState icon={<Link2 />} title={`No ${shareStateMeta[filter as ShareLinkState].label.toLowerCase()} links`} description="Try another filter." />
      ) : (
        <ul className="space-y-3">
          {visible.map((l) => {
            const state = shareLinkState(l);
            const meta = shareStateMeta[state];
            const demoToken = demoService.shareToken(l._id);
            return (
              <li key={l._id} className="rounded-xl border border-line bg-surface p-4 shadow-card transition-colors hover:border-ink-subtle/40">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600" aria-hidden>
                      <Link2 className="h-[18px] w-[18px]" />
                    </span>
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2 font-semibold text-ink">
                        Link ending …{l.tokenHint}
                        <Badge tone={meta.tone} dot>
                          {meta.label}
                        </Badge>
                        {l.passwordProtected && (
                          <Badge tone="neutral" icon={<Lock className="h-3 w-3" aria-hidden />}>
                            Password
                          </Badge>
                        )}
                      </p>
                      <p className="mt-1 text-meta text-ink-muted">
                        Created {formatDate(l.createdAt)} by {l.createdBy.name} ·{' '}
                        {state === 'revoked'
                          ? `revoked ${formatDate(l.revokedAt)}${l.revokedBy ? ` by ${l.revokedBy.name}` : ''}`
                          : state === 'expired'
                            ? `expired ${formatDate(l.expiresAt)}`
                            : `expires ${formatDate(l.expiresAt)} (${formatRelativeDue(l.expiresAt)})`}
                      </p>
                      <p className="mt-0.5 text-meta text-ink-muted">
                        Opened {l.accessCount} {l.accessCount === 1 ? 'time' : 'times'}
                        {l.lastAccessedAt && ` · last ${formatDateTime(l.lastAccessedAt)}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 md:shrink-0 md:justify-end">
                    {demoToken && (
                      <a
                        href={`/share/${demoToken}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="focus-ring inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-brand-600 hover:bg-brand-50"
                      >
                        <ExternalLink className="h-4 w-4" aria-hidden />
                        Open demo page
                      </a>
                    )}
                    {canManage && (
                      <Button size="sm" variant="secondary" leftIcon={<History className="h-4 w-4" />} onClick={() => setLogFor(l)}>
                        Access log
                      </Button>
                    )}
                    {canManage && state === 'active' && (
                      <Button size="sm" variant="ghost" leftIcon={<Ban className="h-4 w-4" />} onClick={() => setRevoking(l)} className="text-danger-600 hover:text-danger-700">
                        Revoke
                      </Button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {demoService.sharePassword && rows.some((l) => demoService.shareToken(l._id) && l.passwordProtected) && (
        <p className="text-meta text-ink-muted">
          Demo: password-protected sample links use <code className="rounded bg-table-head px-1.5 py-0.5 font-mono">{demoService.sharePassword}</code>.
        </p>
      )}

      <ShareWithLandlordModal open={createOpen} onClose={() => setCreateOpen(false)} propertyId={propertyId} propertyName={propertyName} />
      <RevokeShareLinkModal link={revoking} onClose={() => setRevoking(null)} />
      <ShareAccessLogDrawer link={logFor} onClose={() => setLogFor(null)} />
    </div>
  );
}
