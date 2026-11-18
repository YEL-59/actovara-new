'use client';

import React, { useState } from 'react';
import { FileSpreadsheet, History, Lock } from 'lucide-react';
import { CsvImportWizard, SettingsTableSkeleton } from '@/components/settings';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  Pagination,
  Select,
  TD,
  TH,
  Table,
} from '@/components/ui';
import { formatDateTime } from '@/lib/format';
import { useApi } from '@/lib/hooks/useApi';
import { useSession } from '@/lib/session-mock';
import { ENABLE_CSV_IMPORT, USE_MOCKS, errorMessage, importsService } from '@/services';
import type { ImportLog, ImportType } from '@/types/domain';

export default function ImportsSettingsPage() {
  const { can } = useSession();
  const allowed = can('import.run');
  const [demoPreview, setDemoPreview] = useState(false);
  const enabled = ENABLE_CSV_IMPORT || demoPreview;

  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);

  const {
    data: logs,
    meta,
    error,
    loading,
    reload,
  } = useApi(
    () =>
      allowed && enabled
        ? importsService.list({
            importType: (typeFilter || undefined) as ImportType | undefined,
            page,
            limit: 10,
          })
        : Promise.resolve({ success: true, statusCode: 200, data: [] as ImportLog[] }),
    [allowed, enabled, typeFilter, page],
  );

  if (!allowed) {
    return (
      <Alert tone="warning" title="Import permission required">
        Your role does not have permission to run CSV imports.
      </Alert>
    );
  }

  if (!enabled) {
    return (
      <Card>
        <EmptyState
          icon={<Lock className="h-6 w-6" />}
          title="CSV Import is disabled (Q-008)"
          description="Bulk CSV import for properties and certificates is currently behind a feature flag pending client scope confirmation. Set NEXT_PUBLIC_ENABLE_CSV_IMPORT=true in .env.local to enable it."
          action={
            USE_MOCKS ? (
              <Button type="button" variant="secondary" onClick={() => setDemoPreview(true)}>
                Preview demo wizard
              </Button>
            ) : undefined
          }
        />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {!ENABLE_CSV_IMPORT && demoPreview && (
        <Alert tone="info" title="Demo preview active (Q-008)">
          CSV Import is hidden behind <code className="font-mono text-[12px]">NEXT_PUBLIC_ENABLE_CSV_IMPORT=true</code>{' '}
          by default until client confirmation.
        </Alert>
      )}

      <CsvImportWizard onImported={reload} />

      <Card>
        <CardHeader
          title="Import history"
          description="Recent property and certificate CSV imports for this organisation."
          actions={
            <div className="w-44">
              <Select
                aria-label="Filter import history by type"
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setPage(1);
                }}
                options={[
                  { value: '', label: 'All types' },
                  { value: 'properties', label: 'Properties' },
                  { value: 'certificates', label: 'Certificates' },
                ]}
              />
            </div>
          }
        />

        {loading ? (
          <SettingsTableSkeleton rows={4} />
        ) : error ? (
          <Alert tone="error" title="Could not load import history" onRetry={reload}>
            {errorMessage(error)}
          </Alert>
        ) : !logs || logs.length === 0 ? (
          <EmptyState
            icon={<History className="h-6 w-6" />}
            title="No imports yet"
            description="Completed CSV imports will appear here with row counts and status."
          />
        ) : (
          <>
            <div className="hidden md:block">
              <Table>
                <thead>
                  <tr>
                    <TH>Date</TH>
                    <TH>Type</TH>
                    <TH>File</TH>
                    <TH>Rows</TH>
                    <TH>Status</TH>
                    <TH>Imported by</TH>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log._id}>
                      <TD className="whitespace-nowrap text-[13px] text-ink-muted">
                        {formatDateTime(log.createdAt)}
                      </TD>
                      <TD>
                        <Badge tone="neutral" className="capitalize">
                          {log.importType}
                        </Badge>
                      </TD>
                      <TD>
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="h-4 w-4 shrink-0 text-ink-muted" aria-hidden />
                          <div>
                            <div className="font-medium text-ink">{log.fileName}</div>
                            <div className="text-[12px] text-ink-muted">Format: {log.dateFormat}</div>
                          </div>
                        </div>
                      </TD>
                      <TD className="text-[13px]">
                        <span className="font-semibold text-ok-700">{log.importedCount}</span>
                        <span className="text-ink-muted"> / {log.totalRows}</span>
                        {(log.skippedCount > 0 || log.errorCount > 0) && (
                          <div className="text-[11.5px] text-ink-muted">
                            {log.skippedCount} skipped · {log.errorCount} errors
                          </div>
                        )}
                      </TD>
                      <TD>
                        <Badge
                          tone={log.status === 'completed' ? 'ok' : log.status === 'partial' ? 'warn' : 'danger'}
                          className="capitalize"
                        >
                          {log.status}
                        </Badge>
                      </TD>
                      <TD className="text-[13px] text-ink-muted">{log.createdBy.name}</TD>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>

            <div className="space-y-3 md:hidden">
              {logs.map((log) => (
                <div key={log._id} className="rounded-lg border border-line p-3.5 text-[13px]">
                  <div className="flex items-center justify-between gap-2">
                    <Badge tone="neutral" className="capitalize">
                      {log.importType}
                    </Badge>
                    <Badge
                      tone={log.status === 'completed' ? 'ok' : log.status === 'partial' ? 'warn' : 'danger'}
                      className="capitalize"
                    >
                      {log.status}
                    </Badge>
                  </div>
                  <p className="mt-2 font-medium text-ink">{log.fileName}</p>
                  <p className="mt-0.5 text-[12px] text-ink-muted">
                    {log.importedCount}/{log.totalRows} imported · {log.skippedCount} skipped · {log.errorCount} errors
                  </p>
                  <p className="mt-1 text-[12px] text-ink-muted">
                    {log.createdBy.name} · {formatDateTime(log.createdAt)}
                  </p>
                </div>
              ))}
            </div>

            {meta && meta.totalPage > 1 && (
              <div className="mt-4">
                <Pagination
                  page={meta.page}
                  totalPages={meta.totalPage}
                  total={meta.total}
                  limit={meta.limit}
                  onPageChange={setPage}
                />
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
