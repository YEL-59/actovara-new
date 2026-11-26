'use client';

import { useCallback, useEffect, useState } from 'react';
import { Copy, ExternalLink, FileText, Link2Off, Mail, Paperclip, Send } from 'lucide-react';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardHeader,
  Checkbox,
  EmptyState,
  FileDropzone,
  Input,
  Modal,
  Select,
  Skeleton,
  Textarea,
  useToast,
} from '@/components/ui';
import { formatDate, formatDateTime, formatFileSize } from '@/lib/format';
import { useApi } from '@/lib/hooks/useApi';
import {
  ACTION_LINK_DAY_OPTIONS,
  EXTERNAL_ROLE_LABEL,
  actionLinkStatus,
  actionLinksService,
  actionsService,
  errorMessage,
  isApiError,
} from '@/services';
import type { ActionLink, ActionView, ExternalContactRole } from '@/types/domain';

/* ------------------------------ File opener ------------------------------- */
/** Opens an action attachment/evidence file in a new tab via a short-lived signed URL. */
export function useActionFile(actionId: string) {
  const toast = useToast();
  const [openingId, setOpeningId] = useState<string | null>(null);
  const open = useCallback(
    async (fileId: string) => {
      const tab = window.open('', '_blank');
      if (tab) tab.opener = null;
      setOpeningId(fileId);
      try {
        const { data } = await actionsService.fileUrl(actionId, fileId);
        if (tab) tab.location.href = data.url;
        else toast.toast({ tone: 'info', title: 'Pop-up blocked', description: 'Allow pop-ups for this site to open files in a new tab.' });
      } catch (err) {
        tab?.close();
        toast.error('Could not open the file', errorMessage(err));
      } finally {
        setOpeningId(null);
      }
    },
    [actionId, toast],
  );
  return { open, openingId };
}

/* --------------------------- Add attachment modal ------------------------- */
export function AddAttachmentModal({ open, action, onClose, onDone }: { open: boolean; action: ActionView; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const [files, setFiles] = useState<File[]>([]);
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setFiles([]);
    setDescription('');
    setError(null);
    setFileError(undefined);
  }, [open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!files.length) return setFileError('Choose at least one photo or document.');
    setSaving(true);
    try {
      for (const f of files) await actionsService.addAttachment(action._id, { file: f, description: description.trim() || undefined });
      toast.success(files.length === 1 ? 'Attachment added' : `${files.length} attachments added`);
      onDone();
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add photos or documents"
      description={`${action.reference} · ${action.title}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="add-attachment-form" isLoading={saving}>
            Add
          </Button>
        </>
      }
    >
      <form id="add-attachment-form" onSubmit={submit} noValidate className="space-y-4">
        {error && <Alert tone="error" title="Could not add the attachment">{error}</Alert>}
        <FileDropzone
          label="Photos or documents"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.heic"
          files={files}
          onFilesChange={(f) => {
            setFiles(f);
            setFileError(undefined);
          }}
          error={fileError}
          hint="e.g. inspection photos, a report extract or a quote · PDF, JPG, PNG or HEIC · up to 20 MB each"
        />
        <Input label="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Photo of the landing taken during the inspection" />
        <p className="text-meta text-ink-muted">These are reference files for whoever does the work. Completion evidence is added separately.</p>
      </form>
    </Modal>
  );
}

/* ----------------------------- Attachments card --------------------------- */
export function AttachmentsCard({ action, canEdit, onChanged }: { action: ActionView; canEdit: boolean; onChanged: () => void }) {
  const [adding, setAdding] = useState(false);
  const { open, openingId } = useActionFile(action._id);
  const items = action.attachments ?? [];
  return (
    <Card>
      <CardHeader
        title="Attachments"
        description="Photos or documents added when the action was raised"
        actions={
          canEdit ? (
            <Button size="sm" variant="secondary" leftIcon={<Paperclip className="h-4 w-4" />} onClick={() => setAdding(true)}>
              Add
            </Button>
          ) : undefined
        }
      />
      {items.length === 0 ? (
        <p className="text-sm text-ink-muted">No attachments. Add inspection photos or documents so the person doing the work can see the issue.</p>
      ) : (
        <ul className="divide-y divide-line rounded-xl border border-line bg-canvas">
          {items.map((a) => (
            <li key={a._id} className="flex flex-col gap-2 p-3.5 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <FileText className="h-4 w-4 shrink-0 text-brand-600" aria-hidden />
                  <span className="truncate">{a.file.name}</span>
                  <span className="shrink-0 text-meta font-normal text-ink-muted">{formatFileSize(a.file.sizeBytes)}</span>
                </p>
                {a.description && <p className="mt-0.5 text-sm text-ink">{a.description}</p>}
                <p className="text-meta text-ink-muted">
                  Added by {a.uploadedBy.name} · {formatDateTime(a.createdAt)}
                </p>
              </div>
              <Button size="sm" variant="ghost" leftIcon={<ExternalLink className="h-3.5 w-3.5" />} isLoading={openingId === a.file._id} onClick={() => open(a.file._id)}>
                View
              </Button>
            </li>
          ))}
        </ul>
      )}
      <AddAttachmentModal open={adding} action={action} onClose={() => setAdding(false)} onDone={onChanged} />
    </Card>
  );
}

/* ------------------------- Send to external contact ----------------------- */
const ROLE_OPTIONS = (Object.keys(EXTERNAL_ROLE_LABEL) as ExternalContactRole[]).map((r) => ({ value: r, label: EXTERNAL_ROLE_LABEL[r] }));

export function SendToContactModal({ open, action, onClose, onDone }: { open: boolean; action: ActionView; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<ExternalContactRole>('contractor');
  const [company, setCompany] = useState('');
  const [message, setMessage] = useState('');
  const [days, setDays] = useState('14');
  const [allowEvidence, setAllowEvidence] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [sent, setSent] = useState<{ url: string; link: ActionLink } | null>(null);

  useEffect(() => {
    if (!open) return;
    setName('');
    setEmail('');
    setRole('contractor');
    setCompany('');
    setMessage(`Please carry out the action below at ${action.propertyName} by ${formatDate(action.dueDate)}. Use the secure link to add comments, upload photos and confirm when it is done.`);
    setDays('14');
    setAllowEvidence(true);
    setErrors({});
    setFormError(null);
    setSent(null);
  }, [open, action.propertyName, action.dueDate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Enter the contact’s name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errs.email = 'Enter a valid email address.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      const res = await actionLinksService.send(action._id, {
        name,
        email,
        role,
        company,
        message,
        days: Number(days),
        allowEvidence: allowEvidence || action.evidenceRequired,
      });
      setSent(res.data);
      toast.success(res.message ?? 'Email sent');
      onDone();
    } catch (err) {
      if (isApiError(err) && err.errorSources.length) setErrors(Object.fromEntries(err.errorSources.map((s) => [s.path, s.message])));
      setFormError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const copy = async () => {
    if (!sent) return;
    try {
      await navigator.clipboard.writeText(sent.url);
      toast.success('Link copied');
    } catch {
      toast.error('Could not copy', 'Select the link and copy it manually.');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={sent ? 'Action sent' : 'Send to external contact'}
      description={`${action.reference} · ${action.title}`}
      footer={
        sent ? (
          <Button onClick={onClose}>Done</Button>
        ) : (
          <>
            <Button variant="secondary" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" form="send-contact-form" isLoading={saving} leftIcon={<Send className="h-4 w-4" />}>
              Send email
            </Button>
          </>
        )
      }
    >
      {sent ? (
        <div className="space-y-4">
          <Alert tone="success" title={`Email sent to ${sent.link.contact.name}`}>
            {sent.link.contact.email} has been sent a secure link to this action. It works until {formatDate(sent.link.expiresAt)}. Their comments
            {sent.link.allowEvidence ? ', photos' : ''} and completion will appear on this action for an Org Admin to verify.
          </Alert>
          <div className="space-y-1.5">
            <p className="text-sm font-medium text-ink">Secure link (shown once)</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <code className="min-w-0 flex-1 truncate rounded-lg border border-line bg-canvas px-3 py-2 text-meta text-ink">{sent.url}</code>
              <Button variant="secondary" leftIcon={<Copy className="h-4 w-4" />} onClick={copy}>
                Copy
              </Button>
            </div>
            <a
              href={sent.url}
              target="_blank"
              rel="noreferrer noopener"
              className="focus-ring inline-flex items-center gap-1.5 rounded text-sm font-semibold text-brand-600 hover:underline"
            >
              <ExternalLink className="h-4 w-4" aria-hidden />
              Demo: open the page the contact sees
            </a>
          </div>
        </div>
      ) : (
        <form id="send-contact-form" onSubmit={submit} noValidate className="space-y-4">
          {formError && <Alert tone="error" title="Could not send the action">{formError}</Alert>}
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Contact name" required value={name} onChange={(e) => setName(e.target.value)} error={errors.name} placeholder="e.g. Dan Price" />
            <Input label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} placeholder="name@company.co.uk" />
            <Select label="They are a" value={role} onChange={(e) => setRole(e.target.value as ExternalContactRole)} options={ROLE_OPTIONS} />
            <Input label="Company (optional)" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Brightline Electrical" />
          </div>
          <Textarea label="Message" rows={3} value={message} onChange={(e) => setMessage(e.target.value)} hint="Included in the email above the action details." />
          <div className="grid gap-4 sm:grid-cols-2 sm:items-start">
            <Select
              label="Link valid for"
              value={days}
              onChange={(e) => setDays(e.target.value)}
              error={errors.days}
              options={ACTION_LINK_DAY_OPTIONS.map((d) => ({ value: String(d), label: `${d} days` }))}
            />
            <Checkbox
              label="Let them upload photos or documents"
              description={action.evidenceRequired ? 'Required: this action needs evidence to close.' : 'As evidence of completion.'}
              checked={allowEvidence || action.evidenceRequired}
              disabled={action.evidenceRequired}
              onChange={(e) => setAllowEvidence(e.target.checked)}
              className="sm:pt-7"
            />
          </div>
          <div className="rounded-xl border border-line bg-canvas p-3.5 text-meta text-ink-muted">
            <p className="flex items-center gap-1.5 font-semibold text-ink">
              <Mail className="h-4 w-4" aria-hidden />
              What they receive
            </p>
            <p className="mt-1">
              An email with a secure link to this action only: the title, description, property address, priority, due date and attachments ({action.attachments?.length ?? 0}).
              They can comment{allowEvidence || action.evidenceRequired ? ', upload photos or documents' : ''} and confirm completion without an Actovara account. Owners, internal notes and other
              actions are never shown. You can withdraw the link at any time.
            </p>
          </div>
        </form>
      )}
    </Modal>
  );
}

/* ---------------------------- External links card ------------------------- */
const STATUS_BADGE = {
  active: { label: 'Active', tone: 'ok' },
  expired: { label: 'Expired', tone: 'neutral' },
  revoked: { label: 'Withdrawn', tone: 'danger' },
} as const;

export function ExternalContactsCard({ action, canEdit, refreshKey, onChanged }: { action: ActionView; canEdit: boolean; refreshKey: number; onChanged: () => void }) {
  const toast = useToast();
  const links = useApi(() => actionLinksService.list(action._id), [action._id, refreshKey]);
  const [sending, setSending] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const isClosed = action.status === 'closed';

  const revoke = async (l: ActionLink) => {
    setRevokingId(l._id);
    try {
      await actionLinksService.revoke(l._id);
      toast.success('Link withdrawn', `${l.contact.name} can no longer open this action.`);
      links.reload();
      onChanged();
    } catch (err) {
      toast.error('Could not withdraw the link', errorMessage(err));
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <Card>
      <CardHeader
        title="External contacts"
        description="Contractors, landlords or tenants sent this action by secure email link"
        actions={
          canEdit && !isClosed ? (
            <Button size="sm" variant="secondary" leftIcon={<Send className="h-4 w-4" />} onClick={() => setSending(true)}>
              Send
            </Button>
          ) : undefined
        }
      />
      {links.loading && !links.data ? (
        <Skeleton className="h-16 rounded-xl" />
      ) : links.error ? (
        <Alert tone="error" title="Could not load external contacts" onRetry={links.reload}>
          {links.error}
        </Alert>
      ) : !links.data?.length ? (
        <EmptyState
          icon={<Mail />}
          title="Not sent to anyone outside Actovara"
          description="Send this action to a contractor or other contact. They get a secure link to view it, comment, upload photos and confirm completion."
          action={
            canEdit && !isClosed ? (
              <Button size="sm" leftIcon={<Send className="h-4 w-4" />} onClick={() => setSending(true)}>
                Send to external contact
              </Button>
            ) : undefined
          }
        />
      ) : (
        <ul className="divide-y divide-line rounded-xl border border-line bg-canvas">
          {links.data.map((l) => {
            const st = actionLinkStatus(l);
            return (
              <li key={l._id} className="flex flex-col gap-2 p-3.5 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-0.5">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-ink">
                    {l.contact.name}
                    <span className="font-normal text-ink-muted">
                      {EXTERNAL_ROLE_LABEL[l.contact.role]}
                      {l.contact.company ? ` · ${l.contact.company}` : ''}
                    </span>
                    <Badge tone={STATUS_BADGE[st].tone}>{STATUS_BADGE[st].label}</Badge>
                  </p>
                  <p className="truncate text-meta text-ink-muted">{l.contact.email}</p>
                  <p className="text-meta text-ink-muted">
                    Sent by {l.createdBy.name} · {formatDateTime(l.createdAt)} · {st === 'active' ? `valid until ${formatDate(l.expiresAt)}` : st === 'expired' ? `expired ${formatDate(l.expiresAt)}` : `withdrawn ${formatDate(l.revokedAt!)}`}
                  </p>
                  <p className="text-meta text-ink-muted">
                    {l.accessCount ? `Opened ${l.accessCount}× · last ${formatDateTime(l.lastAccessedAt!)}` : 'Not opened yet'}
                    {l.allowEvidence ? ' · can upload evidence' : ''}
                  </p>
                </div>
                {canEdit && st === 'active' && (
                  <Button size="sm" variant="ghost" leftIcon={<Link2Off className="h-3.5 w-3.5" />} isLoading={revokingId === l._id} onClick={() => revoke(l)}>
                    Withdraw
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <SendToContactModal
        open={sending}
        action={action}
        onClose={() => setSending(false)}
        onDone={() => {
          links.reload();
          onChanged();
        }}
      />
    </Card>
  );
}

