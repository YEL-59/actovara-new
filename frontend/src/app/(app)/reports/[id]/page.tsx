'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Clock, Download, FileText, Printer, Share2 } from 'lucide-react';
import { ReportPreviewSkeleton, ReportSheet, ShareWithLandlordModal, useDownloadReport } from '@/components/reports';
import { Alert, Button, EmptyState } from '@/components/ui';
import { formatDateTime } from '@/lib/format';
import { useApi } from '@/lib/hooks/useApi';
import { reportsService } from '@/services';

export default function ReportPreviewPage() {
  const { id } = useParams<{ id: string }>();
  const { data: report, error, loading, reload } = useApi(() => reportsService.get(id), [id]);
  const { download, downloadingId } = useDownloadReport();
  const [shareOpen, setShareOpen] = useState(false);

  if (loading && !report) {
    return <ReportPreviewSkeleton />;
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Link href="/reports" className="focus-ring inline-flex items-center gap-1.5 rounded text-sm font-semibold text-brand-600 hover:underline">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to reports
        </Link>
        <Alert tone="error" title="Could not load report" onRetry={reload}>
          {error}
        </Alert>
      </div>
    );
  }

  if (!report) {
    return (
      <EmptyState
        icon={<FileText />}
        title="Report not found"
        description="This report may have been removed or the reference is invalid."
        action={
          <Link href="/reports" className="focus-ring inline-flex h-10 items-center rounded-lg bg-brand-600 px-4 font-semibold text-white hover:bg-brand-700">
            Back to reports
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* Action Toolbar (hidden when printing) */}
      <div className="mx-auto flex max-w-[210mm] flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href="/reports" className="focus-ring inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-semibold text-ink-muted hover:text-ink">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to reports
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" leftIcon={<Share2 className="h-4 w-4" />} onClick={() => setShareOpen(true)}>
            Share with landlord
          </Button>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Download className="h-4 w-4" />}
            isLoading={downloadingId === report._id}
            onClick={() => download(report._id, report.file.name)}
          >
            Download PDF
          </Button>
          <Button size="sm" leftIcon={<Printer className="h-4 w-4" />} onClick={() => window.print()}>
            Print / Save PDF
          </Button>
        </div>
      </div>

      {/* Snapshot Notice (hidden when printing) */}
      <div className="mx-auto flex max-w-[210mm] items-center gap-2.5 rounded-xl border border-line bg-surface px-4 py-3 text-xs text-ink-muted shadow-card print:hidden">
        <Clock className="h-4 w-4 shrink-0 text-brand-600" aria-hidden />
        <p>
          <span className="font-semibold text-ink">Point-in-time snapshot:</span> Generated on {formatDateTime(report.generatedAt)} by {report.generatedBy.name}. Changes made to the property after this time do not alter this report.
        </p>
      </div>

      {/* A4 Print-Styled Report Sheet */}
      <ReportSheet report={report} />

      <ShareWithLandlordModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        propertyId={report.propertyId}
        propertyName={report.propertyName}
      />
    </div>
  );
}
