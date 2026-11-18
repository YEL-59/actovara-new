'use client';

/**
 * Property-scoped lists on the detail page: certificates, actions, reports and sharing.
 * The full portfolio screens arrive in TASK-009 (certificates), TASK-010 (actions),
 * TASK-011 (reports) and TASK-013 (sharing); these tabs reuse the same services.
 */
import Link from 'next/link';
import { useState } from 'react';
import { Calculator, FilePlus2, FileText, SquareCheck, SquarePlus } from 'lucide-react';
import {
  Alert,
  Button,
  EmptyState,
  LoadingRegion,
  SegmentedControl,
  Skeleton,
  StatusPill,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from '@/components/ui';
import { useApi } from '@/lib/hooks/useApi';
import { formatDate, formatDateTime, formatFileSize, formatRelativeDue } from '@/lib/format';
import { cn } from '@/lib/utils';
import { actionsService, certificatesService, reportsService } from '@/services';

function TableSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <LoadingRegion className="overflow-hidden rounded-xl border border-line bg-surface shadow-card">
      <div className="border-b border-line bg-table-head px-6 py-3.5">
        <Skeleton className="h-5 w-full max-w-xl" />
      </div>
      <div className="divide-y divide-line">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-4 px-6 py-4">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="hidden h-4 w-28 sm:block" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
        ))}
      </div>
    </LoadingRegion>
  );
}

/** Stacked card list used below 640px instead of a table. */
function MobileList({ children }: { children: React.ReactNode }) {
  return <ul className="space-y-3 sm:hidden">{children}</ul>;
}

/* ------------------------------ Certificates ------------------------------ */
export function CertificatesTab({ propertyId, canUpload, onUpload }: { propertyId: string; canUpload: boolean; onUpload: () => void }) {
  const { data, error, loading, reload } = useApi(() => certificatesService.list({ propertyId, limit: 200 }), [propertyId]);
  if (loading && !data) return <TableSkeleton />;
  if (error) return <Alert tone="error" title="Could not load certificates" onRetry={reload}>{error}</Alert>;
  const rows = data ?? [];
  if (rows.length === 0)
    return (
      <EmptyState
        icon={<FileText />}
        title="No certificates yet"
        description="Upload the first certificate for this property to start tracking expiry dates."
        action={canUpload ? <Button leftIcon={<FilePlus2 className="h-4 w-4" />} onClick={onUpload}>Upload certificate</Button> : undefined}
      />
    );
  return (
    <div className="space-y-3">
      <MobileList>
        {rows.map((c) => (
          <li key={c._id} className="rounded-xl border border-line bg-surface p-4 shadow-card">
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold text-ink">{c.complianceTypeName}</p>
              {c.requirementStatus && <StatusPill kind="requirement" value={c.requirementStatus} />}
            </div>
            <p className="mt-1 break-all text-sm text-ink-muted">
              {c.file.name} · v{c.version}
            </p>
            <p className="mt-1 text-sm text-ink">Expires {formatDate(c.expiryDate)}{c.expiryCalculated && ' (calculated)'}</p>
          </li>
        ))}
      </MobileList>
      <div className="hidden sm:block">
        <Table label="Current certificates">
          <THead>
            <tr>
              <TH>Compliance type</TH>
              <TH>File</TH>
              <TH>Version</TH>
              <TH>Issued</TH>
              <TH>Expiry</TH>
              <TH>Status</TH>
              <TH>Uploaded by</TH>
            </tr>
          </THead>
          <TBody>
            {rows.map((c) => (
              <TR key={c._id} interactive>
                <TD className="font-semibold">{c.complianceTypeName}</TD>
                <TD>
                  <p className="max-w-[16rem] truncate text-sm" title={c.file.name}>{c.file.name}</p>
                  <p className="text-meta text-ink-muted">{formatFileSize(c.file.sizeBytes)}</p>
                </TD>
                <TD className="tabular-nums">v{c.version}</TD>
                <TD className="whitespace-nowrap">{formatDate(c.issueDate)}</TD>
                <TD className="whitespace-nowrap">
                  {formatDate(c.expiryDate)}
                  {c.expiryCalculated && <Calculator className="ml-1.5 inline h-3.5 w-3.5 text-ink-muted" aria-label="Calculated expiry" />}
                </TD>
                <TD>{c.requirementStatus ? <StatusPill kind="requirement" value={c.requirementStatus} variant="dot" /> : '—'}</TD>
                <TD className="whitespace-nowrap text-ink-muted">{c.uploadedBy.name}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </div>
      <Link href={`/certificates?propertyId=${propertyId}`} className="focus-ring inline-block rounded text-sm font-semibold text-brand-600 hover:underline">
        Open in the certificates register →
      </Link>
    </div>
  );
}

/* --------------------------------- Actions -------------------------------- */
type ActionScope = 'open' | 'closed' | 'all';

export function ActionsTab({ propertyId, canCreate, onCreate }: { propertyId: string; canCreate: boolean; onCreate: () => void }) {
  const [scope, setScope] = useState<ActionScope>('open');
  const { data, error, loading, reload } = useApi(
    () => actionsService.list({ propertyId, status: scope === 'open' ? 'not_closed' : scope === 'closed' ? 'closed' : undefined, limit: 200 }),
    [propertyId, scope],
  );
  const rows = data ?? [];
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SegmentedControl<ActionScope>
          label="Action status"
          variant="soft"
          value={scope}
          onChange={setScope}
          items={[
            { value: 'open', label: 'Open' },
            { value: 'closed', label: 'Closed' },
            { value: 'all', label: 'All' },
          ]}
        />
        {canCreate && (
          <Button size="sm" leftIcon={<SquarePlus className="h-4 w-4" />} onClick={onCreate}>
            New action
          </Button>
        )}
      </div>
      {loading && !data ? (
        <TableSkeleton />
      ) : error ? (
        <Alert tone="error" title="Could not load actions" onRetry={reload}>{error}</Alert>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<SquareCheck />}
          title={scope === 'open' ? 'No open actions' : 'No actions'}
          description={scope === 'open' ? 'Nothing outstanding on this property.' : 'Actions raised for this property will appear here.'}
          action={canCreate ? <Button variant="secondary" onClick={onCreate}>New action</Button> : undefined}
        />
      ) : (
        <>
          <MobileList>
            {rows.map((a) => (
              <li key={a._id} className="rounded-xl border border-line bg-surface p-4 shadow-card">
                <Link href={`/actions/${a._id}`} className="focus-ring rounded font-semibold text-ink hover:text-brand-600">
                  {a.reference} · {a.title}
                </Link>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <StatusPill kind="action" value={a.status} />
                  <StatusPill kind="priority" value={a.priority} />
                </div>
                <p className={cn('mt-2 text-sm', a.isOverdue ? 'font-semibold text-danger-700' : 'text-ink-muted')}>
                  {a.ownerName} · {a.status === 'closed' ? 'Closed' : formatRelativeDue(a.dueDate)}
                </p>
              </li>
            ))}
          </MobileList>
          <div className="hidden sm:block">
            <Table label="Actions for this property">
              <THead>
                <tr>
                  <TH>Action</TH>
                  <TH>Priority</TH>
                  <TH>Owner</TH>
                  <TH>Due</TH>
                  <TH>Status</TH>
                </tr>
              </THead>
              <TBody>
                {rows.map((a) => (
                  <TR key={a._id} interactive>
                    <TD>
                      <Link href={`/actions/${a._id}`} className="focus-ring rounded font-semibold text-ink hover:text-brand-600">
                        {a.title}
                      </Link>
                      <p className="text-meta text-ink-muted">
                        {a.reference}
                        {a.sourceRef && ` · ${a.sourceRef}`}
                      </p>
                    </TD>
                    <TD>
                      <StatusPill kind="priority" value={a.priority} />
                    </TD>
                    <TD className="whitespace-nowrap">{a.ownerName}</TD>
                    <TD className="whitespace-nowrap">
                      <p>{formatDate(a.dueDate)}</p>
                      {a.status !== 'closed' && <p className={cn('text-meta', a.isOverdue ? 'font-semibold text-danger-700' : 'text-ink-muted')}>{formatRelativeDue(a.dueDate)}</p>}
                    </TD>
                    <TD>
                      <StatusPill kind="action" value={a.status} />
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}

/* --------------------------------- Reports -------------------------------- */
export function ReportsTab({ propertyId, canGenerate, generating, onGenerate }: { propertyId: string; canGenerate: boolean; generating: boolean; onGenerate: () => void }) {
  const { data, error, loading, reload } = useApi(() => reportsService.list({ propertyId }), [propertyId]);
  const rows = data ?? [];
  const generateBtn = canGenerate ? (
    <Button size="sm" leftIcon={<FileText className="h-4 w-4" />} onClick={onGenerate} isLoading={generating}>
      Generate report
    </Button>
  ) : undefined;
  if (loading && !data) return <TableSkeleton rows={3} />;
  if (error) return <Alert tone="error" title="Could not load reports" onRetry={reload}>{error}</Alert>;
  if (rows.length === 0)
    return <EmptyState icon={<FileText />} title="No reports yet" description="Generate a PDF snapshot of this property's register and actions." action={generateBtn} />;
  return (
    <div className="space-y-4">
      {generateBtn && <div className="flex justify-end">{generateBtn}</div>}
      <ul className="grid gap-3 md:grid-cols-2">
        {rows.map((r) => (
          <li key={r._id} className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4 shadow-card">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <Link href={`/reports/${r._id}`} className="focus-ring break-all rounded font-semibold text-ink hover:text-brand-600">
                  {r.reference}
                </Link>
                <p className="text-meta text-ink-muted">
                  {formatDateTime(r.generatedAt)} · {r.generatedBy.name} · {formatFileSize(r.file.sizeBytes)}
                </p>
              </div>
              <StatusPill kind="rag" value={r.snapshot.rag} />
            </div>
            <dl className="grid grid-cols-4 gap-2 text-center text-sm">
              {[
                ['Overdue', r.snapshot.overdue],
                ['Due soon', r.snapshot.dueSoon],
                ['Missing', r.snapshot.missing],
                ['Open actions', r.snapshot.openActions],
              ].map(([label, value]) => (
                <div key={label} className="flex flex-col-reverse rounded-lg bg-canvas px-1 py-2">
                  <dt className="truncate text-meta text-ink-muted">{label}</dt>
                  <dd className="text-lg font-bold tabular-nums text-ink">{value}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* --------------------------------- Sharing -------------------------------- */
/** Moved to `components/sharing` in TASK-013; kept as an alias for existing imports. */
export { ShareLinksPanel as SharingTab } from '@/components/sharing';
