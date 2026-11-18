'use client';

import React, { useEffect, useState } from 'react';
import { History } from 'lucide-react';
import { Alert, Badge, Button, Drawer, EmptyState, Input, Modal, Skeleton, useToast } from '@/components/ui';
import { formatDateTime } from '@/lib/format';
import { useApi } from '@/lib/hooks/useApi';
import { adminService, auditService, errorMessage } from '@/services';
import type { AdminOrganisationView } from '@/types/domain';

export function OrgStatusModal({
  org,
  onClose,
  onUpdated,
}: {
  org: AdminOrganisationView | null;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSuspending = org?.status === 'active';
  const nextStatus = isSuspending ? 'suspended' : 'active';

  const handleConfirm = async () => {
    if (!org) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await adminService.setStatus(org._id, nextStatus);
      toast({
        tone: isSuspending ? 'warning' : 'success',
        title: isSuspending ? 'Organisation suspended' : 'Organisation reactivated',
        description: res.message,
      });
      onUpdated();
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={!!org}
      onClose={() => !submitting && onClose()}
      title={isSuspending ? `Suspend ${org?.name ?? ''}?` : `Reactivate ${org?.name ?? ''}?`}
      description={
        isSuspending
          ? 'Users in a suspended organisation cannot sign in or upload certificates until reactivated.'
          : 'Users in this organisation will regain access immediately.'
      }
      size="sm"
    >
      <div className="space-y-4">
        {error && (
          <Alert tone="error" title="Action failed">
            {error}
          </Alert>
        )}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            type="button"
            variant={isSuspending ? 'danger' : 'primary'}
            onClick={handleConfirm}
            isLoading={submitting}
          >
            {isSuspending ? 'Suspend organisation' : 'Reactivate organisation'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export function SeatLimitModal({
  org,
  onClose,
  onUpdated,
}: {
  org: AdminOrganisationView | null;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const { toast } = useToast();
  const [seatLimit, setSeatLimit] = useState('15');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (org) {
      setSeatLimit(String(org.seatLimit));
      setError(null);
    }
  }, [org]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!org) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await adminService.updateSeatLimit(org._id, Number(seatLimit));
      toast({ tone: 'success', title: 'Seat limit updated', description: res.message });
      onUpdated();
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={!!org}
      onClose={() => !submitting && onClose()}
      title={`Seat limit · ${org?.name ?? ''}`}
      description={`Currently ${org?.activeUsers ?? 0} active user(s).`}
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert tone="error" title="Could not update seat limit">
            {error}
          </Alert>
        )}
        <Input
          label="Licensed seats"
          type="number"
          min={1}
          max={500}
          required
          value={seatLimit}
          onChange={(e) => setSeatLimit(e.target.value)}
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" isLoading={submitting}>
            Save seat limit
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function OrgAuditDrawer({
  org,
  onClose,
}: {
  org: AdminOrganisationView | null;
  onClose: () => void;
}) {
  const { data: events, loading, error, reload } = useApi(
    () =>
      org
        ? auditService.list({ entityType: 'organisation', entityId: org._id, limit: 20 })
        : Promise.resolve({ success: true, statusCode: 200, data: [] }),
    [org?._id],
  );

  return (
    <Drawer
      open={!!org}
      onClose={onClose}
      title={`Support audit · ${org?.name ?? ''}`}
      description="Platform and organisation-level changes logged for support review."
    >
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : error ? (
        <Alert tone="error" title="Could not load audit trail" onRetry={reload}>
          {errorMessage(error)}
        </Alert>
      ) : !events || events.length === 0 ? (
        <EmptyState
          icon={<History className="h-6 w-6" />}
          title="No organisation audit events yet"
          description="Status changes, seat updates, and profile edits for this organisation appear here."
        />
      ) : (
        <ul className="space-y-3">
          {events.map((ev) => (
            <li key={ev._id} className="rounded-lg border border-line bg-surface-subtle p-3 text-[13px]">
              <div className="flex items-center justify-between gap-2">
                <Badge tone="neutral" className="capitalize">
                  {ev.action}
                </Badge>
                <span className="text-[12px] text-ink-muted">{formatDateTime(ev.createdAt)}</span>
              </div>
              <p className="mt-1.5 font-medium text-ink">{ev.summary}</p>
              <p className="mt-0.5 text-[12px] text-ink-muted">
                By {ev.actorName} · IP {ev.ip}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Drawer>
  );
}
