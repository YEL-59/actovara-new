'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Building2, LayoutGrid, List, RotateCw } from 'lucide-react';
import {
  DashboardSkeleton,
  GaugeCard,
  KnowActProveBar,
  KpiRow,
  OpenActionsPanel,
  PropertyOverviewCard,
  PropertyOverviewList,
  UrgentRequirementsTable,
} from '@/components/dashboard';
import { PageHeader } from '@/components/layout/PageHeader';
import { Alert, Button, Card, CardHeader, EmptyState, IconButton, SegmentedControl, Select } from '@/components/ui';
import { formatDateTime } from '@/lib/format';
import { useApi } from '@/lib/hooks/useApi';
import { cn } from '@/lib/utils';
import { dashboardService, propertiesService } from '@/services';

const VIEW_STORAGE_KEY = 'actovara.dashboard.view';
type ViewMode = 'grid' | 'list';

export default function DashboardPage() {
  const [propertyId, setPropertyId] = useState<string>('');
  const [view, setView] = useState<ViewMode>('grid');

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(VIEW_STORAGE_KEY);
      if (saved === 'grid' || saved === 'list') setView(saved);
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

  const { data: propertyList } = useApi(() => propertiesService.list({ status: 'active', limit: 100 }), []);
  const { data, error, loading, reload } = useApi(
    () => dashboardService.get(propertyId || undefined),
    [propertyId],
  );

  const propertyOptions = [
    { value: '', label: 'All Properties' },
    ...(propertyList ?? []).map((p) => ({ value: p._id, label: p.name })),
  ];

  const headerActions = (
    <div className="flex flex-wrap items-center gap-3">
      <Select
        label="Filter by property"
        hideLabel
        value={propertyId}
        onChange={(e) => setPropertyId(e.target.value)}
        options={propertyOptions}
        className="w-full sm:w-auto sm:min-w-[210px]"
        selectClassName="h-10 bg-surface text-sm font-medium"
      />
      {data?.lastUpdated && (
        <span className="text-sm text-ink-muted">
          Last updated: <span className="font-medium text-ink">{formatDateTime(data.lastUpdated)}</span>
        </span>
      )}
      <IconButton
        label="Refresh dashboard"
        variant="secondary"
        onClick={reload}
        disabled={loading}
        className="h-10 w-10 bg-surface"
      >
        <RotateCw className={cn('h-4 w-4', loading && 'animate-spin')} aria-hidden />
      </IconButton>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Know what needs attention. Act on remedial work. Prove completion."
        actions={headerActions}
      />

      {loading && !data ? (
        <DashboardSkeleton />
      ) : error ? (
        <Alert tone="error" title="Could not load dashboard" onRetry={reload}>
          {error}
        </Alert>
      ) : !data || data.properties.length === 0 ? (
        <EmptyState
          icon={<Building2 />}
          title="No properties to display"
          description={
            propertyId
              ? 'The selected property could not be found or has been archived.'
              : 'Add your first property to start tracking compliance certificates and remedial actions.'
          }
          action={
            propertyId ? (
              <Button variant="secondary" onClick={() => setPropertyId('')}>
                Show all properties
              </Button>
            ) : (
              <Link href="/properties">
                <Button>Go to Properties</Button>
              </Link>
            )
          }
        />
      ) : (
        <>
          <section aria-label="Operational indicator gauges" className="stagger-children grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-3">
            <GaugeCard
              title="Overall Readiness"
              value={data.gauges.overall}
              formula="(Certificates In Date % + Actions Closed %) ÷ 2"
            />
            <GaugeCard
              title="Certificates (In Date)"
              value={data.gauges.certificatesInDate}
              formula="Applicable requirements that are Valid, Due soon, or Stored ÷ all applicable requirements"
            />
            <GaugeCard
              title="Actions (Closed)"
              value={data.gauges.actionsClosed}
              formula="Closed actions ÷ all actions"
            />
          </section>

          <KnowActProveBar data={data} propertyId={propertyId || undefined} />

          <KpiRow kpis={data.kpis} propertyId={propertyId || undefined} />

          <Card>
            <CardHeader
              title="Property Overview"
              description="Certificate status, overdue matters, and corrective action risk per property"
              actions={
                <SegmentedControl
                  label="Property overview layout"
                  variant="solid"
                  value={view}
                  onChange={handleViewChange}
                  items={[
                    { value: 'grid', label: 'Grid View', icon: <LayoutGrid aria-hidden /> },
                    { value: 'list', label: 'List View', icon: <List aria-hidden /> },
                  ]}
                />
              }
            />

            {view === 'grid' ? (
              <div className="stagger-children grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {data.properties.map((property) => (
                  <PropertyOverviewCard key={property._id} property={property} />
                ))}
              </div>
            ) : (
              <PropertyOverviewList properties={data.properties} />
            )}
          </Card>

          <section aria-label="Urgent items and open actions" className="stagger-children grid grid-cols-1 gap-5 xl:grid-cols-2">
            <UrgentRequirementsTable requirements={data.urgentRequirements} propertyId={propertyId || undefined} />
            <OpenActionsPanel actions={data.openActions} propertyId={propertyId || undefined} />
          </section>
        </>
      )}
    </div>
  );
}
