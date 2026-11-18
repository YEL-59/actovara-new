'use client';

import { useEffect, useState } from 'react';
import { Alert, Button, Input, Modal, Textarea, useToast } from '@/components/ui';
import { errorMessage, propertiesService } from '@/services';
import type { RequirementView } from '@/types/domain';

/** Mark a requirement not applicable — a reason is mandatory (PRD §5.1, audited). */
export function NotApplicableModal({ requirement, onClose }: { requirement: RequirementView | null; onClose: () => void }) {
  const toast = useToast();
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setReason('');
    setError(null);
  }, [requirement?._id]);

  if (!requirement) return null;
  const name = requirement.complianceType.name;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Give a reason why this does not apply.');
      return;
    }
    setSaving(true);
    try {
      await propertiesService.updateRequirement(requirement._id, {
        applicability: 'not_applicable',
        naReason: reason,
        renewalMonthsOverride: requirement.renewalMonthsOverride ?? null,
      });
      toast.success(`${name} marked not applicable`, 'Status and property RAG recalculated.');
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      size="sm"
      onClose={onClose}
      title={`Mark ${name} not applicable?`}
      description="It will be excluded from status, gauges and reminders. The reason is kept in the audit log."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="na-form" isLoading={saving}>
            Mark not applicable
          </Button>
        </>
      }
    >
      <form id="na-form" onSubmit={submit} noValidate>
        <Textarea
          label="Reason"
          required
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          error={error ?? undefined}
          placeholder="e.g. No gas supply to the building"
          autoFocus
        />
      </form>
    </Modal>
  );
}

/** Override the renewal interval used to auto-calculate expiry for this property only. */
export function RenewalOverrideModal({ requirement, onClose }: { requirement: RequirementView | null; onClose: () => void }) {
  const toast = useToast();
  const [months, setMonths] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setMonths(requirement?.renewalMonthsOverride != null ? String(requirement.renewalMonthsOverride) : '');
    setError(null);
    setFormError(null);
  }, [requirement?._id, requirement?.renewalMonthsOverride]);

  if (!requirement) return null;
  const type = requirement.complianceType;
  const defaultMonths = type.defaultRenewalMonths;

  const save = async (value: number | null) => {
    setSaving(true);
    setFormError(null);
    try {
      await propertiesService.updateRequirement(requirement._id, {
        applicability: requirement.applicability,
        naReason: requirement.naReason,
        renewalMonthsOverride: value,
      });
      toast.success(value == null ? 'Default interval restored' : 'Renewal interval saved', 'Applies to the next certificate uploaded without an expiry date.');
      onClose();
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = Number(months);
    if (!months.trim() || !Number.isInteger(n) || n < 1 || n > 240) {
      setError('Enter a whole number of months between 1 and 240.');
      return;
    }
    void save(n);
  };

  return (
    <Modal
      open
      size="sm"
      onClose={onClose}
      title={`Renewal interval — ${type.name}`}
      description={defaultMonths ? `Catalogue default: ${defaultMonths} months.` : 'This type has no default interval.'}
      footer={
        <>
          {requirement.renewalMonthsOverride != null && (
            <Button variant="ghost" onClick={() => void save(null)} disabled={saving} className="mr-auto">
              Use default
            </Button>
          )}
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="renewal-form" isLoading={saving}>
            Save interval
          </Button>
        </>
      }
    >
      <form id="renewal-form" onSubmit={submit} noValidate className="space-y-4">
        {formError && <Alert tone="error" title="Could not save">{formError}</Alert>}
        <Input
          label="Renewal interval (months)"
          type="number"
          inputMode="numeric"
          min={1}
          max={240}
          value={months}
          onChange={(e) => setMonths(e.target.value)}
          error={error ?? undefined}
          hint="Existing certificates keep their expiry dates."
          autoFocus
        />
      </form>
    </Modal>
  );
}
