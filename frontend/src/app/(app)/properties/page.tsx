'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Building2, LayoutGrid, List, Plus, Search } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import {
  ArchivePropertyModal,
  PropertiesSkeleton,
  PropertyFormModal,
  PropertyGrid,
  PropertyTable,
} from '@/components/properties';
import {
  Alert,
  Button,
  Checkbox,
  EmptyState,
  Input,
  Pagination,
  SegmentedControl,
  Select,
  useToast,
  type SortDirection,
} from '@/components/ui';
import { useApi } from '@/lib/hooks/useApi';
import { useSession } from '@/lib/session-mock';
import {
  errorMessage,
  propertiesService,
  type PropertyListQuery,
  type PropertySort,
} from '@/services';
import type { Property, PropertyType, Rag } from '@/types/domain';

const VIEW_STORAGE_KEY = 'actovara.properties.view';
const PAGE_LIMIT = 12;

type ViewMode = 'list' | 'grid';
type ActionFilter = NonNullable<PropertyListQuery['actionStatus']>;

const TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'residential', label: 'Residential' },
  { value: 'hmo', label: 'HMO' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'mixed', label: 'Mixed use' },
];

const RAG_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'green', label: 'On track' },
  { value: 'amber', label: 'Needs attention' },
  { value: 'red', label: 'Action required' },
];

const ACTION_OPTIONS = [
  { value: '', label: 'Any' },
  { value: 'has_open', label: 'Has open actions' },
  { value: 'has_overdue', label: 'Has overdue actions' },
  { value: 'none', label: 'No open actions' },
];

const SORT_OPTIONS: { value: PropertySort; label: string }[] = [
  { value: 'address', label: 'Address (A–Z)' },
  { value: 'name', label: 'Name (A–Z)' },
  { value: 'next_due', label: 'Next due date' },
  { value: 'rag', label: 'Attention status' },
  { value: 'open_actions', label: 'Open actions' },
];

const pick = <T extends string>(v: string | null, allowed: readonly { value: string }[], fallback: T | '' = ''): T | '' =>
  v && allowed.some((o) => o.value === v) ? (v as T) : fallback;

function PropertiesContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const toast = useToast();
  const { can } = useSession();
  const canWrite = can('property.write');

  const search = searchParams.get('search') ?? '';
  const type = pick<PropertyType>(searchParams.get('type'), TYPE_OPTIONS);
  const rag = pick<Rag>(searchParams.get('rag'), RAG_OPTIONS);
  const actionStatus = pick<ActionFilter>(searchParams.get('actionStatus'), ACTION_OPTIONS);
  const showArchived = searchParams.get('archived') === '1';
  const sort = pick<PropertySort>(searchParams.get('sort'), SORT_OPTIONS, 'address') || 'address';
  const sortDir: 'asc' | 'desc' = searchParams.get('dir') === 'desc' ? 'desc' : 'asc';
  const page = Math.max(1, Math.floor(Number(searchParams.get('page') ?? '1')) || 1);

  const [searchInput, setSearchInput] = useState(search);
  const [view, setView] = useState<ViewMode>('list');

  const [formOpen, setFormOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [archivingProperty, setArchivingProperty] = useState<Property | null>(null);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(VIEW_STORAGE_KEY);
      if (saved === 'list' || saved === 'grid') setView(saved);
    } catch {
      // Ignore storage access errors in restricted environments.
    }
  }, []);

  const handleViewChange = (next: ViewMode) => {
    setView(next);
    try {
      window.localStorage.setItem(VIEW_STORAGE_KEY, next);
    } catch {
      // Ignore storage access errors.
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

  // Debounce search input -> URL query
  useEffect(() => {
    if (searchInput === search) return;
    const timer = window.setTimeout(() => {
      updateQuery({ search: searchInput.trim() || null });
    }, 220);
    return () => window.clearTimeout(timer);
  }, [searchInput, search, updateQuery]);

  const { data, meta, error, loading, reload } = useApi(
    () =>
      propertiesService.list({
        search: search || undefined,
        type: type || undefined,
        rag: rag || undefined,
        actionStatus: actionStatus || undefined,
        status: showArchived ? 'all' : 'active',
        sort,
        order: sortDir,
        page,
        limit: PAGE_LIMIT,
      }),
    [search, type, rag, actionStatus, showArchived, sort, sortDir, page],
  );

  const properties = data ?? [];

  const hasActiveFilters = Boolean(search || type || rag || actionStatus || showArchived);
  const openCreate = () => {
    setEditingProperty(null);
    setFormOpen(true);
  };
  const openEdit = (p: Property) => {
    setEditingProperty(p);
    setFormOpen(true);
  };
  const totalCount = meta?.total ?? properties.length;
  const totalPages = meta?.totalPage ?? 1;
  const currentPage = meta?.page ?? page;

  const clearFilters = () => {
    setSearchInput('');
    updateQuery({
      search: null,
      type: null,
      rag: null,
      actionStatus: null,
      archived: null,
      sort: null,
      dir: null,
    });
  };

  const handleSortProperty = () => {
    if (sort !== 'address') updateQuery({ sort: 'address', dir: null });
    else updateQuery({ dir: sortDir === 'asc' ? 'desc' : null });
  };

  const handleRestore = async (property: Property) => {
    try {
      await propertiesService.restore(property._id);
      toast.success('Property restored', `${property.name} is active again.`);
      reload();
    } catch (err) {
      toast.error('Could not restore property', errorMessage(err));
    }
  };

  const tableSortDirection: SortDirection = sort === 'address' ? sortDir : null;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Properties"
        actions={
          canWrite ? (
            <Button
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={openCreate}
            >
              Add Property
            </Button>
          ) : undefined
        }
      />

      {/* Filter bar (02-properties.png: plain row + divider, labels above selects) */}
      <div className="border-b border-line pb-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12 lg:items-end lg:gap-4">
          <div className="sm:col-span-2 lg:col-span-5">
            <Input
              label="Search properties"
              hideLabel
              leftIcon={<Search />}
              placeholder="Search properties (address, name or reference)"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <div className="lg:col-span-2">
            <Select
              label="Property Type"
              value={type}
              onChange={(e) => updateQuery({ type: e.target.value || null })}
              options={TYPE_OPTIONS}
            />
          </div>
          <div className="lg:col-span-2">
            <Select
              label="Compliance Status"
              value={rag}
              onChange={(e) => updateQuery({ rag: e.target.value || null })}
              options={RAG_OPTIONS}
            />
          </div>
          <div className="lg:col-span-2">
            <Select
              label="Action Status"
              value={actionStatus}
              onChange={(e) => updateQuery({ actionStatus: e.target.value || null })}
              options={ACTION_OPTIONS}
            />
          </div>
          <div className="flex items-center justify-end lg:col-span-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              disabled={!hasActiveFilters}
              className="text-brand-600 hover:text-brand-700"
            >
              Clear
            </Button>
          </div>
        </div>
      </div>

      {/* Toolbar: View toggle, archive toggle, count, sort */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4">
          <SegmentedControl<ViewMode>
            label="Property view mode"
            variant="soft"
            value={view}
            onChange={handleViewChange}
            items={[
              { value: 'list', label: 'List view', icon: <List className="h-4 w-4" aria-hidden /> },
              { value: 'grid', label: 'Grid view', icon: <LayoutGrid className="h-4 w-4" aria-hidden /> },
            ]}
          />
          <Checkbox
            label="Show archived"
            checked={showArchived}
            onChange={(e) => updateQuery({ archived: e.target.checked ? '1' : null })}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-ink-muted">
            Showing {totalCount} {totalCount === 1 ? 'property' : 'properties'}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-ink">Sort by</span>
            <Select
              label="Sort by"
              hideLabel
              value={sort}
              onChange={(e) => updateQuery({ sort: e.target.value, dir: null })}
              options={SORT_OPTIONS}
              selectClassName="h-10 min-w-[170px] bg-surface text-sm"
            />
          </div>
        </div>
      </div>

      {/* Content states */}
      {loading && !data ? (
        <PropertiesSkeleton />
      ) : error ? (
        <Alert tone="error" title="Could not load properties" onRetry={reload}>
          {error}
        </Alert>
      ) : properties.length === 0 ? (
        hasActiveFilters ? (
          <EmptyState
            icon={<Search className="h-6 w-6" />}
            title="No properties match your filters"
            description="Try adjusting your search query or clearing the active filters."
            action={
              <Button variant="secondary" onClick={clearFilters}>
                Clear filters
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={<Building2 className="h-6 w-6" />}
            title="No properties yet"
            description="Add your first property to start tracking compliance certificates and actions."
            action={
              canWrite ? (
                <Button
                  leftIcon={<Plus className="h-4 w-4" />}
                  onClick={openCreate}
                >
                  Add Property
                </Button>
              ) : undefined
            }
          />
        )
      ) : (
        <>
          {view === 'list' ? (
            <PropertyTable
              properties={properties}
              canWrite={canWrite}
              sortDirection={tableSortDirection}
              onSortProperty={handleSortProperty}
              onEdit={openEdit}
              onArchive={(p) => setArchivingProperty(p)}
              onRestore={handleRestore}
            />
          ) : (
            <PropertyGrid
              properties={properties}
              canWrite={canWrite}
              onEdit={openEdit}
              onArchive={(p) => setArchivingProperty(p)}
              onRestore={handleRestore}
            />
          )}

          {totalPages > 1 && (
            <Pagination
              page={currentPage}
              totalPages={totalPages}
              total={totalCount}
              limit={PAGE_LIMIT}
              onPageChange={(nextPage) => updateQuery({ page: String(nextPage) }, false)}
            />
          )}
        </>
      )}

      <PropertyFormModal
        open={formOpen}
        property={editingProperty}
        onClose={() => {
          setFormOpen(false);
          setEditingProperty(null);
        }}
        onSaved={() => reload()}
      />

      <ArchivePropertyModal
        property={archivingProperty}
        onClose={() => setArchivingProperty(null)}
        onArchived={() => reload()}
      />
    </div>
  );
}

export default function PropertiesPage() {
  return (
    <Suspense fallback={<PropertiesSkeleton />}>
      <PropertiesContent />
    </Suspense>
  );
}
