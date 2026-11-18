'use client';

import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Checkbox,
  DatePicker,
  FileDropzone,
  Modal,
  SegmentedControl,
  Select,
  Textarea,
  useToast,
} from '@/components/ui';
import { formatFileSize } from '@/lib/format';
import { actionsService, errorMessage, isApiError, teamService } from '@/services';
import type { ActionView, Evidence, User } from '@/types/domain';

function useModalForm(open: boolean) {
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setFieldErrors({});
    setSaving(false);
  }, [open]);

  const handleErr = (err: unknown) => {
    if (isApiError(err) && err.errorSources.length) {
      setFieldErrors(Object.fromEntries(err.errorSources.map((s) => [s.path, s.message])));
    }
    setError(errorMessage(err));
  };

  return { error, setError, fieldErrors, setFieldErrors, saving, setSaving, handleErr };
}

/* ---------------------------- 1. Progress note ---------------------------- */
export function ProgressNoteModal({
  open,
  action,
  onClose,
  onDone,
}: {
  open: boolean;
  action: ActionView;
  onClose: () => void;
  onDone: () => void;
}) {
  const toast = useToast();
  const form = useModalForm(open);
  const [body, setBody] = useState('');
  const [moveToInProgress, setMoveToInProgress] = useState(true);

  useEffect(() => {
    if (!open) return;
    setBody('');
    setMoveToInProgress(action.status === 'open');
  }, [open, action.status]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    form.setError(null);
    if (!body.trim()) return form.setFieldErrors({ body: 'Write an update.' });
    form.setSaving(true);
    try {
      const res = await actionsService.addUpdate(action._id, {
        body: body.trim(),
        status: action.status === 'open' && moveToInProgress ? 'in_progress' : undefined,
      });
      toast.success(res.message ?? 'Update added');
      onDone();
      onClose();
    } catch (err) {
      form.handleErr(err);
    } finally {
      form.setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add progress note"
      description={`${action.reference} · ${action.title}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={form.saving}>
            Cancel
          </Button>
          <Button type="submit" form="progress-note-form" isLoading={form.saving}>
            Save update
          </Button>
        </>
      }
    >
      <form id="progress-note-form" onSubmit={submit} noValidate className="space-y-4">
        {form.error && <Alert tone="error" title="Could not save update">{form.error}</Alert>}
        <Textarea
          label="Progress update"
          required
          rows={4}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          error={form.fieldErrors.body}
          placeholder="Describe work completed, contractor visits, or blockers…"
        />
        {action.status === 'open' && (
          <Checkbox
            label="Move status to In progress"
            description="Marks this action as actively being worked on."
            checked={moveToInProgress}
            onChange={(e) => setMoveToInProgress(e.target.checked)}
          />
        )}
      </form>
    </Modal>
  );
}

/* ---------------------------- 2. Upload evidence -------------------------- */
export function UploadEvidenceModal({
  open,
  action,
  onClose,
  onDone,
}: {
  open: boolean;
  action: ActionView;
  onClose: () => void;
  onDone: () => void;
}) {
  const toast = useToast();
  const form = useModalForm(open);
  const [files, setFiles] = useState<File[]>([]);
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (!open) return;
    setFiles([]);
    setDescription('');
  }, [open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    form.setError(null);
    const errs: Record<string, string> = {};
    if (!files[0]) errs.file = 'Choose a file to upload.';
    if (!description.trim()) errs.description = 'Describe what the evidence shows.';
    form.setFieldErrors(errs);
    if (Object.keys(errs).length) return;
    form.setSaving(true);
    try {
      const res = await actionsService.addEvidence(action._id, { file: files[0]!, description: description.trim() });
      toast.success(res.message ?? 'Evidence uploaded');
      onDone();
      onClose();
    } catch (err) {
      form.handleErr(err);
    } finally {
      form.setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Upload evidence"
      description={`${action.reference} · ${action.title}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={form.saving}>
            Cancel
          </Button>
          <Button type="submit" form="upload-evidence-form" isLoading={form.saving}>
            Upload evidence
          </Button>
        </>
      }
    >
      <form id="upload-evidence-form" onSubmit={submit} noValidate className="space-y-4">
        {form.error && <Alert tone="error" title="Could not upload evidence">{form.error}</Alert>}
        <FileDropzone
          label="Evidence file"
          accept=".pdf,.jpg,.jpeg,.png,.heic"
          files={files}
          onFilesChange={setFiles}
          error={form.fieldErrors.file}
          hint="PDF, JPG, PNG or HEIC · up to 20 MB"
        />
        <Textarea
          label="What does this evidence show?"
          required
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          error={form.fieldErrors.description}
          placeholder="e.g. Photo of newly installed BS EN 1154 door closer on flat 3"
        />
      </form>
    </Modal>
  );
}

/* ------------------------- 3. Request verification ------------------------ */
export function RequestVerificationModal({
  open,
  action,
  evidenceCount,
  onClose,
  onDone,
}: {
  open: boolean;
  action: ActionView;
  evidenceCount: number;
  onClose: () => void;
  onDone: () => void;
}) {
  const toast = useToast();
  const form = useModalForm(open);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (open) setNote('');
  }, [open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    form.setError(null);
    form.setSaving(true);
    try {
      const res = await actionsService.requestVerification(action._id, { note: note.trim() || undefined });
      toast.success(res.message ?? 'Sent for verification');
      onDone();
      onClose();
    } catch (err) {
      form.handleErr(err);
    } finally {
      form.setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Request verification"
      description={`${action.reference} · ${evidenceCount} evidence item${evidenceCount === 1 ? '' : 's'} attached`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={form.saving}>
            Cancel
          </Button>
          <Button type="submit" form="request-verification-form" isLoading={form.saving}>
            Send for verification
          </Button>
        </>
      }
    >
      <form id="request-verification-form" onSubmit={submit} noValidate className="space-y-4">
        {form.error && <Alert tone="error" title="Could not request verification">{form.error}</Alert>}
        <p className="text-sm text-ink-muted">
          An Org Admin will review the attached evidence and either verify and close the action or return it for further evidence.
        </p>
        <Textarea
          label="Handover note (optional)"
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Summary for the verifier (e.g. All works completed and tested on site)…"
        />
      </form>
    </Modal>
  );
}

/* ---------------------------- 4. Verify action ---------------------------- */
export function VerifyActionModal({
  open,
  action,
  evidence,
  onClose,
  onDone,
}: {
  open: boolean;
  action: ActionView;
  evidence: Evidence[];
  onClose: () => void;
  onDone: () => void;
}) {
  const toast = useToast();
  const form = useModalForm(open);
  const [decision, setDecision] = useState<'accept' | 'request_more'>('accept');
  const [summary, setSummary] = useState('');
  const [reason, setReason] = useState('');
  const [acceptedIds, setAcceptedIds] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    setDecision('accept');
    setSummary('');
    setReason('');
    setAcceptedIds(evidence.filter((e) => e.status !== 'rejected').map((e) => e._id));
  }, [open, evidence]);

  const toggleId = (id: string) => {
    setAcceptedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    form.setError(null);
    const errs: Record<string, string> = {};
    if (decision === 'accept') {
      if (!summary.trim()) errs.summary = 'Write a closure summary.';
      if (!acceptedIds.length) errs.acceptedEvidenceIds = 'Accept at least one piece of evidence.';
    } else if (!reason.trim()) {
      errs.reason = 'Say what further evidence is needed.';
    }
    form.setFieldErrors(errs);
    if (Object.keys(errs).length) return;

    form.setSaving(true);
    try {
      const res = await actionsService.verify(action._id, {
        decision,
        summary: decision === 'accept' ? summary.trim() : undefined,
        reason: decision === 'request_more' ? reason.trim() : undefined,
        acceptedEvidenceIds: decision === 'accept' ? acceptedIds : [],
      });
      toast.success(res.message ?? (decision === 'accept' ? 'Action closed' : 'Returned for more evidence'));
      onDone();
      onClose();
    } catch (err) {
      form.handleErr(err);
    } finally {
      form.setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Verify action"
      description={`${action.reference} · ${action.title}`}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={form.saving}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="verify-action-form"
            variant={decision === 'accept' ? 'primary' : 'danger'}
            isLoading={form.saving}
          >
            {decision === 'accept' ? 'Verify & close action' : 'Return for more evidence'}
          </Button>
        </>
      }
    >
      <form id="verify-action-form" onSubmit={submit} noValidate className="space-y-4">
        {form.error && <Alert tone="error" title="Could not complete verification">{form.error}</Alert>}
        <SegmentedControl<'accept' | 'request_more'>
          label="Verification decision"
          value={decision}
          onChange={setDecision}
          items={[
            { value: 'accept', label: 'Accept & close' },
            { value: 'request_more', label: 'Request more evidence' },
          ]}
        />

        {decision === 'accept' ? (
          <>
            <div className="space-y-2">
              <p className="text-sm font-medium text-ink">Evidence to accept</p>
              {evidence.length === 0 ? (
                <p className="text-sm text-ink-muted">No evidence uploaded.</p>
              ) : (
                <ul className="divide-y divide-line rounded-xl border border-line bg-canvas">
                  {evidence.map((ev) => (
                    <li key={ev._id} className="px-3.5 py-2.5">
                      <Checkbox
                        label={ev.file.name}
                        description={`${ev.description} · ${formatFileSize(ev.file.sizeBytes)}`}
                        checked={acceptedIds.includes(ev._id)}
                        onChange={() => toggleId(ev._id)}
                      />
                    </li>
                  ))}
                </ul>
              )}
              {form.fieldErrors.acceptedEvidenceIds && (
                <p className="text-meta font-medium text-danger-700" role="alert">
                  {form.fieldErrors.acceptedEvidenceIds}
                </p>
              )}
            </div>
            <Textarea
              label="Closure summary"
              required
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              error={form.fieldErrors.summary}
              placeholder="Confirm what was verified and why this action is ready to close…"
            />
          </>
        ) : (
          <Textarea
            label="What further evidence is needed?"
            required
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            error={form.fieldErrors.reason}
            placeholder="Explain clearly what the owner needs to provide before re-submitting…"
          />
        )}
      </form>
    </Modal>
  );
}

/* ---------------------------- 5. Reopen action ---------------------------- */
export function ReopenActionModal({
  open,
  action,
  onClose,
  onDone,
}: {
  open: boolean;
  action: ActionView;
  onClose: () => void;
  onDone: () => void;
}) {
  const toast = useToast();
  const form = useModalForm(open);
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (open) setReason('');
  }, [open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    form.setError(null);
    if (!reason.trim()) return form.setFieldErrors({ reason: 'Give a reason for reopening.' });
    form.setSaving(true);
    try {
      const res = await actionsService.reopen(action._id, { reason: reason.trim() });
      toast.success(res.message ?? 'Action reopened');
      onDone();
      onClose();
    } catch (err) {
      form.handleErr(err);
    } finally {
      form.setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Reopen action"
      description={`${action.reference} · ${action.title}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={form.saving}>
            Cancel
          </Button>
          <Button type="submit" form="reopen-action-form" isLoading={form.saving}>
            Reopen action
          </Button>
        </>
      }
    >
      <form id="reopen-action-form" onSubmit={submit} noValidate className="space-y-4">
        {form.error && <Alert tone="error" title="Could not reopen action">{form.error}</Alert>}
        <p className="text-sm text-ink-muted">
          Reopening clears the current closure record and moves the action back to <strong>In progress</strong>.
        </p>
        <Textarea
          label="Reason for reopening"
          required
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          error={form.fieldErrors.reason}
          placeholder="e.g. Follow-up inspection found the latch is still sticking"
        />
      </form>
    </Modal>
  );
}

/* --------------------------- 6. Change due date --------------------------- */
export function DueDateModal({
  open,
  action,
  onClose,
  onDone,
}: {
  open: boolean;
  action: ActionView;
  onClose: () => void;
  onDone: () => void;
}) {
  const toast = useToast();
  const form = useModalForm(open);
  const [dueDate, setDueDate] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!open) return;
    setDueDate(action.dueDate.slice(0, 10));
    setReason('');
  }, [open, action.dueDate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    form.setError(null);
    const errs: Record<string, string> = {};
    if (!dueDate) errs.dueDate = 'Choose a due date.';
    if (!reason.trim()) errs.dueDateReason = 'Give a reason for changing the due date.';
    form.setFieldErrors(errs);
    if (Object.keys(errs).length) return;
    form.setSaving(true);
    try {
      const res = await actionsService.update(action._id, { dueDate, dueDateReason: reason.trim() });
      toast.success(res.message ?? 'Due date updated');
      onDone();
      onClose();
    } catch (err) {
      form.handleErr(err);
    } finally {
      form.setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Change due date"
      description={`${action.reference} · ${action.title}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={form.saving}>
            Cancel
          </Button>
          <Button type="submit" form="due-date-form" isLoading={form.saving}>
            Update due date
          </Button>
        </>
      }
    >
      <form id="due-date-form" onSubmit={submit} noValidate className="space-y-4">
        {form.error && <Alert tone="error" title="Could not update due date">{form.error}</Alert>}
        <DatePicker
          label="New due date"
          required
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          error={form.fieldErrors.dueDate}
        />
        <Textarea
          label="Reason for change"
          required
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          error={form.fieldErrors.dueDateReason}
          placeholder="e.g. Contractor parts on 2-week lead time"
        />
      </form>
    </Modal>
  );
}

/* --------------------------- 7. Reassign owner ---------------------------- */
export function ReassignOwnerModal({
  open,
  action,
  onClose,
  onDone,
}: {
  open: boolean;
  action: ActionView;
  onClose: () => void;
  onDone: () => void;
}) {
  const toast = useToast();
  const form = useModalForm(open);
  const [users, setUsers] = useState<User[]>([]);
  const [ownerId, setOwnerId] = useState(action.ownerId);

  useEffect(() => {
    if (!open) return;
    setOwnerId(action.ownerId);
    teamService
      .assignees()
      .then((res) => setUsers(res.data))
      .catch(() => setUsers([]));
  }, [open, action.ownerId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    form.setError(null);
    if (!ownerId) return form.setFieldErrors({ ownerId: 'Choose an owner.' });
    form.setSaving(true);
    try {
      const res = await actionsService.update(action._id, { ownerId });
      toast.success(res.message ?? 'Owner updated');
      onDone();
      onClose();
    } catch (err) {
      form.handleErr(err);
    } finally {
      form.setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Reassign owner"
      description={`${action.reference} · ${action.title}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={form.saving}>
            Cancel
          </Button>
          <Button type="submit" form="reassign-owner-form" isLoading={form.saving}>
            Save owner
          </Button>
        </>
      }
    >
      <form id="reassign-owner-form" onSubmit={submit} noValidate className="space-y-4">
        {form.error && <Alert tone="error" title="Could not reassign owner">{form.error}</Alert>}
        <Select
          label="Action owner"
          required
          value={ownerId}
          onChange={(e) => setOwnerId(e.target.value)}
          error={form.fieldErrors.ownerId}
          options={users.map((u) => ({ value: u._id, label: u.name }))}
        />
      </form>
    </Modal>
  );
}
