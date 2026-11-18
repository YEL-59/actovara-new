'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  CircleDot,
  Hourglass,
  LayoutGrid,
  List,
  Search,
  SquareCheck,
  SquarePlus,
  TriangleAlert,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import {
  ActionBoard,
  ActionFormModal,
  ActionRowsSkeleton,
  ActionsSkeleton,
  ActionTable,
} from '@/components/actions';
import {
  Alert,
  Button,
  Checkbox,
  EmptyState,
  Input,
  KpiTile,
  Pagination,
  SegmentedControl,
  Select,
  type SelectOption,
} from '@/components/ui';
import { useApi } from '@/lib/hooks/useApi';
import { useSession } from '@/lib/session-mock';
import { cn } from '@/lib/utils';
import { actionsService, propertiesService, teamService, type ActionListQuery } from '@/services';
import type { ActionStatus, Priority } from '@/types/domain';

const PAGE_LIMIT = 20;
const VIEW_KEY = 'actovara.actions.view';

type ViewMode = 'list' | 'board';

const STATUS_OPTIONS: SelectOption[] = [
  { value: '', label: 'All Statuses' },
  { value: 'not_closed', label: 'All Open (excl. closed)' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'awaiting_verification', label: 'Awaiting verification' },
  { value: 'closed', label: 'Closed' },
];

const PRIORITY_OPTIONS: SelectOption[] = [
  { value: '', label: 'All Priorities' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const SORT_OPTIONS: { value: NonNullable<ActionListQuery['sort']>; label: string }[] = [
  { value: 'due', label: 'Due date (soonest)' },
  { value: 'priority', label: 'Priority (highest)' },
  { value: 'created', label: 'Recently created' },
];

const pick = (v: string | null, allowed: readonly { value: string }[]) =>
  v && allowed.some((o) => o.value === v) ? v : '';

function ActionsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { can } = useSession();
  const canCreate = can('action.write');

  const search = searchParams.get('search') ?? '';
  const status = pick(searchParams.get('status'), STATUS_OPTIONS) as ActionStatus | 'not_closed' | '';
  const priority = pick(searchParams.get('priority'), PRIORITY_OPTIONS) as Priority | '';
  const propertyId = searchParams.get('propertyId') ?? '';
  const ownerId = searchParams.get('ownerId') ?? '';
  const overdueOnly = searchParams.get('overdue') === '1';
  const sort = (pick(searchParams.get('sort'), SORT_OPTIONS) || 'due') as NonNullable<ActionListQuery['sort']>;
  const page = Math.max(1, Math.floor(Number(searchParams.get('page') ?? '1')) || 1);

  const [searchInput, setSearchInput] = useState(search);
  const [view, setView] = useState<ViewMode>('list');
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => setSearchInput(search), [search]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(VIEW_KEY);
      if (saved === 'board' || saved === 'list') setView(saved);
    } catch {
      /* ignore */
    }
  }, []);

  const changeView = (next: ViewMode) => {
    setView(next);
    try {
      window.localStorage.setItem(VIEW_KEY, next);
    } catch {
      /* ignore */
    }
  };

  const updateQuery = useCallback(
    (patch: Record<string, string | null>, resetPage = true) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v === null || v === '') params.delete(k);
        else params.set(k, v);
      }
      if (resetPage) params.delete('page');
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    if (searchInput === search) return;
    const t = window.setTimeout(() => updateQuery({ search: searchInput.trim() || null }), 220);
    return () => window.clearTimeout(t);
  }, [searchInput, search, updateQuery]);

  const properties = useApi(() => propertiesService.list({ status: 'active', sort: 'name', limit: 500 }), []);
  const owners = useApi(() => teamService.assignees(), []);
  const summary = useApi(() => actionsService.list({ propertyId: propertyId || undefined, limit: 500 }), [propertyId]);
  const list = useApi(
    () =>
      actionsService.list({
        search: search || undefined,
        status: status || undefined,
        priority: priority || undefined,
        propertyId: propertyId || undefined,
        ownerId: ownerId || undefined,
        overdue: overdueOnly ? true : undefined,
        sort,
        page: view === 'board' ? 1 : page,
        limit: view === 'board' ? 100 : PAGE_LIMIT,
      }),
    [search, status, priority, propertyId, ownerId, overdueOnly, sort, page, view],
  );

  const propertyOptions = useMemo<SelectOption[]>(
    () => [{ value: '', label: 'All Properties' }, ...(properties.data ?? []).map((p) => ({ value: p._id, label: p.name }))],
    [properties.data],
  );
  const ownerOptions = useMemo<SelectOption[]>(
    () => [{ value: '', label: 'All Owners' }, ...(owners.data ?? []).map((u) => ({ value: u._id, label: u.name }))],
    [owners.data],
  );

  const allRows = summary.data ?? [];
  const kpiOpen = allRows.filter((a) => a.status !== 'closed').length;
  const kpiOverdue = allRows.filter((a) => a.isOverdue).length;
  const kpiAwaiting = allRows.filter((a) => a.status === 'awaiting_verification').length;
  const kpiClosed = allRows.filter((a) => a.status === 'closed').length;

  const rows = list.data ?? [];
  const hasFilters = Boolean(search || status || priority || propertyId || ownerId || overdueOnly);

  const clearFilters = () => {
    setSearchInput('');
    updateQuery({ search: null, status: null, priority: null, propertyId: null, ownerId: null, overdue: null });
  };

  if (list.loading && !list.data && !hasFilters) {
    return <ActionsSkeleton />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Actions"
        description="Remedial actions from inspections and reports"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <SegmentedControl<ViewMode>
              label="View mode"
              value={view}
              onChange={changeView}
              items={[
                { value: 'list', label: 'List', icon: <List className="h-4 w-4" /> },
                { value: 'board', label: 'Board', icon: <LayoutGrid className="h-4 w-4" /> },
              ]}
            />
            {canCreate && (
              <Button leftIcon={<SquarePlus className="h-4 w-4" />} onClick={() => setCreateOpen(true)}>
                New action
              </Button>
            )}
          </div>
        }
      />

      {/* KPI tiles (clickable filters) */}
      <div className="stagger-children grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <button
          type="button"
          onClick={() => updateQuery({ status: status === 'not_closed' ? null : 'not_closed', overdue: null })}
          className={cn('focus-ring rounded-xl text-left', status === 'not_closed' && !overdueOnly && 'ring-2 ring-brand-600')}
        >
          <KpiTile label="Open actions" value={summary.loading && !summary.data ? '—' : kpiOpen} icon={<CircleDot />} tone="info" />
        </button>
        <button
          type="button"
          onClick={() => updateQuery({ overdue: overdueOnly ? null : '1', status: null })}
          className={cn('focus-ring rounded-xl text-left', overdueOnly && 'ring-2 ring-danger-600')}
        >
          <KpiTile label="Overdue" value={summary.loading && !summary.data ? '—' : kpiOverdue} icon={<TriangleAlert />} tone="danger" />
        </button>
        <button
          type="button"
          onClick={() => updateQuery({ status: status === 'awaiting_verification' ? null : 'awaiting_verification', overdue: null })}
          className={cn('focus-ring rounded-xl text-left', status === 'awaiting_verification' && 'ring-2 ring-warn-600')}
        >
          <KpiTile label="Awaiting verification" value={summary.loading && !summary.data ? '—' : kpiAwaiting} icon={<Hourglass />} tone="warn" />
        </button>
        <button
          type="button"
          onClick={() => updateQuery({ status: status === 'closed' ? null : 'closed', overdue: null })}
          className={cn('focus-ring rounded-xl text-left', status === 'closed' && 'ring-2 ring-ok-600')}
        >
          <KpiTile label="Closed" value={summary.loading && !summary.data ? '—' : kpiClosed} icon={<SquareCheck />} tone="ok" />
        </button>
      </div>

      {/* Filter bar */}
      <div className="rounded-xl border border-line bg-surface p-4 shadow-card">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <Input
              aria-label="Search actions"
              placeholder="Search ref, title, property or owner…"
              leftIcon={<Search className="h-4 w-4" />}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <Select
            aria-label="Filter by status"
            value={status}
            onChange={(e) => updateQuery({ status: e.target.value || null })}
            options={STATUS_OPTIONS}
          />
          <Select
            aria-label="Filter by priority"
            value={priority}
            onChange={(e) => updateQuery({ priority: e.target.value || null })}
            options={PRIORITY_OPTIONS}
          />
          <Select
            aria-label="Filter by property"
            value={propertyId}
            onChange={(e) => updateQuery({ propertyId: e.target.value || null })}
            options={propertyOptions}
          />
          <Select
            aria-label="Filter by owner"
            value={ownerId}
            onChange={(e) => updateQuery({ ownerId: e.target.value || null })}
            options={ownerOptions}
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
          <div className="flex flex-wrap items-center gap-4">
            <Checkbox
              label="Overdue only"
              checked={overdueOnly}
              onChange={(e) => updateQuery({ overdue: e.target.checked ? '1' : null })}
            />
            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="focus-ring rounded text-sm font-semibold text-brand-600 hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-meta text-ink-muted">Sort</span>
            <Select
              aria-label="Sort actions"
              value={sort}
              onChange={(e) => updateQuery({ sort: e.target.value })}
              options={SORT_OPTIONS}
              className="w-48"
            />
          </div>
        </div>
      </div>

      {/* Results */}
      {list.loading && !list.data ? (
        <ActionRowsSkeleton />
      ) : list.error ? (
        <Alert tone="error" title="Could not load actions" onRetry={list.reload}>
          {list.error}
        </Alert>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<CircleDot />}
          title={hasFilters ? 'No matching actions' : 'No actions yet'}
          description={
            hasFilters
              ? 'Try widening your filters or clearing the search.'
              : 'Create a remedial action to track inspection findings through to verified closure.'
          }
          action={
            hasFilters ? (
              <Button variant="secondary" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : canCreate ? (
              <Button leftIcon={<SquarePlus className="h-4 w-4" />} onClick={() => setCreateOpen(true)}>
                New action
              </Button>
            ) : undefined
          }
        />
      ) : view === 'board' ? (
        <ActionBoard rows={rows} />
      ) : (
        <>
          <ActionTable rows={rows} />
          {list.meta && list.meta.totalPage > 1 && (
            <Pagination
              page={list.meta.page}
              totalPages={list.meta.totalPage}
              total={list.meta.total}
              limit={list.meta.limit}
              onPageChange={(p) => updateQuery({ page: String(p) }, false)}
            />
          )}
        </>
      )}

      <ActionFormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          list.reload();
          summary.reload();
        }}
      />
    </div>
  );
}

export default function ActionsPage() {
  return (
    <Suspense fallback={<ActionsSkeleton />}>
      <ActionsContent />
    </Suspense>
  );
}
