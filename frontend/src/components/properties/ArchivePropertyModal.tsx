'use client';

import { useEffect, useState } from 'react';
import { Alert, Button, Modal, Textarea, useToast } from '@/components/ui';
import { errorMessage, propertiesService } from '@/services';
import type { Property } from '@/types/domain';

export interface ArchivePropertyModalProps {
  property: Property | null;
  onClose: () => void;
  onArchived: () => void;
}

export function ArchivePropertyModal({ property, onClose, onArchived }: ArchivePropertyModalProps) {
  const toast = useToast();
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (property) {
      setReason('');
      setError(null);
    }
  }, [property]);

  const handleConfirm = async () => {
    if (!property) return;
    setSubmitting(true);
    setError(null);
    try {
      await propertiesService.archive(property._id, reason.trim() || undefined);
      toast.success('Property archived', `${property.name} has been moved to archived properties.`);
      onArchived();
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={!!property}
      onClose={onClose}
      size="sm"
      title="Archive property"
      description={property ? `Are you sure you want to archive ${property.name} (${property.reference})?` : undefined}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleConfirm} isLoading={submitting}>
            Archive property
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-ink-muted">
          Archived properties are hidden from your active portfolio and dashboard calculations, but all certificates,
          actions, and audit history remain preserved. You can restore it at any time.
        </p>

        {error && (
          <Alert tone="error" title="Could not archive property">
            {error}
          </Alert>
        )}

        <Textarea
          label="Reason for archiving (optional)"
          placeholder="e.g. Property sold, lease ended, or transferred to another managing agent"
          rows={3}
          maxLength={500}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </div>
    </Modal>
  );
}
