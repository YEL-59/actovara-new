'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Building2, CalendarClock, Download, Eye, FilePlus2, FileText, Search, Share2, Users } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { GenerateReportModal, ReportRowsSkeleton, ReportsSkeleton, ShareWithLandlordModal, useDownloadReport } from '@/components/reports';
import {
  Alert,
  Button,
  EmptyState,
  Input,
  KpiTile,
  Select,
  StatusPill,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from '@/components/ui';
import { formatDate, formatDateTime, formatFileSize } from '@/lib/format';
import { useApi } from '@/lib/hooks/useApi';
import { useSession } from '@/lib/session-mock';
import { propertiesService, reportsService } from '@/services';
import type { ReportView } from '@/types/domain';

export default function ReportsPage() {
  const { can } = useSession();
  const router = useRouter();
  const pathname = usePathname() ?? '/reports';
  const searchParams = useSearchParams();
  const canGenerate = can('report.generate');
  const { download, downloadingId } = useDownloadReport();

  const propertyId = searchParams.get('propertyId') ?? '';
  const search = searchParams.get('search') ?? '';
  const [searchDraft, setSearchDraft] = useState(search);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [shareTarget, setShareTarget] = useState<{ propertyId: string; propertyName: string } | null>(null);

  const setParam = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(searchParams.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const { data: propsData } = useApi(() => propertiesService.list({ limit: 200 }), []);
  const properties = useMemo(() => propsData ?? [], [propsData]);

  const { data, error, loading, reload } = useApi(
    () => reportsService.list({ propertyId: propertyId || undefined, search: search || undefined }),
    [propertyId, search],
  );
  const reports = useMemo(() => data ?? [], [data]);

  const isFiltered = Boolean(propertyId || search);
  const coveredCount = useMemo(() => new Set(reports.map((r) => r.propertyId)).size, [reports]);
  const authorsCount = useMemo(() => new Set(reports.map((r) => r.generatedBy._id)).size, [reports]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setParam('search', searchDraft.trim());
  }

  function clearFilters() {
    setSearchDraft('');
    router.replace(pathname, { scroll: false });
  }

  if (loading && !data) {
    return (
      <>
        <PageHeader title="Reports" description="Point-in-time PDF compliance reports generated for your properties" />
        <ReportsSkeleton />
      </>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Point-in-time PDF compliance reports generated for your properties"
        actions={
          canGenerate && (
            <Button leftIcon={<FilePlus2 className="h-4 w-4" />} onClick={() => setGenerateOpen(true)}>
              Generate report
            </Button>
          )
        }
      />

      {error && (
        <Alert tone="error" title="Could not load reports" onRetry={reload}>
          {error}
        </Alert>
      )}

      {/* KPI Summary Tiles */}
      <div className="stagger-children grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile label="Reports generated" value={reports.length} icon={<FileText />} tone="info" />
        <KpiTile label="Properties covered" value={coveredCount} icon={<Building2 />} tone="neutral" />
        <KpiTile label="Latest report" value={reports[0] ? formatDate(reports[0].generatedAt) : '—'} icon={<CalendarClock />} tone="neutral" />
        <KpiTile label="Report authors" value={authorsCount} icon={<Users />} tone="neutral" />
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4 shadow-card sm:flex-row sm:items-center">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" aria-hidden />
          <Input
            value={searchDraft}
            onChange={(e) => {
              setSearchDraft(e.target.value);
              if (!e.target.value) setParam('search', '');
            }}
            placeholder="Search by report reference, property or author…"
            aria-label="Search reports"
            className="pl-9"
          />
        </form>
        <div className="w-full sm:w-64">
          <Select
            aria-label="Filter by property"
            value={propertyId}
            onChange={(e) => setParam('propertyId', e.target.value)}
            options={[
              { value: '', label: 'All properties' },
              ...properties.map((p) => ({ value: p._id, label: `${p.name} (${p.reference})` })),
            ]}
          />
        </div>
        {isFiltered && (
          <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
            Clear filters
          </Button>
        )}
      </div>

      {/* Report List */}
      {loading ? (
        <ReportRowsSkeleton />
      ) : reports.length === 0 ? (
        <EmptyState
          icon={<FileText />}
          title={isFiltered ? 'No matching reports' : 'No reports generated yet'}
          description={
            isFiltered
              ? 'Try clearing your property or search filter to see all generated reports.'
              : 'Generate a compliance report to capture a point-in-time PDF snapshot for any property.'
          }
          action={
            isFiltered ? (
              <Button variant="secondary" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : canGenerate ? (
              <Button leftIcon={<FilePlus2 className="h-4 w-4" />} onClick={() => setGenerateOpen(true)}>
                Generate report
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          {/* Mobile Cards (<640px) */}
          <ul className="space-y-3 sm:hidden">
            {reports.map((r) => (
              <li key={r._id} className="rounded-xl border border-line bg-surface p-4 shadow-card">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link href={`/reports/${r._id}`} className="focus-ring break-all rounded font-semibold text-brand-700 hover:underline">
                      {r.reference}
                    </Link>
                    <p className="mt-0.5 text-sm font-medium text-ink">{r.propertyName}</p>
                  </div>
                  <StatusPill kind="rag" value={r.snapshot.rag} />
                </div>
                <p className="mt-2 text-xs text-ink-muted">
                  {formatDateTime(r.generatedAt)} · {r.generatedBy.name} · {formatFileSize(r.file.sizeBytes)}
                </p>
                <p className="mt-1 text-xs text-ink-muted">
                  {r.snapshot.overdue} overdue · {r.snapshot.dueSoon} due soon · {r.snapshot.missing} missing · {r.snapshot.openActions} open actions
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href={`/reports/${r._id}`}
                    className="focus-ring inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-xs font-semibold text-ink hover:bg-canvas"
                  >
                    <Eye className="h-3.5 w-3.5" aria-hidden />
                    Preview
                  </Link>
                  <Button
                    size="sm"
                    variant="secondary"
                    leftIcon={<Download className="h-3.5 w-3.5" />}
                    isLoading={downloadingId === r._id}
                    onClick={() => download(r._id, r.file.name)}
                  >
                    Download
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    leftIcon={<Share2 className="h-3.5 w-3.5" />}
                    onClick={() => setShareTarget({ propertyId: r.propertyId, propertyName: r.propertyName })}
                  >
                    Share
                  </Button>
                </div>
              </li>
            ))}
          </ul>

          {/* Desktop & Tablet Table (>=640px) */}
          <div className="hidden sm:block">
            <Table label="Generated compliance reports">
              <THead>
                <tr>
                  <TH>Reference</TH>
                  <TH>Property</TH>
                  <TH>Snapshot RAG</TH>
                  <TH>Generated</TH>
                  <TH>Size</TH>
                  <TH className="text-right">Actions</TH>
                </tr>
              </THead>
              <TBody>
                {reports.map((r: ReportView) => (
                  <TR key={r._id} interactive>
                    <TD>
                      <Link href={`/reports/${r._id}`} className="focus-ring rounded font-semibold text-brand-700 hover:underline">
                        {r.reference}
                      </Link>
                      <p className="text-meta text-ink-muted">
                        {r.snapshot.requirements} reqs · {r.snapshot.overdue} overdue · {r.snapshot.openActions} open actions
                      </p>
                    </TD>
                    <TD>
                      <Link href={`/properties/${r.propertyId}`} className="focus-ring rounded font-medium text-ink hover:text-brand-600">
                        {r.propertyName}
                      </Link>
                    </TD>
                    <TD>
                      <StatusPill kind="rag" value={r.snapshot.rag} />
                    </TD>
                    <TD className="whitespace-nowrap">
                      <p className="text-ink">{formatDateTime(r.generatedAt)}</p>
                      <p className="text-meta text-ink-muted">by {r.generatedBy.name}</p>
                    </TD>
                    <TD className="whitespace-nowrap tabular-nums text-ink-muted">{formatFileSize(r.file.sizeBytes)}</TD>
                    <TD className="text-right">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <Link
                          href={`/reports/${r._id}`}
                          className="focus-ring inline-flex h-8 items-center gap-1 rounded-lg border border-line bg-surface px-2.5 text-xs font-semibold text-ink hover:bg-canvas"
                        >
                          <Eye className="h-3.5 w-3.5" aria-hidden />
                          Preview
                        </Link>
                        <Button
                          size="sm"
                          variant="secondary"
                          leftIcon={<Download className="h-3.5 w-3.5" />}
                          isLoading={downloadingId === r._id}
                          onClick={() => download(r._id, r.file.name)}
                        >
                          Download
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          leftIcon={<Share2 className="h-3.5 w-3.5" />}
                          onClick={() => setShareTarget({ propertyId: r.propertyId, propertyName: r.propertyName })}
                          aria-label={`Share ${r.propertyName} with landlord`}
                        >
                          Share
                        </Button>
                      </div>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </div>
        </>
      )}

      <GenerateReportModal
        open={generateOpen}
        onClose={() => setGenerateOpen(false)}
        properties={properties}
        defaultPropertyId={propertyId || undefined}
        onGenerated={(report) => router.push(`/reports/${report._id}`)}
      />

      {shareTarget && (
        <ShareWithLandlordModal
          open
          onClose={() => setShareTarget(null)}
          propertyId={shareTarget.propertyId}
          propertyName={shareTarget.propertyName}
        />
      )}
    </div>
  );
}
