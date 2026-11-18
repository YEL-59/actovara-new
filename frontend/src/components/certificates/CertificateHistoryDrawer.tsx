'use client';

import Link from 'next/link';
import { FilePlus2, History } from 'lucide-react';
import { Alert, Button, Drawer, EmptyState, Skeleton, StatusPill } from '@/components/ui';
import { useApi } from '@/lib/hooks/useApi';
import { formatRelativeDue } from '@/lib/format';
import { certificatesService } from '@/services';
import type { CertificateView } from '@/types/domain';
import { CertificateVersionTimeline } from './CertificateVersionTimeline';

export interface CertificateHistoryDrawerProps {
  /** Any version of the certificate; the drawer lists every version of the same requirement. */
  certificate: CertificateView | null;
  canUpload: boolean;
  onClose: () => void;
  onUploadNewVersion: (c: CertificateView) => void;
}

export function CertificateHistoryDrawer({ certificate: c, canUpload, onClose, onUploadNewVersion }: CertificateHistoryDrawerProps) {
  const state = useApi(
    () => (c ? certificatesService.history(c._id) : Promise.resolve({ success: true, statusCode: 200, data: [] as CertificateView[] })),
    [c?._id],
  );
  if (!c) return null;
  const versions = state.data ?? [];
  const current = versions.find((v) => v.isCurrent);

  return (
    <Drawer
      open
      onClose={onClose}
      title={`${c.complianceTypeName} — version history`}
      description={`${c.propertyName}${c.propertyReference ? ` · ${c.propertyReference}` : ''}`}
      width="max-w-lg"
      footer={
        canUpload ? (
          <Button leftIcon={<FilePlus2 className="h-4 w-4" />} onClick={() => onUploadNewVersion(c)}>
            Upload new version
          </Button>
        ) : undefined
      }
    >
      <div className="space-y-6">
        {current?.requirementStatus && (
          <div className="flex flex-wrap items-center gap-3">
            <StatusPill kind="requirement" value={current.requirementStatus} size="md" />
            {current.expiryDate && <span className="text-sm text-ink-muted">{formatRelativeDue(current.expiryDate)}</span>}
          </div>
        )}
        <p className="text-sm text-ink-muted">
          Uploading a new version makes it the current certificate. Earlier versions are kept here as superseded copies and are never deleted.
        </p>
        {state.loading && !state.data ? (
          <div className="space-y-3" aria-hidden>
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
        ) : state.error ? (
          <Alert tone="error" title="Could not load the version history" onRetry={state.reload}>
            {state.error}
          </Alert>
        ) : versions.length === 0 ? (
          <EmptyState icon={<History />} title="No versions found" description="This certificate has no stored versions." />
        ) : (
          <CertificateVersionTimeline versions={versions} />
        )}
        <Link
          href={`/properties/${c.propertyId}?tab=register`}
          className="focus-ring inline-block rounded text-sm font-semibold text-brand-600 hover:underline"
        >
          Open the property compliance register →
        </Link>
      </div>
    </Drawer>
  );
}
