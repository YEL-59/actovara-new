'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  CircleDot,
  FileCheck2,
  FilePlus2,
  FileText,
  Hourglass,
  MessageSquarePlus,
  RotateCcw,
  Send,
  ShieldCheck,
  TriangleAlert,
  UserCheck,
} from 'lucide-react';
import {
  ActionDetailSkeleton,
  DueDateModal,
  ProgressNoteModal,
  ReassignOwnerModal,
  ReopenActionModal,
  RequestVerificationModal,
  UploadEvidenceModal,
  VerifyActionModal,
} from '@/components/actions';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  StatusPill,
  Timeline,
  type TimelineItem,
} from '@/components/ui';
import { useApi } from '@/lib/hooks/useApi';
import { formatDate, formatDateTime, formatFileSize, formatRelativeDue } from '@/lib/format';
import { useSession } from '@/lib/session-mock';
import { actionStatusMeta, type Tone } from '@/lib/status';
import { cn } from '@/lib/utils';
import { actionsService } from '@/services';
import type { ActionUpdate, ActionUpdateType, Evidence } from '@/types/domain';

type DialogKind = 'note' | 'evidence' | 'request_verify' | 'verify' | 'reopen' | 'due_date' | 'reassign' | null;

const UPDATE_META: Record<ActionUpdateType, { label: string; tone: Tone; icon: React.ReactNode }> = {
  created: { label: 'Created', tone: 'info', icon: <CircleDot /> },
  note: { label: 'Progress note', tone: 'neutral', icon: <MessageSquarePlus /> },
  status_change: { label: 'Status changed', tone: 'purple', icon: <CircleDot /> },
  evidence_added: { label: 'Evidence uploaded', tone: 'info', icon: <FilePlus2 /> },
  verification_requested: { label: 'Verification requested', tone: 'warn', icon: <Hourglass /> },
  more_evidence_requested: { label: 'More evidence requested', tone: 'warn', icon: <RotateCcw /> },
  verified: { label: 'Verified & closed', tone: 'ok', icon: <ShieldCheck /> },
  reopened: { label: 'Reopened', tone: 'danger', icon: <RotateCcw /> },
  due_date_changed: { label: 'Due date changed', tone: 'neutral', icon: <CalendarClock /> },
  reassigned: { label: 'Reassigned', tone: 'neutral', icon: <UserCheck /> },
};

const EVIDENCE_STATUS: Record<Evidence['status'], { label: string; tone: Tone }> = {
  submitted: { label: 'Submitted', tone: 'info' },
  accepted: { label: 'Accepted', tone: 'ok' },
  rejected: { label: 'Rejected', tone: 'danger' },
};

function updateTitle(u: ActionUpdate): React.ReactNode {
  const meta = UPDATE_META[u.type];
  if (u.fromStatus && u.toStatus) {
    return (
      <span>
        {meta.label}: <span className="text-ink-muted">{actionStatusMeta[u.fromStatus].label}</span> →{' '}
        <span>{actionStatusMeta[u.toStatus].label}</span>
      </span>
    );
  }
  return meta.label;
}

export default function ActionDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';
  const { can, switchRole } = useSession();
  const canWrite = can('action.write');
  const canVerify = can('action.verify');

  const [dialog, setDialog] = useState<DialogKind>(null);

  const detail = useApi(() => actionsService.get(id), [id]);
  if (detail.loading && !detail.data) {
    return <ActionDetailSkeleton />;
  }

  if (detail.error) {
    return (
      <div className="space-y-4">
        <Link href="/actions" className="focus-ring inline-flex items-center gap-1.5 rounded text-sm font-semibold text-brand-600 hover:underline">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to actions
        </Link>
        <Alert tone="error" title="Could not load action" onRetry={detail.reload}>
          {detail.error}
        </Alert>
      </div>
    );
  }

  if (!detail.data) {
    return (
      <div className="space-y-4">
        <Link href="/actions" className="focus-ring inline-flex items-center gap-1.5 rounded text-sm font-semibold text-brand-600 hover:underline">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to actions
        </Link>
        <EmptyState
          icon={<CircleDot />}
          title="Action not found"
          description="This action may have been removed or you may not have access to it."
          action={
            <Link href="/actions" className="focus-ring inline-flex h-10 items-center rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700">
              Return to actions
            </Link>
          }
        />
      </div>
    );
  }

  const { action, updates, evidence } = detail.data;
  const isClosed = action.status === 'closed';
  const validEvidence = evidence.filter((e) => e.status !== 'rejected');
  const canRequestVerification = canWrite && (action.status === 'open' || action.status === 'in_progress');
  const verifiedByName = action.verifiedByName ?? 'Org Admin';

  const timelineItems: TimelineItem[] = updates.map((u) => {
    const meta = UPDATE_META[u.type];
    return {
      id: u._id,
      title: updateTitle(u),
      meta: `${u.author.name} · ${formatDateTime(u.createdAt)}`,
      body: u.body,
      icon: meta.icon,
      tone: meta.tone,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <Link href="/actions" className="focus-ring inline-flex items-center gap-1.5 rounded text-sm font-semibold text-brand-600 hover:underline">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          All actions
        </Link>
      </div>

      {/* Header card */}
      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-canvas px-2 py-0.5 text-meta font-bold text-ink-muted">{action.reference}</span>
              <StatusPill kind="action" value={action.status} size="md" variant="dot" />
              <StatusPill kind="priority" value={action.priority} size="md" />
              {action.isOverdue && !isClosed && (
                <Badge tone="danger" dot>
                  Overdue
                </Badge>
              )}
              {action.reopenCount > 0 && (
                <Badge tone="warn">
                  Reopened {action.reopenCount}×
                </Badge>
              )}
            </div>
            <h1 className="text-2xl font-bold text-ink">{action.title}</h1>
            <p className="text-sm text-ink-muted">
              Property:{' '}
              <Link href={`/properties/${action.propertyId}`} className="focus-ring rounded font-semibold text-brand-600 hover:underline">
                {action.propertyName}
              </Link>
              {' · '}Owner: <span className="font-medium text-ink">{action.ownerName}</span>
            </p>
          </div>
          <div className="shrink-0 rounded-xl border border-line bg-canvas px-4 py-3 text-left sm:text-right">
            <p className="text-meta font-semibold uppercase tracking-wide text-ink-muted">Due date</p>
            <p className={cn('mt-0.5 text-base font-bold', action.isOverdue && !isClosed ? 'text-danger-700' : 'text-ink')}>
              {formatDate(action.dueDate)}
            </p>
            <p className={cn('text-meta', action.isOverdue && !isClosed ? 'text-danger-700' : 'text-ink-muted')}>
              {isClosed ? 'Completed' : formatRelativeDue(action.dueDate)}
            </p>
          </div>
        </div>
      </Card>

      {/* Closed action read-only closure summary */}
      {isClosed && action.closure && (
        <Alert tone="success" title={`Verified & closed by ${verifiedByName} on ${formatDateTime(action.closure.verifiedAt)}`}>
          <p className="mt-1 text-ink">{action.closure.summary}</p>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main column: Details, Evidence, Timeline */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Action details" />
            <dl className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <dt className="text-meta font-semibold uppercase tracking-wide text-ink-muted">Description</dt>
                <dd className="mt-1 whitespace-pre-line text-sm text-ink">
                  {action.description || <span className="text-ink-muted">No description provided.</span>}
                </dd>
              </div>
              <div>
                <dt className="text-meta font-semibold uppercase tracking-wide text-ink-muted">Source</dt>
                <dd className="mt-1 text-sm font-medium text-ink">
                  {action.source === 'report_finding' ? 'Report finding' : 'Manual'}
                  {action.sourceRef ? ` · ${action.sourceRef}` : ''}
                </dd>
              </div>
              <div>
                <dt className="text-meta font-semibold uppercase tracking-wide text-ink-muted">Linked certificate</dt>
                <dd className="mt-1 text-sm">
                  {action.certificateId ? (
                    <Link
                      href={`/certificates?propertyId=${action.propertyId}`}
                      className="focus-ring inline-flex items-center gap-1.5 rounded font-semibold text-brand-600 hover:underline"
                    >
                      <FileText className="h-4 w-4" aria-hidden />
                      View property certificates
                    </Link>
                  ) : (
                    <span className="text-ink-muted">None</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-meta font-semibold uppercase tracking-wide text-ink-muted">Created</dt>
                <dd className="mt-1 text-sm text-ink">{formatDateTime(action.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-meta font-semibold uppercase tracking-wide text-ink-muted">Last updated</dt>
                <dd className="mt-1 text-sm text-ink">{formatDateTime(action.updatedAt)}</dd>
              </div>
            </dl>
          </Card>

          {/* Evidence panel */}
          <Card>
            <CardHeader
              title="Evidence"
              description="Supporting photos, contractor sign-offs, or test records"
              actions={
                canWrite && !isClosed ? (
                  <Button size="sm" variant="secondary" leftIcon={<FilePlus2 className="h-4 w-4" />} onClick={() => setDialog('evidence')}>
                    Upload evidence
                  </Button>
                ) : undefined
              }
            />
            {evidence.length === 0 ? (
              <EmptyState
                icon={<FileCheck2 />}
                title="No evidence uploaded yet"
                description={
                  isClosed
                    ? 'No evidence files were attached to this action.'
                    : 'Upload at least one file before requesting verification.'
                }
                action={
                  canWrite && !isClosed ? (
                    <Button size="sm" leftIcon={<FilePlus2 className="h-4 w-4" />} onClick={() => setDialog('evidence')}>
                      Upload evidence
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <ul className="divide-y divide-line rounded-xl border border-line bg-canvas">
                {evidence.map((ev) => {
                  const st = EVIDENCE_STATUS[ev.status];
                  return (
                    <li key={ev._id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <FileText className="h-4 w-4 shrink-0 text-brand-600" aria-hidden />
                          <span className="truncate text-sm font-semibold text-ink">{ev.file.name}</span>
                          <span className="text-meta text-ink-muted">{formatFileSize(ev.file.sizeBytes)}</span>
                        </div>
                        <p className="text-sm text-ink">{ev.description}</p>
                        <p className="text-meta text-ink-muted">
                          Uploaded by {ev.uploadedBy.name} · {formatDateTime(ev.createdAt)}
                        </p>
                      </div>
                      <Badge tone={st.tone} dot className="self-start">
                        {st.label}
                      </Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          {/* Activity timeline */}
          <Card>
            <CardHeader title="Activity timeline" description="Full audit trail of notes, evidence, and status transitions" />
            {timelineItems.length === 0 ? (
              <p className="text-sm text-ink-muted">No updates recorded yet.</p>
            ) : (
              <Timeline items={timelineItems} />
            )}
          </Card>
        </div>

        {/* Side panel: Allowed transitions only */}
        <aside className="space-y-4">
          <Card>
            <CardHeader title="Actions & transitions" description="Available steps for the current status" />
            <div className="space-y-3">
              {isClosed ? (
                <>
                  <div className="flex items-start gap-2.5 rounded-xl border border-ok-100 bg-ok-50 p-3 text-sm text-ok-700">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                    <span>This action is closed and read-only.</span>
                  </div>
                  {canVerify ? (
                    <Button
                      variant="secondary"
                      className="w-full"
                      leftIcon={<RotateCcw className="h-4 w-4" />}
                      onClick={() => setDialog('reopen')}
                    >
                      Reopen action
                    </Button>
                  ) : (
                    <p className="text-meta text-ink-muted">Only an Org Admin can reopen a closed action.</p>
                  )}
                </>
              ) : (
                <>
                  {action.status === 'awaiting_verification' && (
                    canVerify ? (
                      <Button
                        className="w-full"
                        leftIcon={<ShieldCheck className="h-4 w-4" />}
                        onClick={() => setDialog('verify')}
                      >
                        Review evidence &amp; close
                      </Button>
                    ) : (
                      <Alert tone="warning" title="Awaiting verification">
                        An Org Admin must review the evidence, then verify and close this action or request more evidence.
                        <button
                          type="button"
                          onClick={() => switchRole('org_admin')}
                          className="focus-ring mt-2 block rounded text-sm font-semibold text-brand-600 hover:underline"
                        >
                          Demo: switch to the Org Admin role to verify
                        </button>
                      </Alert>
                    )
                  )}

                  {canRequestVerification && (
                    <div className="space-y-1.5">
                      <Button
                        className="w-full"
                        leftIcon={<Send className="h-4 w-4" />}
                        disabled={validEvidence.length === 0}
                        onClick={() => setDialog('request_verify')}
                      >
                        Request verification
                      </Button>
                      {validEvidence.length === 0 && (
                        <p className="flex items-start gap-1.5 text-meta text-ink-muted">
                          <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warn-600" aria-hidden />
                          Upload at least one piece of evidence first.
                        </p>
                      )}
                    </div>
                  )}

                  {canWrite && (
                    <>
                      <Button
                        variant="secondary"
                        className="w-full"
                        leftIcon={<MessageSquarePlus className="h-4 w-4" />}
                        onClick={() => setDialog('note')}
                      >
                        Add progress note
                      </Button>
                      <Button
                        variant="secondary"
                        className="w-full"
                        leftIcon={<FilePlus2 className="h-4 w-4" />}
                        onClick={() => setDialog('evidence')}
                      >
                        Upload evidence
                      </Button>
                      <div className="border-t border-line pt-3 space-y-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start"
                          leftIcon={<CalendarClock className="h-4 w-4" />}
                          onClick={() => setDialog('due_date')}
                        >
                          Change due date
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start"
                          leftIcon={<UserCheck className="h-4 w-4" />}
                          onClick={() => setDialog('reassign')}
                        >
                          Reassign owner
                        </Button>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </Card>
        </aside>
      </div>

      {/* Lifecycle dialogs */}
      <ProgressNoteModal open={dialog === 'note'} action={action} onClose={() => setDialog(null)} onDone={detail.reload} />
      <UploadEvidenceModal open={dialog === 'evidence'} action={action} onClose={() => setDialog(null)} onDone={detail.reload} />
      <RequestVerificationModal
        open={dialog === 'request_verify'}
        action={action}
        evidenceCount={validEvidence.length}
        onClose={() => setDialog(null)}
        onDone={detail.reload}
      />
      <VerifyActionModal
        open={dialog === 'verify'}
        action={action}
        evidence={evidence}
        onClose={() => setDialog(null)}
        onDone={detail.reload}
      />
      <ReopenActionModal open={dialog === 'reopen'} action={action} onClose={() => setDialog(null)} onDone={detail.reload} />
      <DueDateModal open={dialog === 'due_date'} action={action} onClose={() => setDialog(null)} onDone={detail.reload} />
      <ReassignOwnerModal open={dialog === 'reassign'} action={action} onClose={() => setDialog(null)} onDone={detail.reload} />
    </div>
  );
}
