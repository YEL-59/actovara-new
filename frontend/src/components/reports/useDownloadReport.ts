'use client';

import { useState } from 'react';
import { useToast } from '@/components/ui';
import { errorMessage, reportsService } from '@/services';

/** Fetches a short-lived signed URL for a report and triggers a browser download. */
export function useDownloadReport() {
  const toast = useToast();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  async function download(reportId: string, fileName?: string) {
    setDownloadingId(reportId);
    try {
      const res = await reportsService.fileUrl(reportId);
      const a = document.createElement('a');
      a.href = res.data.url;
      a.download = res.data.mimeType === 'text/html' ? (fileName ?? res.data.fileName).replace(/\.pdf$/i, '.html') : (fileName ?? res.data.fileName);
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success(
        res.data.mimeType === 'text/html'
          ? 'Demo report snapshot downloaded. Use Print / Save PDF on the preview for an A4 PDF.'
          : 'Report download started',
      );
    } catch (e) {
      toast.error('Could not download report', errorMessage(e));
    } finally {
      setDownloadingId(null);
    }
  }

  return { download, downloadingId };
}
