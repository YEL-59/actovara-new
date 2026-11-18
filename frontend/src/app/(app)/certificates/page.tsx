'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Archive, Clock, FilePlus2, FileText, Search, TriangleAlert } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import {
  CertificateHistoryDrawer,
  CertificateRowsSkeleton,
  CertificatesSkeleton,
  CertificateTable,
  CertificateUploadModal,
  useViewFile,
} from '@/components/certificates';
import { Alert, Button, EmptyState, Input, KpiTile, Pagination, SegmentedControl, Select, Skeleton, type SelectOption } from '@/components/ui';
import { useApi } from '@/lib/hooks/useApi';
import { useSession } from '@/lib/session-mock';
import { cn } from '@/lib/utils';
import { certificatesService, complianceTypesService, propertiesService, type CertificateSort } from '@/services';
import type { CertificateView, RequirementStatus } from '@/types/domain';

const PAGE_LIMIT = 20;

type Scope = 'current' | 'all';

const STATUS_OPTIONS: SelectOption[] = [
  { value: '', label: 'All Statuses' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'due_soon', label: 'Due soon' },
  { value: 'valid', label: 'Valid' },
  { value: 'store_only', label: 'Stored (no expiry)' },
  { value: 'not_applicable', label: 'Not applicable' },
];

const SORT_OPTIONS: { value: CertificateSort; label: string }[] = [
  { value: 'urgent', label: 'Most urgent first' },
  { value: 'expiry', label: 'Expiry date (soonest)' },
  { value: 'uploaded', label: 'Recently uploaded' },
];

const pick = (v: string | null, allowed: readonly { value: string }[]) => (v && allowed.some((o) => o.value === v) ? v : '');

type UploadTarget = { propertyId?: string; requirementId?: string };

function CertificatesContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { can } = useSession();
  const canUpload = can('certificate.write');
  const { viewFile } = useViewFile();

  const search = searchParams.get('search') ?? '';
  const propertyId = searchParams.get('propertyId') ?? '';
  const typeId = searchParams.get('typeId') ?? '';
  const status = pick(searchParams.get('status'), STATUS_OPTIONS) as RequirementStatus | '';
  const scope: Scope = searchParams.get('scope') === 'all' ? 'all' : 'current';
  const sort = (pick(searchParams.get('sort'), SORT_OPTIONS) || 'urgent') as CertificateSort;
  const page = Math.max(1, Math.floor(Number(searchParams.get('page') ?? '1')) || 1);

  const [searchInput, setSearchInput] = useState(search);
  const [historyFor, setHistoryFor] = useState<CertificateView | null>(null);
  const [uploadFor, setUploadFor] = useState<UploadTarget | null>(null);

  useEffect(() => setSearchInput(search), [search]);

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
    const timer = window.setTimeout(() => updateQuery({ search: searchInput.trim() || null }), 220);
    return () => window.clearTimeout(timer);
  }, [searchInput, search, updateQuery]);

  // Filter option sources (properties include archived ones only when deep-linked from one).
  const properties = useApi(() => propertiesService.list({ status: 'all', sort: 'name', limit: 500 }), []);
  const types = useApi(() => complianceTypesService.list(), []);
  const summary = useApi(() => certificatesService.summary({ propertyId: propertyId || undefined }), [propertyId]);
  const list = useApi(
    () =>
      certificatesService.list({
        search: search || undefined,
        propertyId: propertyId || undefined,
        typeId: typeId || undefined,
        status: status || undefined,
        current: scope === 'current',
        sort,
        page,
        limit: PAGE_LIMIT,
      }),
    [search, propertyId, typeId, status, scope, sort, page],
  );

  const propertyOptions = useMemo<SelectOption[]>(
    () => [
      { value: '', label: 'All Properties' },
      ...(properties.data ?? [])
        .filter((p) => p.status === 'active' || p._id === propertyId)
        .map((p) => ({ value: p._id, label: p.status === 'archived' ? `${p.name} (archived)` : p.name })),
    ],
    [properties.data, propertyId],
  );
  const typeOptions = useMemo<SelectOption[]>(
    () => [{ value: '', label: 'All Compliance Types' }, ...(types.data ?? []).map((t) => ({ value: t._id, label: t.name }))],
    [types.data],
  );

  const rows = list.data ?? [];
  const total = list.meta?.total ?? rows.length;
  const totalPages = list.meta?.totalPage ?? 1;
  const hasFilters = Boolean(search || propertyId || typeId || status || scope === 'all');
  const firstLoad = list.loading && !list.data && summary.loading && !summary.data;

  const clearFilters = () => {
    setSearchInput('');
    updateQuery({ search: null, propertyId: null, typeId: null, status: null, scope: null, sort: null });
  };

  const tiles: { label: string; value: number | undefined; icon: React.ReactNode; tone: 'neutral' | 'danger' | 'warn' | 'info'; status: RequirementStatus | '' }[] = [
    { label: 'Current Certificates', value: summary.data?.current, icon: <FileText />, tone: 'neutral', status: '' },
    { label: 'Expired', value: summary.data?.overdue, icon: <TriangleAlert />, tone: 'danger', status: 'overdue' },
    { label: 'Due Soon', value: summary.data?.dueSoon, icon: <Clock />, tone: 'warn', status: 'due_soon' },
    { label: 'Stored Documents', value: summary.data?.stored, icon: <Archive />, tone: 'info', status: 'store_only' },
  ];

  if (firstLoad) return <CertificatesSkeleton />;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Certificates"
        description="Every certificate across your portfolio — most urgent first."
        actions={
          canUpload ? (
            <Button leftIcon={<FilePlus2 className="h-4 w-4" />} onClick={() => setUploadFor({ propertyId: propertyId || undefined })}>
              Upload certificate
            </Button>
          ) : undefined
        }
      />

      {/* KPI tiles double as quick status filters */}
      {summary.error ? (
        <Alert tone="error" title="Could not load the certificate summary" onRetry={summary.reload}>
          {summary.error}
        </Alert>
      ) : (
        <div className="stagger-children grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {tiles.map((t) => {
            const active = scope === 'current' && status === t.status && (t.status !== '' || !hasFilters);
            return (
              <button
                key={t.label}
                type="button"
                aria-pressed={active}
                onClick={() => updateQuery({ status: t.status || null, scope: null })}
                className={cn('focus-ring rounded-xl text-left transition-shadow hover:shadow-card', active && 'ring-2 ring-brand-600 ring-offset-2')}
              >
                {t.value === undefined ? (
                  <Skeleton className="h-[88px] rounded-xl" />
                ) : (
                  <KpiTile label={t.label} value={t.value} icon={t.icon} tone={t.tone} className="h-full" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Filter bar */}
      <div className="border-b border-line pb-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12 lg:items-end lg:gap-4">
          <div className="sm:col-span-2 lg:col-span-4">
            <Input
              label="Search certificates"
              hideLabel
              leftIcon={<Search />}
              placeholder="Search property, type, reference or file name"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <div className="lg:col-span-3">
            <Select label="Property" value={propertyId} onChange={(e) => updateQuery({ propertyId: e.target.value || null })} options={propertyOptions} />
          </div>
          <div className="lg:col-span-2">
            <Select label="Compliance Type" value={typeId} onChange={(e) => updateQuery({ typeId: e.target.value || null })} options={typeOptions} />
          </div>
          <div className="lg:col-span-2">
            <Select label="Status" value={status} onChange={(e) => updateQuery({ status: e.target.value || null })} options={STATUS_OPTIONS} />
          </div>
          <div className="flex items-center justify-end lg:col-span-1">
            <Button variant="ghost" size="sm" onClick={clearFilters} disabled={!hasFilters} className="text-brand-600 hover:text-brand-700">
              Clear
            </Button>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SegmentedControl<Scope>
          label="Which versions to show"
          variant="soft"
          value={scope}
          onChange={(v) => updateQuery({ scope: v === 'all' ? 'all' : null })}
          items={[
            { value: 'current', label: 'Current only' },
            { value: 'all', label: 'All versions' },
          ]}
        />
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-ink-muted" aria-live="polite">
            Showing {total} {total === 1 ? 'certificate' : 'certificates'}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-ink">Sort by</span>
            <Select
              label="Sort by"
              hideLabel
              value={sort}
              onChange={(e) => updateQuery({ sort: e.target.value === 'urgent' ? null : e.target.value })}
              options={SORT_OPTIONS}
              selectClassName="h-10 min-w-[190px] bg-surface text-sm"
            />
          </div>
        </div>
      </div>

      {list.loading && !list.data ? (
        <CertificateRowsSkeleton />
      ) : list.error ? (
        <Alert tone="error" title="Could not load certificates" onRetry={list.reload}>
          {list.error}
        </Alert>
      ) : rows.length === 0 ? (
        hasFilters ? (
          <EmptyState
            icon={<Search className="h-6 w-6" />}
            title="No certificates match your filters"
            description="Try a different property, compliance type or status, or clear the filters."
            action={
              <Button variant="secondary" onClick={clearFilters}>
                Clear filters
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={<FileText className="h-6 w-6" />}
            title="No certificates yet"
            description="Upload your first certificate to start tracking expiry dates and reminders."
            action={
              canUpload ? (
                <Button leftIcon={<FilePlus2 className="h-4 w-4" />} onClick={() => setUploadFor({})}>
                  Upload certificate
                </Button>
              ) : undefined
            }
          />
        )
      ) : (
        <>
          <CertificateTable
            certificates={rows}
            canUpload={canUpload}
            onHistory={setHistoryFor}
            onViewFile={(c) => viewFile(c._id)}
            onUploadNewVersion={(c) => setUploadFor({ propertyId: c.propertyId, requirementId: c.requirementId })}
          />
          {totalPages > 1 && (
            <Pagination
              page={list.meta?.page ?? page}
              totalPages={totalPages}
              total={total}
              limit={PAGE_LIMIT}
              onPageChange={(p) => updateQuery({ page: String(p) }, false)}
            />
          )}
        </>
      )}

      <CertificateHistoryDrawer
        certificate={historyFor}
        canUpload={canUpload}
        onClose={() => setHistoryFor(null)}
        onUploadNewVersion={(c) => {
          setHistoryFor(null);
          setUploadFor({ propertyId: c.propertyId, requirementId: c.requirementId });
        }}
      />

      <CertificateUploadModal
        open={!!uploadFor}
        propertyId={uploadFor?.propertyId}
        requirementId={uploadFor?.requirementId}
        onClose={() => setUploadFor(null)}
      />
    </div>
  );
}

export default function CertificatesPage() {
  return (
    <Suspense fallback={<CertificatesSkeleton />}>
      <CertificatesContent />
    </Suspense>
  );
}
