'use client';

import { useCallback, useState } from 'react';
import { useToast } from '@/components/ui';
import { certificatesService, errorMessage } from '@/services';

/**
 * Opens a certificate's file through a short-lived signed URL. The tab is opened synchronously
 * on click (so pop-up blockers allow it) and pointed at the URL once the API answers.
 */
export function useViewFile() {
  const toast = useToast();
  const [openingId, setOpeningId] = useState<string | null>(null);

  const viewFile = useCallback(
    async (certificateId: string) => {
      const tab = window.open('', '_blank');
      if (tab) tab.opener = null;
      setOpeningId(certificateId);
      try {
        const { data } = await certificatesService.fileUrl(certificateId);
        if (tab) tab.location.href = data.url;
        else toast.toast({ tone: 'info', title: 'Pop-up blocked', description: 'Allow pop-ups for this site to open certificate files in a new tab.' });
      } catch (err) {
        tab?.close();
        toast.error('Could not open the file', errorMessage(err));
      } finally {
        setOpeningId(null);
      }
    },
    [toast],
  );

  return { viewFile, openingId };
}
