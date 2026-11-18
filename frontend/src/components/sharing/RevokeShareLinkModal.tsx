'use client';

import { useEffect, useState } from 'react';
import { Alert, Button, Modal, useToast } from '@/components/ui';
import { errorMessage, sharingService } from '@/services';
import type { ShareLink } from '@/types/domain';

export function RevokeShareLinkModal({ link, onClose }: { link: ShareLink | null; onClose: () => void }) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    setSaving(false);
  }, [link?._id]);

  async function revoke() {
    if (!link) return;
    setSaving(true);
    setError(null);
    try {
      await sharingService.revoke(link._id);
      toast.success('Share link revoked', 'The landlord can no longer open it.');
      onClose();
    } catch (e) {
      setError(errorMessage(e));
      setSaving(false);
    }
  }

  return (
    <Modal
      open={!!link}
      onClose={onClose}
      size="sm"
      title="Revoke share link?"
      description={link ? `Link ending …${link.tokenHint}` : undefined}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="danger" onClick={() => void revoke()} isLoading={saving}>
            Revoke link
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        {error && <Alert tone="error" title="Could not revoke the link">{error}</Alert>}
        <p className="text-sm text-ink-muted">
          Anyone with this link will see a &ldquo;link withdrawn&rdquo; page straight away. This cannot be undone: create a new link if the landlord needs access again.
        </p>
      </div>
    </Modal>
  );
}
