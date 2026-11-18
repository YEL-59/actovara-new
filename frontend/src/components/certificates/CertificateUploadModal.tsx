'use client';

import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, DatePicker, FileDropzone, Modal, Select, Skeleton, Textarea, useToast } from '@/components/ui';
import { useApi } from '@/lib/hooks/useApi';
import { formatDate } from '@/lib/format';
import { certificatesService, errorMessage, isApiError, propertiesService } from '@/services';
import type { ApiEnvelope, Certificate, Property, RequirementView } from '@/types/domain';

export interface CertificateUploadModalProps {
  open: boolean;
  /**
   * Requirements of one property (property detail page). When omitted the modal runs in
   * portfolio mode: choose a property first, then one of its requirements.
   */
  requirements?: RequirementView[];
  /** Portfolio mode: pre-selected property. */
  propertyId?: string;
  /** Pre-selected requirement (from a register row, drawer or "Upload new version"). */
  requirementId?: string;
  onClose: () => void;
  onUploaded?: (certificate: Certificate) => void;
}

const ACCEPT = '.pdf,.jpg,.jpeg,.png,.heic';
const MAX_BYTES = 20 * 1024 * 1024;

const resolved = <T,>(data: T): Promise<ApiEnvelope<T>> => Promise.resolve({ success: true, statusCode: 200, data });

/** Adds `months` calendar months to a yyyy-mm-dd date (preview of the PRD §5.1 auto-calculation). */
function previewExpiry(issueDate: string, months: number | null | undefined) {
  if (!issueDate || !months) return null;
  const d = new Date(`${issueDate}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  d.setUTCMonth(d.getUTCMonth() + months);
  return d;
}

/**
 * Upload a certificate (new version) against a property requirement. Shared by the property
 * register (TASK-008) and the portfolio certificates register (TASK-009).
 */
export function CertificateUploadModal({ open, requirements, propertyId, requirementId, onClose, onUploaded }: CertificateUploadModalProps) {
  const toast = useToast();
  const portfolio = requirements === undefined;

  const [propId, setPropId] = useState('');
  const [reqId, setReqId] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [reviewDate, setReviewDate] = useState('');
  const [notes, setNotes] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPropId(propertyId ?? '');
    setReqId(requirementId ?? '');
    setIssueDate('');
    setExpiryDate('');
    setReviewDate('');
    setNotes('');
    setFiles([]);
    setErrors({});
    setFormError(null);
  }, [open, propertyId, requirementId]);

  const props = useApi<Property[]>(
    () => (open && portfolio ? propertiesService.list({ status: 'active', sort: 'name', limit: 500 }) : resolved([])),
    [open, portfolio],
  );
  const loadedReqs = useApi<RequirementView[]>(
    () => (open && portfolio && propId ? propertiesService.requirements(propId) : resolved([])),
    [open, portfolio, propId],
  );

  const allReqs = portfolio ? loadedReqs.data ?? [] : requirements;
  const options = useMemo(() => allReqs.filter((r) => r.applicability === 'applicable'), [allReqs]);
  const reqsLoading = portfolio && !!propId && loadedReqs.loading;

  const selected = options.find((r) => r._id === reqId);
  const type = selected?.complianceType;
  const storeOnly = !!type?.storeOnly;
  const months = selected?.renewalMonthsOverride ?? type?.defaultRenewalMonths;
  const calculated = !expiryDate && !storeOnly ? previewExpiry(issueDate, months) : null;
  const current = selected?.currentCertificate;
  const today = new Date().toISOString().slice(0, 10);

  const clearError = (key: string) => setErrors((e) => (e[key] ? { ...e, [key]: '' } : e));

  const validate = () => {
    const e: Record<string, string> = {};
    if (portfolio && !propId) e.propertyId = 'Choose a property.';
    if (!reqId) e.requirementId = 'Choose the compliance type.';
    if (!issueDate) e.issueDate = 'Enter the inspection or issue date.';
    else if (issueDate > today) e.issueDate = 'The issue date cannot be in the future.';
    if (!storeOnly && expiryDate && issueDate && expiryDate <= issueDate) e.expiryDate = 'The expiry date must be after the issue date.';
    if (reviewDate && issueDate && reviewDate < issueDate) e.reviewDate = 'The review date cannot be before the issue date.';
    if (!files[0]) e.file = 'Choose a file to upload.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setFormError(null);
    if (!validate()) return;
    setSaving(true);
    try {
      const res = await certificatesService.upload({
        requirementId: reqId,
        issueDate,
        expiryDate: !storeOnly && expiryDate ? expiryDate : undefined,
        reviewDate: reviewDate || undefined,
        notes: notes || undefined,
        file: files[0]!,
      });
      toast.success(res.message ?? 'Certificate uploaded', type ? `${type.name} saved.` : undefined);
      onUploaded?.(res.data);
      onClose();
    } catch (err) {
      if (isApiError(err) && err.errorSources.length) {
        setErrors(Object.fromEntries(err.errorSources.map((s) => [s.path, s.message])));
      }
      setFormError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const requirementHint = reqsLoading
    ? 'Loading compliance types…'
    : portfolio && !propId
      ? 'Choose a property first.'
      : options.length === 0
        ? 'No applicable requirements on this property.'
        : undefined;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Upload certificate"
      description="A new upload becomes the current version. Earlier versions stay in the history."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="certificate-upload-form" isLoading={saving}>
            Upload certificate
          </Button>
        </>
      }
    >
      <form id="certificate-upload-form" onSubmit={submit} noValidate className="space-y-4">
        {formError && <Alert tone="error" title="Could not upload the certificate">{formError}</Alert>}

        {portfolio &&
          (props.loading && !props.data ? (
            <Skeleton className="h-[68px] w-full" />
          ) : props.error ? (
            <Alert tone="error" title="Could not load properties" onRetry={props.reload}>
              {props.error}
            </Alert>
          ) : (
            <Select
              label="Property"
              required
              placeholder="Choose a property"
              value={propId}
              onChange={(e) => {
                setPropId(e.target.value);
                setReqId('');
                clearError('propertyId');
              }}
              error={errors.propertyId}
              options={(props.data ?? []).map((p) => ({ value: p._id, label: `${p.name} · ${p.reference}` }))}
              hint={(props.data ?? []).length === 0 ? 'No active properties. Add a property first.' : undefined}
            />
          ))}

        {loadedReqs.error && portfolio ? (
          <Alert tone="error" title="Could not load compliance types" onRetry={loadedReqs.reload}>
            {loadedReqs.error}
          </Alert>
        ) : (
          <Select
            label="Compliance type"
            required
            placeholder="Choose a compliance type"
            value={reqId}
            disabled={(portfolio && !propId) || reqsLoading}
            onChange={(e) => {
              setReqId(e.target.value);
              clearError('requirementId');
            }}
            error={errors.requirementId}
            options={options.map((r) => ({ value: r._id, label: r.complianceType.name + (r.complianceType.storeOnly ? ' (stored only)' : '') }))}
            hint={requirementHint}
          />
        )}

        {current && (
          <Alert tone="info" title={`This will become version ${current.version + 1}`}>
            Version {current.version} ({current.expiryDate ? `expires ${formatDate(current.expiryDate)}` : 'no expiry'}) will be marked superseded and kept in the history.
          </Alert>
        )}

        {storeOnly && (
          <Alert tone="info" title="Stored document — no reminders">
            {type?.name} is kept for record only. It has no expiry date, does not affect compliance status and no reminders are sent.
          </Alert>
        )}

        <div className={storeOnly ? 'grid gap-4' : 'grid gap-4 sm:grid-cols-2'}>
          <DatePicker
            label={storeOnly ? 'Document date' : 'Inspection / issue date'}
            required
            max={today}
            value={issueDate}
            onChange={(e) => {
              setIssueDate(e.target.value);
              clearError('issueDate');
            }}
            error={errors.issueDate}
          />
          {!storeOnly && (
            <DatePicker
              label="Expiry date"
              value={expiryDate}
              min={issueDate || undefined}
              onChange={(e) => {
                setExpiryDate(e.target.value);
                clearError('expiryDate');
              }}
              error={errors.expiryDate}
              hint={
                calculated
                  ? `Leave blank to calculate: ${formatDate(calculated)} (${months} months).`
                  : months
                    ? `Leave blank to calculate from the issue date (${months} months).`
                    : selected
                      ? 'No renewal cycle set for this type — enter the expiry date.'
                      : undefined
              }
            />
          )}
        </div>

        {calculated && (
          <p className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700" aria-live="polite">
            Calculated expiry: <span className="font-semibold">{formatDate(calculated)}</span> — issue date + {months}-month renewal cycle
            {selected?.renewalMonthsOverride ? ' (property override)' : ''}.
          </p>
        )}

        <DatePicker
          label="Review date (optional)"
          value={reviewDate}
          min={issueDate || undefined}
          onChange={(e) => {
            setReviewDate(e.target.value);
            clearError('reviewDate');
          }}
          error={errors.reviewDate}
        />
        <FileDropzone
          label="Certificate file"
          accept={ACCEPT}
          maxSizeBytes={MAX_BYTES}
          files={files}
          onFilesChange={(f) => {
            setFiles(f);
            clearError('file');
          }}
          hint="PDF, JPG, PNG or HEIC, up to 20 MB."
          error={errors.file || undefined}
        />
        <Textarea label="Notes (optional)" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </form>
    </Modal>
  );
}
