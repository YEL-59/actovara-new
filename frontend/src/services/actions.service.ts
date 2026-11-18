import { acceptUpload, actorRef, includesText, requirePermission, writeAudit, type UploadLike } from '@/mocks/helpers';
import { mockStore } from '@/mocks/store';
import { newId } from '@/mocks/time';
import type { MockDb } from '@/mocks/types';
import type { Action, ActionDetail, ActionStatus, ActionUpdate, ActionView, Evidence, Priority } from '@/types/domain';
import { http } from './api';
import { USE_MOCKS } from './config';
import { conflict, invalid, mockCall, notFound, paginate } from './mock-adapter';
import { assertActive } from './properties.service';

export interface ActionListQuery {
  propertyId?: string;
  status?: ActionStatus | 'not_closed';
  priority?: Priority;
  ownerId?: string;
  overdue?: boolean;
  search?: string;
  sort?: 'due' | 'priority' | 'created';
  page?: number;
  limit?: number;
}

export interface ActionInput {
  propertyId: string;
  certificateId?: string;
  title: string;
  description?: string;
  source: Action['source'];
  sourceRef?: string;
  priority: Priority;
  ownerId: string;
  dueDate: string;
}

const PRIORITY_ORDER: Record<Priority, number> = { urgent: 0, high: 1, medium: 2, low: 3 };

const view = (db: MockDb, a: Action): ActionView => ({
  ...a,
  propertyName: db.properties.find((p) => p._id === a.propertyId)?.name ?? '—',
  ownerName: db.users.find((u) => u._id === a.ownerId)?.name ?? '—',
});

const findAction = (db: MockDb, id: string) => db.actions.find((a) => a._id === id) ?? notFound('Action');

function log(db: MockDb, a: Action, type: ActionUpdate['type'], body?: string, fromStatus?: ActionStatus, toStatus?: ActionStatus) {
  const u: ActionUpdate = { _id: newId('upd'), actionId: a._id, author: actorRef(), type, body, fromStatus, toStatus, createdAt: new Date().toISOString() };
  db.actionUpdates.push(u);
  a.updatedAt = u.createdAt;
  return u;
}

function transition(db: MockDb, a: Action, to: ActionStatus, type: ActionUpdate['type'], body?: string) {
  const from = a.status;
  a.status = to;
  return log(db, a, type, body, from, to);
}

const write = <T,>(fn: (db: MockDb) => { data: T; message: string }) =>
  mockCall(() => mockStore.mutate((db) => ({ ...fn(db), statusCode: 200 })), { kind: 'write' });

export const actionsService = {
  list(q: ActionListQuery = {}) {
    if (!USE_MOCKS) return http.get<ActionView[]>('/actions', q);
    return mockCall(
      () => {
        const db = mockStore.get();
        const activeProps = new Set(db.properties.filter((p) => p.status === 'active').map((p) => p._id));
        const rows = db.actions
          .filter((a) => (q.propertyId ? a.propertyId === q.propertyId : activeProps.has(a.propertyId)))
          .filter((a) => !q.status || (q.status === 'not_closed' ? a.status !== 'closed' : a.status === q.status))
          .filter((a) => !q.priority || a.priority === q.priority)
          .filter((a) => !q.ownerId || a.ownerId === q.ownerId)
          .filter((a) => q.overdue === undefined || a.isOverdue === q.overdue)
          .map((a) => view(db, a))
          .filter((a) => includesText([a.reference, a.title, a.propertyName, a.ownerName, a.sourceRef], q.search))
          .sort((a, b) => {
            if (q.sort === 'priority') return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] || a.dueDate.localeCompare(b.dueDate);
            if (q.sort === 'created') return b.createdAt.localeCompare(a.createdAt);
            return a.dueDate.localeCompare(b.dueDate);
          });
        return paginate(rows, q.page, q.limit ?? 25);
      },
      { empty: () => [] },
    );
  },

  get(id: string) {
    if (!USE_MOCKS) return http.get<ActionDetail>(`/actions/${id}`);
    return mockCall<ActionDetail>(() => {
      const db = mockStore.get();
      const a = findAction(db, id);
      return {
        data: {
          action: view(db, a),
          updates: db.actionUpdates.filter((u) => u.actionId === id).sort((x, y) => x.createdAt.localeCompare(y.createdAt)),
          evidence: db.evidence.filter((e) => e.actionId === id),
        },
      };
    });
  },

  create(input: ActionInput) {
    if (!USE_MOCKS) return http.post<Action>('/actions', input);
    return mockCall(
      () =>
        mockStore.mutate((db) => {
          requirePermission('action.write');
          if (!input.title?.trim()) invalid('Enter a title.', 'title');
          if (!db.properties.some((p) => p._id === input.propertyId)) invalid('Choose a property.', 'propertyId');
          assertActive(db, input.propertyId);
          if (!db.users.some((u) => u._id === input.ownerId && u.status === 'active')) invalid('Choose an active owner.', 'ownerId');
          if (!input.dueDate) invalid('Choose a due date.', 'dueDate');
          db.counters.action += 1;
          const now = new Date().toISOString();
          const a: Action = {
            _id: newId('act'),
            reference: `ACT-${String(db.counters.action).padStart(4, '0')}`,
            propertyId: input.propertyId,
            certificateId: input.certificateId,
            title: input.title.trim(),
            description: input.description?.trim() || undefined,
            source: input.source,
            sourceRef: input.sourceRef?.trim() || undefined,
            priority: input.priority,
            ownerId: input.ownerId,
            dueDate: new Date(input.dueDate).toISOString(),
            status: 'open',
            isOverdue: false,
            reopenCount: 0,
            createdAt: now,
            updatedAt: now,
          };
          db.actions.push(a);
          log(db, a, 'created', a.sourceRef ? `Created from ${a.sourceRef}.` : 'Created manually.');
          writeAudit(db, 'create', 'action', a._id, `Created ${a.reference}: ${a.title}`);
          return { data: a, message: `${a.reference} created`, statusCode: 201 };
        }),
      { kind: 'write' },
    );
  },

  update(id: string, input: Partial<Pick<Action, 'title' | 'description' | 'priority' | 'ownerId' | 'dueDate'>> & { dueDateReason?: string }) {
    if (!USE_MOCKS) return http.patch<Action>(`/actions/${id}`, input);
    return write((db) => {
      requirePermission('action.write');
      const a = findAction(db, id);
      if (a.status === 'closed') conflict('A closed action cannot be edited. Reopen it first.');
      if (input.dueDate && new Date(input.dueDate).toISOString() !== a.dueDate) {
        if (!input.dueDateReason?.trim()) invalid('Give a reason for changing the due date.', 'dueDateReason');
        log(db, a, 'due_date_changed', input.dueDateReason!.trim());
        a.dueDate = new Date(input.dueDate).toISOString();
      }
      if (input.ownerId && input.ownerId !== a.ownerId) {
        const owner = db.users.find((u) => u._id === input.ownerId && u.status === 'active') ?? invalid('Choose an active owner.', 'ownerId');
        log(db, a, 'reassigned', `Reassigned to ${owner.name}.`);
        a.ownerId = owner._id;
      }
      if (input.title !== undefined) a.title = input.title.trim() || a.title;
      if (input.description !== undefined) a.description = input.description.trim() || undefined;
      if (input.priority) a.priority = input.priority;
      writeAudit(db, 'update', 'action', id, `Updated ${a.reference}`);
      return { data: a, message: 'Action updated' };
    });
  },

  /** Progress note; optionally moves an open action to in progress. */
  addUpdate(id: string, input: { body: string; status?: 'in_progress' }) {
    if (!USE_MOCKS) return http.post<ActionUpdate>(`/actions/${id}/updates`, input);
    return write((db) => {
      requirePermission('action.write');
      const a = findAction(db, id);
      if (a.status === 'closed') conflict('This action is closed.');
      if (!input.body?.trim()) invalid('Write an update.', 'body');
      const u =
        input.status === 'in_progress' && a.status === 'open'
          ? transition(db, a, 'in_progress', 'status_change', input.body.trim())
          : log(db, a, 'note', input.body.trim());
      writeAudit(db, 'update', 'action', id, `Progress update on ${a.reference}`);
      return { data: u, message: 'Update added' };
    });
  },

  addEvidence(id: string, input: { file: File | UploadLike; description: string }) {
    if (!USE_MOCKS) {
      const form = new FormData();
      form.append('file', input.file as Blob);
      form.append('description', input.description);
      return http.upload<Evidence>(`/actions/${id}/evidence`, form);
    }
    return write((db) => {
      requirePermission('action.write');
      const a = findAction(db, id);
      if (a.status === 'closed') conflict('This action is closed.');
      if (!input.description?.trim()) invalid('Describe what the evidence shows.', 'description');
      const ev: Evidence = {
        _id: newId('evd'),
        actionId: id,
        file: acceptUpload(input.file),
        description: input.description.trim(),
        status: 'submitted',
        uploadedBy: actorRef(),
        createdAt: new Date().toISOString(),
      };
      db.evidence.push(ev);
      log(db, a, 'evidence_added', ev.description);
      writeAudit(db, 'create', 'action', id, `Evidence added to ${a.reference}: ${ev.file.name}`);
      return { data: ev, message: 'Evidence uploaded' };
    });
  },

  requestVerification(id: string, input: { note?: string } = {}) {
    if (!USE_MOCKS) return http.post<Action>(`/actions/${id}/request-verification`, input);
    return write((db) => {
      requirePermission('action.write');
      const a = findAction(db, id);
      if (a.status === 'closed' || a.status === 'awaiting_verification') conflict('This action is not in progress.');
      if (!db.evidence.some((e) => e.actionId === id && e.status !== 'rejected')) conflict('Upload at least one piece of evidence first.');
      transition(db, a, 'awaiting_verification', 'verification_requested', input.note?.trim() || 'Ready for verification.');
      writeAudit(db, 'update', 'action', id, `Verification requested for ${a.reference}`);
      return { data: a, message: 'Sent for verification' };
    });
  },

  verify(id: string, input: { decision: 'accept' | 'request_more'; summary?: string; reason?: string; acceptedEvidenceIds: string[] }) {
    if (!USE_MOCKS) return http.post<Action>(`/actions/${id}/verify`, input);
    return write((db) => {
      requirePermission('action.verify');
      const a = findAction(db, id);
      if (a.status !== 'awaiting_verification') conflict('Only actions awaiting verification can be verified.');
      const actor = mockStore.actor();
      const items = db.evidence.filter((e) => e.actionId === id);
      const now = new Date().toISOString();
      if (input.decision === 'accept') {
        if (!input.summary?.trim()) invalid('Write a closure summary.', 'summary');
        const accepted = items.filter((e) => input.acceptedEvidenceIds.includes(e._id));
        if (!accepted.length) invalid('Accept at least one piece of evidence.', 'acceptedEvidenceIds');
        items.forEach((e) => Object.assign(e, { status: accepted.includes(e) ? 'accepted' : 'rejected', reviewedBy: actorRef(), reviewedAt: now }));
        a.closure = { verifiedBy: actor._id, verifiedAt: now, summary: input.summary!.trim() };
        transition(db, a, 'closed', 'verified', input.summary!.trim());
        writeAudit(db, 'verify', 'action', id, `Verified and closed ${a.reference}`);
        return { data: a, message: `${a.reference} closed` };
      }
      if (!input.reason?.trim()) invalid('Say what further evidence is needed.', 'reason');
      transition(db, a, 'in_progress', 'more_evidence_requested', input.reason!.trim());
      writeAudit(db, 'update', 'action', id, `More evidence requested for ${a.reference}`);
      return { data: a, message: 'Returned to the owner for more evidence' };
    });
  },

  reopen(id: string, input: { reason: string }) {
    if (!USE_MOCKS) return http.post<Action>(`/actions/${id}/reopen`, input);
    return write((db) => {
      requirePermission('action.verify');
      const a = findAction(db, id);
      if (a.status !== 'closed') conflict('Only closed actions can be reopened.');
      if (!input.reason?.trim()) invalid('Give a reason for reopening.', 'reason');
      a.closure = undefined;
      a.reopenCount += 1;
      transition(db, a, 'in_progress', 'reopened', input.reason.trim());
      writeAudit(db, 'reopen', 'action', id, `Reopened ${a.reference}: ${input.reason.trim()}`);
      return { data: a, message: `${a.reference} reopened` };
    });
  },
};
