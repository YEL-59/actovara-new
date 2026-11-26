'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  CalendarClock,
  CircleCheck,
  ExternalLink,
  FileText,
  Hourglass,
  LinkIcon,
  MapPin,
  MessageCircle,
  RotateCcw,
  Send,
  ShieldCheck,
  TimerOff,
  Upload,
} from 'lucide-react';
import { Logo } from '@/components/layout/Logo';
import { Alert, Button, Card, FileDropzone, Input, LoadingRegion, Skeleton, StatusPill, Textarea, useToast } from '@/components/ui';
import { formatDate, formatDateTime, formatFileSize, formatRelativeDue } from '@/lib/format';
import { cn } from '@/lib/utils';
import { errorMessage, isApiError, publicActionService } from '@/services';
import type { PublicActionView } from '@/types/domain';

type State = { kind: 'loading' } | { kind: 'ready'; view: PublicActionView } | { kind: 'invalid' } | { kind: 'gone'; message: string } | { kind: 'error'; message: string };

function Chrome({ children, organisationName }: { children: React.ReactNode; organisationName?: string }) {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <a href="#action-main" className="focus-ring sr-only z-50 rounded-lg bg-surface px-4 py-2 font-semibold text-brand-700 focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        Skip to content
      </a>
      <header className="bg-sidebar">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Logo tone="light" size="sm" />
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sidebar-hover px-3 py-1 text-xs font-medium text-sidebar-muted">
            <LinkIcon className="h-3.5 w-3.5" aria-hidden />
            Secure action link
          </span>
        </div>
      </header>
      <main id="action-main" className="page-enter mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
      <footer className="border-t border-line bg-surface">
        <div className="mx-auto max-w-3xl px-4 py-4 text-meta text-ink-muted sm:px-6">
          {organisationName ? `Sent by ${organisationName} using Actovara.` : 'Powered by Actovara.'} This link is personal to you. Please do not forward it.
        </div>
      </footer>
    </div>
  );
}

function StateCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="mx-auto mt-6 max-w-md rounded-2xl border border-line bg-surface p-6 text-center shadow-card sm:mt-12 sm:p-8">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-table-head text-ink-muted [&>svg]:h-6 [&>svg]:w-6" aria-hidden>
        {icon}
      </span>
      <h1 className="mt-4 text-xl font-bold text-ink">{title}</h1>
      <div className="mt-2 text-sm text-ink-muted">{children}</div>
    </section>
  );
}

const HISTORY_META: Record<PublicActionView['history'][number]['kind'], { label: string; icon: React.ReactNode; tone: string }> = {
  sent: { label: 'Action sent to you', icon: <Send />, tone: 'bg-brand-50 text-brand-600' },
  comment: { label: 'Comment', icon: <MessageCircle />, tone: 'bg-table-head text-ink-muted' },
  evidence: { label: 'File uploaded', icon: <Upload />, tone: 'bg-brand-50 text-brand-600' },
  submitted: { label: 'Completion confirmed', icon: <Hourglass />, tone: 'bg-warn-50 text-warn-700' },
  returned: { label: 'Returned by the property manager', icon: <RotateCcw />, tone: 'bg-danger-50 text-danger-700' },
  closed: { label: 'Verified and closed', icon: <ShieldCheck />, tone: 'bg-ok-50 text-ok-700' },
};

export function PublicActionPage({ token }: { token: string }) {
  const toast = useToast();
  const [state, setState] = useState<State>({ kind: 'loading' });
  const [opening, setOpening] = useState<string | null>(null);

  const [comment, setComment] = useState('');
  const [commentError, setCommentError] = useState<string>();
  const [files, setFiles] = useState<File[]>([]);
  const [fileDesc, setFileDesc] = useState('');
  const [fileErrors, setFileErrors] = useState<Record<string, string>>({});
  const [note, setNote] = useState('');
  const [noteError, setNoteError] = useState<string>();
  const [busy, setBusy] = useState<'comment' | 'upload' | 'complete' | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setState({ kind: 'loading' });
    try {
      const res = await publicActionService.view(token);
      setState({ kind: 'ready', view: res.data });
    } catch (err) {
      if (isApiError(err) && err.statusCode === 404) setState({ kind: 'invalid' });
      else if (isApiError(err) && err.statusCode === 410) setState({ kind: 'gone', message: err.message });
      else setState({ kind: 'error', message: errorMessage(err) });
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  /** Runs a write; on success shows the refreshed view. 410 (withdrawn/expired meanwhile) switches to that state. */
  const run = async (kind: 'comment' | 'upload' | 'complete', fn: () => Promise<{ data: PublicActionView; message?: string }>) => {
    setBusy(kind);
    setActionError(null);
    try {
      const res = await fn();
      setState({ kind: 'ready', view: res.data });
      toast.success(res.message ?? 'Saved');
      return true;
    } catch (err) {
      if (isApiError(err) && err.statusCode === 410) setState({ kind: 'gone', message: err.message });
      else setActionError(errorMessage(err));
      return false;
    } finally {
      setBusy(null);
    }
  };

  const sendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return setCommentError('Write a comment.');
    setCommentError(undefined);
    if (await run('comment', () => publicActionService.comment(token, { body: comment.trim() }))) setComment('');
  };

  const upload = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!files[0]) errs.file = 'Choose a photo or document.';
    if (!fileDesc.trim()) errs.description = 'Say what it shows.';
    setFileErrors(errs);
    if (Object.keys(errs).length) return;
    if (await run('upload', () => publicActionService.uploadEvidence(token, { file: files[0]!, description: fileDesc.trim() }))) {
      setFiles([]);
      setFileDesc('');
    }
  };

  const complete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return setNoteError('Describe what was done and when.');
    setNoteError(undefined);
    if (await run('complete', () => publicActionService.complete(token, { note: note.trim() }))) setNote('');
  };

  const openFile = async (fileId: string) => {
    const tab = window.open('', '_blank');
    if (tab) tab.opener = null;
    setOpening(fileId);
    try {
      const { data } = await publicActionService.fileUrl(token, fileId);
      if (tab) tab.location.href = data.url;
    } catch (err) {
      tab?.close();
      toast.error('Could not open the file', errorMessage(err));
    } finally {
      setOpening(null);
    }
  };

  if (state.kind === 'loading') {
    return (
      <Chrome>
        <LoadingRegion label="Loading action" className="space-y-5">
          <Skeleton className="h-8 w-80 max-w-full" />
          <Skeleton className="h-4 w-56" />
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-56 rounded-xl" />
        </LoadingRegion>
      </Chrome>
    );
  }
  if (state.kind === 'invalid') {
    return (
      <Chrome>
        <StateCard icon={<LinkIcon />} title="Link not recognised">
          This link is not valid. Check you copied the whole address from the email.
        </StateCard>
      </Chrome>
    );
  }
  if (state.kind === 'gone') {
    return (
      <Chrome>
        <StateCard icon={<TimerOff />} title="This link no longer works">
          {state.message} If you still need it, contact the property manager who sent it.
        </StateCard>
      </Chrome>
    );
  }
  if (state.kind === 'error') {
    return (
      <Chrome>
        <div className="mx-auto mt-6 max-w-md">
          <Alert tone="error" title="Could not load the action" onRetry={load}>
            {state.message}
          </Alert>
        </div>
      </Chrome>
    );
  }

  const v = state.view;
  const closed = v.status === 'closed';
  const awaiting = v.status === 'awaiting_verification';
  const canAct = !closed && !awaiting;
  const lastReturn = [...v.history].reverse().find((h) => h.kind === 'returned' || h.kind === 'submitted');
  const returned = lastReturn?.kind === 'returned' && canAct;
  const uploadedCount = v.history.filter((h) => h.kind === 'evidence').length;
  const overdue = canAct && Date.parse(v.dueDate) < Date.now();

  return (
    <Chrome organisationName={v.organisationName}>
      <div className="space-y-5">
        {/* Header */}
        <section>
          <p className="text-meta font-semibold uppercase tracking-wide text-ink-muted">Action from {v.organisationName}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-surface px-2 py-0.5 text-meta font-bold text-ink-muted ring-1 ring-line">{v.reference}</span>
            <StatusPill kind="action" value={v.status} variant="dot" />
            <StatusPill kind="priority" value={v.priority} />
          </div>
          <h1 className="mt-2 text-2xl font-bold text-ink">{v.title}</h1>
          <p className="mt-1 flex items-start gap-1.5 text-sm text-ink-muted">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>
              <span className="font-semibold text-ink">{v.propertyName}</span> · {v.address}
            </span>
          </p>
          <p className={cn('mt-1 flex items-center gap-1.5 text-sm', overdue ? 'font-semibold text-danger-700' : 'text-ink-muted')}>
            <CalendarClock className="h-4 w-4" aria-hidden />
            Complete by {formatDate(v.dueDate)}
            {canAct && ` · ${formatRelativeDue(v.dueDate)}`}
          </p>
        </section>

        {closed && (
          <Alert tone="success" title="Verified and closed">
            Thank you, {v.contactName}. The property manager has verified the work and closed this action. Nothing else is needed.
          </Alert>
        )}
        {awaiting && (
          <Alert tone="info" title={v.awaitingReview ? 'Thank you, completion received' : 'Completion submitted'}>
            {v.awaitingReview
              ? 'The property manager will review it and verify the action, or come back to you if anything else is needed.'
              : 'Completion has been submitted and is waiting for the property manager to review it.'}{' '}
            You can still add a comment below.
          </Alert>
        )}
        {returned && lastReturn && (
          <Alert tone="warning" title="The property manager needs a little more">
            {lastReturn.body ?? 'Please add the missing information and confirm completion again.'}
          </Alert>
        )}

        {/* Details */}
        <Card className="space-y-4">
          {v.message && (
            <div className="rounded-xl bg-brand-50 p-3.5 text-sm text-ink">
              <p className="text-meta font-semibold text-brand-700">Message from {v.organisationName}</p>
              <p className="mt-1 whitespace-pre-line">{v.message}</p>
            </div>
          )}
          <div>
            <h2 className="text-meta font-semibold uppercase tracking-wide text-ink-muted">What needs doing</h2>
            <p className="mt-1 whitespace-pre-line text-sm text-ink">{v.description || v.title}</p>
          </div>
          <div>
            <h2 className="text-meta font-semibold uppercase tracking-wide text-ink-muted">Attachments</h2>
            {v.attachments.length === 0 ? (
              <p className="mt-1 text-sm text-ink-muted">No photos or documents attached.</p>
            ) : (
              <ul className="mt-2 divide-y divide-line rounded-xl border border-line bg-canvas">
                {v.attachments.map((a) => (
                  <li key={a._id} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                        <FileText className="h-4 w-4 shrink-0 text-brand-600" aria-hidden />
                        <span className="truncate">{a.name}</span>
                        <span className="shrink-0 text-meta font-normal text-ink-muted">{formatFileSize(a.sizeBytes)}</span>
                      </p>
                      {a.description && <p className="mt-0.5 text-sm text-ink-muted">{a.description}</p>}
                    </div>
                    <Button size="sm" variant="secondary" leftIcon={<ExternalLink className="h-3.5 w-3.5" />} isLoading={opening === a._id} onClick={() => openFile(a._id)}>
                      View
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        {actionError && (
          <Alert tone="error" title="That did not go through">
            {actionError}
          </Alert>
        )}

        {/* Evidence upload */}
        {canAct && v.allowEvidence && (
          <Card>
            <h2 className="text-base font-bold text-ink">Upload photos or documents</h2>
            <p className="mt-0.5 text-sm text-ink-muted">
              {v.evidenceRequired ? 'Required: add at least one photo or document showing the completed work.' : 'Optional: add a photo or document showing the completed work.'}
              {uploadedCount > 0 && ` You have uploaded ${uploadedCount}.`}
            </p>
            <form onSubmit={upload} noValidate className="mt-3 space-y-3">
              <FileDropzone
                label="Photo or document"
                accept=".pdf,.jpg,.jpeg,.png,.heic"
                files={files}
                onFilesChange={(f) => {
                  setFiles(f);
                  setFileErrors((e) => ({ ...e, file: '' }));
                }}
                error={fileErrors.file}
                hint="PDF, JPG, PNG or HEIC · up to 20 MB"
              />
              <Input label="What does it show?" required value={fileDesc} onChange={(e) => setFileDesc(e.target.value)} error={fileErrors.description} placeholder="e.g. All six emergency lights working after the test" />
              <Button type="submit" variant="secondary" leftIcon={<Upload className="h-4 w-4" />} isLoading={busy === 'upload'} disabled={!!busy && busy !== 'upload'}>
                Upload
              </Button>
            </form>
          </Card>
        )}

        {/* Confirm completion */}
        {canAct && (
          <Card>
            <h2 className="text-base font-bold text-ink">Confirm the work is complete</h2>
            <p className="mt-0.5 text-sm text-ink-muted">This goes to the property manager to review. You will see here when it is verified.</p>
            <form onSubmit={complete} noValidate className="mt-3 space-y-3">
              <Textarea
                label="Completion note"
                required
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                error={noteError}
                placeholder="e.g. Six batteries replaced and a 3-hour test passed on 27/11/2026."
              />
              {v.evidenceRequired && uploadedCount === 0 && (
                <p className="text-meta text-warn-700">Upload at least one photo or document above before confirming.</p>
              )}
              <Button type="submit" leftIcon={<CircleCheck className="h-4 w-4" />} isLoading={busy === 'complete'} disabled={(!!busy && busy !== 'complete') || (v.evidenceRequired && uploadedCount === 0)}>
                Confirm completion
              </Button>
            </form>
          </Card>
        )}

        {/* Comments + history */}
        <Card>
          <h2 className="text-base font-bold text-ink">Comments and history</h2>
          <ol className="mt-3 space-y-3">
            {v.history.map((h) => {
              const meta = HISTORY_META[h.kind];
              return (
                <li key={h._id} className="flex gap-3">
                  <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full [&>svg]:h-4 [&>svg]:w-4', meta.tone)} aria-hidden>
                    {meta.icon}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink">{meta.label}</p>
                    <p className="text-meta text-ink-muted">
                      {h.author} · {formatDateTime(h.at)}
                    </p>
                    {h.body && h.kind !== 'sent' && <p className="mt-0.5 whitespace-pre-line text-sm text-ink">{h.body}</p>}
                  </div>
                </li>
              );
            })}
          </ol>
          {!closed && (
            <form onSubmit={sendComment} noValidate className="mt-4 space-y-2 border-t border-line pt-4">
              <Textarea
                label="Add a comment"
                rows={2}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                error={commentError}
                placeholder="e.g. Parts ordered, attending Thursday morning."
              />
              <Button type="submit" variant="secondary" leftIcon={<MessageCircle className="h-4 w-4" />} isLoading={busy === 'comment'} disabled={!!busy && busy !== 'comment'}>
                Send comment
              </Button>
            </form>
          )}
          <p className="mt-4 text-meta text-ink-muted">Link valid until {formatDate(v.expiresAt)}.</p>
        </Card>
      </div>
    </Chrome>
  );
}
