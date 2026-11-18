'use client';

import { ExternalLink, FileText } from 'lucide-react';
import { Button, Timeline, type TimelineItem } from '@/components/ui';
import { formatDate, formatDateTime, formatFileSize } from '@/lib/format';
import type { CertificateView } from '@/types/domain';
import { useViewFile } from './useViewFile';

/** Every version of one requirement's certificate, newest first, with a signed "View file" link. */
export function CertificateVersionTimeline({ versions }: { versions: CertificateView[] }) {
  const { viewFile, openingId } = useViewFile();
  const items: TimelineItem[] = versions.map((c) => ({
    id: c._id,
    tone: c.isCurrent ? 'ok' : 'neutral',
    icon: <FileText />,
    title: (
      <span className="flex flex-wrap items-center gap-2">
        Version {c.version}
        {c.isCurrent ? (
          <span className="rounded bg-ok-100 px-1.5 py-0.5 text-[11px] font-bold uppercase text-ok-700">Current</span>
        ) : (
          <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[11px] font-bold uppercase text-neutral-700">Superseded</span>
        )}
      </span>
    ),
    meta: (
      <>
        Uploaded {formatDateTime(c.createdAt)} by {c.uploadedBy.name}
        {c.supersededAt && <> · superseded {formatDate(c.supersededAt)}</>}
      </>
    ),
    body: (
      <div className="space-y-2">
        <p className="break-all font-medium">
          {c.file.name} <span className="font-normal text-ink-muted">· {formatFileSize(c.file.sizeBytes)}</span>
        </p>
        <p className="text-ink-muted">
          Issued {formatDate(c.issueDate)}
          {c.expiryDate ? ` · Expires ${formatDate(c.expiryDate)}${c.expiryCalculated ? ' (calculated)' : ''}` : ' · No expiry'}
          {c.reviewDate && ` · Review ${formatDate(c.reviewDate)}`}
        </p>
        {c.notes && <p className="text-ink-muted">“{c.notes}”</p>}
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<ExternalLink className="h-3.5 w-3.5" />}
          isLoading={openingId === c._id}
          onClick={() => viewFile(c._id)}
          aria-label={`View file for version ${c.version}`}
        >
          View file
        </Button>
      </div>
    ),
  }));
  return <Timeline items={items} />;
}
