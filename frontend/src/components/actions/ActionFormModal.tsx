'use client';

import { useEffect, useState } from 'react';
import { Alert, Button, Checkbox, DatePicker, Input, Modal, Select, Textarea, useToast } from '@/components/ui';
import { useSession } from '@/lib/session-mock';
import { actionsService, certificatesService, errorMessage, isApiError, propertiesService, teamService } from '@/services';
import type { Action, Priority, Property, User } from '@/types/domain';

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

const SOURCE_OPTIONS: { value: Action['source']; label: string }[] = [
  { value: 'manual', label: 'Manual' },
  { value: 'report_finding', label: 'Report finding' },
];

export interface ActionFormModalProps {
  open: boolean;
  /** Pre-selected property ID. When omitted, a Property selector is shown. */
  propertyId?: string;
  propertyName?: string;
  /** Certificates the action can be linked to (current versions of this property). */
  certificates?: { _id: string; label: string }[];
  defaultCertificateId?: string;
  onClose: () => void;
  onCreated?: (action?: Action) => void;
}

/** Create a manual or report-finding action for one property (or choose a property in portfolio mode). */
export function ActionFormModal({
  open,
  propertyId: fixedPropertyId,
  propertyName,
  certificates: fixedCertificates,
  defaultCertificateId,
  onClose,
  onCreated,
}: ActionFormModalProps) {
  const toast = useToast();
  const { user } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [fetchedCerts, setFetchedCerts] = useState<{ _id: string; label: string }[]>([]);

  const [propertyId, setPropertyId] = useState(fixedPropertyId ?? '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [source, setSource] = useState<Action['source']>('manual');
  const [sourceRef, setSourceRef] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [ownerId, setOwnerId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [certificateId, setCertificateId] = useState('');
  const [evidenceRequired, setEvidenceRequired] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPropertyId(fixedPropertyId ?? '');
    setTitle('');
    setDescription('');
    setSource('manual');
    setSourceRef('');
    setPriority('medium');
    setOwnerId(user?._id ?? '');
    setDueDate('');
    setCertificateId(defaultCertificateId ?? '');
    setEvidenceRequired(false);
    setErrors({});
    setFormError(null);
    teamService
      .assignees()
      .then((res) => setUsers(res.data))
      .catch(() => setUsers([]));
    if (!fixedPropertyId) {
      propertiesService
        .list({ status: 'active', sort: 'name', limit: 500 })
        .then((res) => setProperties(res.data))
        .catch(() => setProperties([]));
    }
  }, [open, fixedPropertyId, user?._id, defaultCertificateId]);

  useEffect(() => {
    if (!open || fixedCertificates) return;
    if (!propertyId) {
      setFetchedCerts([]);
      return;
    }
    let alive = true;
    certificatesService
      .list({ propertyId, current: true, limit: 200 })
      .then((res) => {
        if (!alive) return;
        setFetchedCerts(res.data.map((c) => ({ _id: c._id, label: `${c.complianceTypeName} (v${c.version})` })));
      })
      .catch(() => {
        if (alive) setFetchedCerts([]);
      });
    return () => {
      alive = false;
    };
  }, [open, propertyId, fixedCertificates]);

  const certificates = fixedCertificates ?? fetchedCerts;
  const today = new Date().toISOString().slice(0, 10);

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setFormError(null);
    const e: Record<string, string> = {};
    if (!propertyId) e.propertyId = 'Choose a property.';
    if (!title.trim()) e.title = 'Enter a title.';
    if (!ownerId) e.ownerId = 'Choose an owner.';
    if (!dueDate) e.dueDate = 'Choose a due date.';
    setErrors(e);
    if (Object.keys(e).length) return;
    setSaving(true);
    try {
      const res = await actionsService.create({
        propertyId,
        certificateId: certificateId || undefined,
        title,
        description,
        source,
        sourceRef: source === 'report_finding' ? sourceRef.trim() || undefined : undefined,
        priority,
        ownerId,
        dueDate,
        evidenceRequired,
      });
      toast.success(res.message ?? 'Action created');
      onCreated?.(res.data);
      onClose();
    } catch (err) {
      if (isApiError(err) && err.errorSources.length) setErrors(Object.fromEntries(err.errorSources.map((s) => [s.path, s.message])));
      setFormError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New action"
      description={propertyName ? `Remedial action for ${propertyName}` : 'Assign a remedial action to a property and owner'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="action-form" isLoading={saving}>
            Create action
          </Button>
        </>
      }
    >
      <form id="action-form" onSubmit={submit} noValidate className="space-y-4">
        {formError && (
          <Alert tone="error" title="Could not create the action">
            {formError}
          </Alert>
        )}
        {!fixedPropertyId && (
          <Select
            label="Property"
            required
            placeholder="Choose a property"
            value={propertyId}
            onChange={(e) => {
              setPropertyId(e.target.value);
              setCertificateId('');
            }}
            error={errors.propertyId}
            options={properties.map((p) => ({ value: p._id, label: `${p.name} (${p.reference})` }))}
          />
        )}
        <Input label="Title" required value={title} onChange={(e) => setTitle(e.target.value)} error={errors.title} placeholder="e.g. Replace damaged fire door closer, flat 3" />
        <Textarea label="Description" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Priority" value={priority} onChange={(e) => setPriority(e.target.value as Priority)} options={PRIORITY_OPTIONS} />
          <DatePicker label="Due date" required min={today} value={dueDate} onChange={(e) => setDueDate(e.target.value)} error={errors.dueDate} />
        </div>
        <Select
          label="Owner"
          required
          placeholder="Choose an owner"
          value={ownerId}
          onChange={(e) => setOwnerId(e.target.value)}
          error={errors.ownerId}
          options={users.map((u) => ({ value: u._id, label: u.name }))}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Source" value={source} onChange={(e) => setSource(e.target.value as Action['source'])} options={SOURCE_OPTIONS} />
          {source === 'report_finding' ? (
            <Input label="Finding reference" value={sourceRef} onChange={(e) => setSourceRef(e.target.value)} placeholder="e.g. FRA item 4.2" />
          ) : (
            <Select
              label="Linked certificate (optional)"
              value={certificateId}
              onChange={(e) => setCertificateId(e.target.value)}
              disabled={!propertyId}
              options={[{ value: '', label: 'None' }, ...certificates.map((c) => ({ value: c._id, label: c.label }))]}
            />
          )}
        </div>
        {source === 'report_finding' && (
          <Select
            label="Linked certificate (optional)"
            value={certificateId}
            onChange={(e) => setCertificateId(e.target.value)}
            disabled={!propertyId}
            options={[{ value: '', label: 'None' }, ...certificates.map((c) => ({ value: c._id, label: c.label }))]}
          />
        )}
        <div className="rounded-xl border border-line bg-canvas p-3.5">
          <Checkbox
            label="Require evidence to close this action"
            description="The owner must upload photos or documents. Leave unticked to let them close routine actions with a written completion note. Either way an Org Admin verifies it."
            checked={evidenceRequired}
            onChange={(e) => setEvidenceRequired(e.target.checked)}
          />
        </div>
      </form>
    </Modal>
  );
}
