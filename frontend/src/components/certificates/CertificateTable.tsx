'use client';

import Link from 'next/link';
import { Calculator, ExternalLink, FilePlus2, History } from 'lucide-react';
import { Badge, DropdownMenu, StatusPill, Table, TBody, TD, TH, THead, TR, type MenuItem } from '@/components/ui';
import { formatDate, formatFileSize, formatRelativeDue } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { CertificateView } from '@/types/domain';

export interface CertificateTableProps {
  certificates: CertificateView[];
  canUpload: boolean;
  onHistory: (c: CertificateView) => void;
  onViewFile: (c: CertificateView) => void;
  onUploadNewVersion: (c: CertificateView) => void;
}

function menuItems(c: CertificateView, p: CertificateTableProps): MenuItem[] {
  const items: MenuItem[] = [
    { label: 'Version history', icon: <History className="h-4 w-4" />, onSelect: () => p.onHistory(c) },
    { label: 'View file', icon: <ExternalLink className="h-4 w-4" />, onSelect: () => p.onViewFile(c) },
  ];
  if (p.canUpload) items.push({ label: 'Upload new version', icon: <FilePlus2 className="h-4 w-4" />, onSelect: () => p.onUploadNewVersion(c) });
  return items;
}

function StatusCell({ c }: { c: CertificateView }) {
  if (!c.isCurrent) return <Badge tone="neutral">Superseded</Badge>;
  return c.requirementStatus ? <StatusPill kind="requirement" value={c.requirementStatus} variant="dot" /> : <span className="text-ink-muted">—</span>;
}

function Expiry({ c, compact }: { c: CertificateView; compact?: boolean }) {
  if (!c.expiryDate) {
    return <span className="text-ink-muted">{c.requirementStatus === 'store_only' ? 'No expiry · no reminders' : 'No expiry'}</span>;
  }
  const tone =
    c.isCurrent && c.requirementStatus === 'overdue'
      ? 'font-semibold text-danger-700'
      : c.isCurrent && c.requirementStatus === 'due_soon'
        ? 'font-semibold text-warn-700'
        : 'text-ink-muted';
  return (
    <span className={compact ? 'inline' : 'block'}>
      <span className="whitespace-nowrap">
        {formatDate(c.expiryDate)}
        {c.expiryCalculated && <Calculator className="ml-1.5 inline h-3.5 w-3.5 text-ink-muted" aria-label="Expiry calculated from the renewal cycle" />}
      </span>
      {c.isCurrent && !compact && <span className={cn('block text-meta', tone)}>{formatRelativeDue(c.expiryDate)}</span>}
    </span>
  );
}

/** Portfolio certificate register: stacked cards below 640px, table above. */
export function CertificateTable(props: CertificateTableProps) {
  const { certificates } = props;
  return (
    <>
      <ul className="space-y-3 sm:hidden" aria-label="Certificates">
        {certificates.map((c) => (
          <li key={c._id} className={cn('rounded-xl border border-line bg-surface p-4 shadow-card', !c.isCurrent && 'opacity-80')}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-ink">{c.complianceTypeName}</p>
                <Link href={`/properties/${c.propertyId}?tab=register`} className="focus-ring rounded text-sm text-brand-600 hover:underline">
                  {c.propertyName}
                </Link>
              </div>
              <DropdownMenu items={menuItems(c, props)} label={`Actions for ${c.complianceTypeName} at ${c.propertyName}`} />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <StatusCell c={c} />
              <span className="text-meta text-ink-muted">v{c.version}</span>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <dt className="text-ink-muted">Issued</dt>
              <dd className="text-ink">{formatDate(c.issueDate)}</dd>
              <dt className="text-ink-muted">Expiry</dt>
              <dd className="text-ink">
                <Expiry c={c} compact />
              </dd>
            </dl>
            <p className="mt-2 truncate text-meta text-ink-muted" title={c.file.name}>
              {c.file.name} · {formatFileSize(c.file.sizeBytes)}
            </p>
          </li>
        ))}
      </ul>

      <div className="hidden sm:block">
        <Table label="Certificates register">
          <THead>
            <tr>
              <TH className="sticky left-0 z-10 bg-table-head">Property</TH>
              <TH>Compliance type</TH>
              <TH className="hidden lg:table-cell">File</TH>
              <TH>Version</TH>
              <TH className="hidden md:table-cell">Issued</TH>
              <TH>Expiry</TH>
              <TH>Status</TH>
              <TH className="hidden xl:table-cell">Uploaded</TH>
              <TH>
                <span className="sr-only">Actions</span>
              </TH>
            </tr>
          </THead>
          <TBody>
            {certificates.map((c) => (
              <TR key={c._id} interactive className={cn(!c.isCurrent && 'text-ink-muted')}>
                <TD className="sticky left-0 z-[1] bg-surface">
                  <Link
                    href={`/properties/${c.propertyId}?tab=register`}
                    className="focus-ring rounded font-semibold text-ink hover:text-brand-600 hover:underline"
                  >
                    {c.propertyName}
                  </Link>
                  <p className="text-meta text-ink-muted">{c.propertyReference}</p>
                </TD>
                <TD>
                  <button
                    type="button"
                    onClick={() => props.onHistory(c)}
                    className="focus-ring rounded text-left font-medium text-ink hover:text-brand-600 hover:underline"
                  >
                    {c.complianceTypeName}
                  </button>
                </TD>
                <TD className="hidden lg:table-cell">
                  <p className="max-w-[14rem] truncate text-sm" title={c.file.name}>
                    {c.file.name}
                  </p>
                  <p className="text-meta text-ink-muted">{formatFileSize(c.file.sizeBytes)}</p>
                </TD>
                <TD className="tabular-nums">v{c.version}</TD>
                <TD className="hidden whitespace-nowrap md:table-cell">{formatDate(c.issueDate)}</TD>
                <TD>
                  <Expiry c={c} />
                </TD>
                <TD>
                  <StatusCell c={c} />
                </TD>
                <TD className="hidden whitespace-nowrap xl:table-cell">
                  <p className="text-sm">{c.uploadedBy.name}</p>
                  <p className="text-meta text-ink-muted">{formatDate(c.createdAt)}</p>
                </TD>
                <TD className="text-right">
                  <DropdownMenu items={menuItems(c, props)} label={`Actions for ${c.complianceTypeName} at ${c.propertyName}`} />
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </div>
    </>
  );
}
