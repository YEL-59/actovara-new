/**
 * External action links: send one corrective action by email to someone without an Actovara account
 * (contractor, facilities manager, landlord, tenant, resident). The email holds a secure link; the
 * contact can view the action, comment, upload evidence (if allowed) and confirm completion. Their
 * submission returns to Actovara for Org Admin verification, with everything kept on the action timeline.
 *
 * Same security model as landlord share links: random 32-byte token, only a hash stored, expiry,
 * revocation, access count. Backend contract: docs/08-api-contract.md §2.8.
 */
import { hashPassword } from '@/mocks/auth';
import { acceptUpload, actorRef, requirePermission, writeAudit, type UploadLike } from '@/mocks/helpers';
import { mockStore } from '@/mocks/store';
import { newId } from '@/mocks/time';
import type { MockDb } from '@/mocks/types';
import type { Action, ActionLink, Evidence, ExternalContactRole, PublicActionView, SignedFileUrl } from '@/types/domain';
import { http } from './api';
import { logActionUpdate, mockFileUrl, transitionAction } from './actions.service';
import { USE_MOCKS } from './config';
import { ApiError } from './errors';
import { conflict, invalid, mockCall, notFound } from './mock-adapter';

export const EXTERNAL_ROLE_LABEL: Record<ExternalContactRole, string> = {
  contractor: 'Contractor',
  facilities_manager: 'Facilities manager',
  landlord: 'Landlord',
  tenant: 'Tenant',
  resident: 'Resident',
  other: 'External contact',
};

export const ACTION_LINK_DAY_OPTIONS = [7, 14, 30, 60];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface SendActionLinkInput {
  name: string;
  email: string;
  role: ExternalContactRole;
  company?: string;
  message?: string;
  /** Link lifetime in days (1–90). */
  days: number;
  allowEvidence: boolean;
}

/** "Mark Ellis (Contractor, Northfield Electrical)" — how the contact appears on the timeline. */
export const externalAuthorName = (l: Pick<ActionLink, 'contact'>) =>
  `${l.contact.name} (${[EXTERNAL_ROLE_LABEL[l.contact.role], l.contact.company].filter(Boolean).join(', ')})`;

const linkStatus = (l: ActionLink): 'active' | 'expired' | 'revoked' =>
  l.revokedAt ? 'revoked' : Date.parse(l.expiresAt) <= Date.now() ? 'expired' : 'active';
export { linkStatus as actionLinkStatus };

function randomToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/* ---------------------------- Internal (signed in) ---------------------------- */
export const actionLinksService = {
  list(actionId: string) {
    if (!USE_MOCKS) return http.get<ActionLink[]>(`/actions/${actionId}/external-links`);
    return mockCall(
      () => ({ data: mockStore.get().actionLinks.filter((l) => l.actionId === actionId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)) }),
      { empty: () => [] },
    );
  },

  /** Emails a secure link to the contact. The URL is returned once (for copying); afterwards only `tokenHint` is kept. */
  send(actionId: string, input: SendActionLinkInput) {
    if (!USE_MOCKS) return http.post<{ link: ActionLink; url: string }>(`/actions/${actionId}/external-links`, input);
    return mockCall(
      () =>
        mockStore.mutate((db) => {
          requirePermission('action.write');
          const a = db.actions.find((x) => x._id === actionId) ?? notFound('Action');
          if (a.status === 'closed') conflict('A closed action cannot be sent. Reopen it first.');
          if (!input.name?.trim()) invalid('Enter the contact’s name.', 'name');
          if (!EMAIL_RE.test(input.email?.trim() ?? '')) invalid('Enter a valid email address.', 'email');
          if (!Number.isFinite(input.days) || input.days < 1 || input.days > 90) invalid('Choose how long the link stays valid (1–90 days).', 'days');
          const token = randomToken();
          const now = new Date();
          const link: ActionLink = {
            _id: newId('alk'),
            actionId,
            contact: { name: input.name.trim(), email: input.email.trim().toLowerCase(), role: input.role, company: input.company?.trim() || undefined },
            message: input.message?.trim() || undefined,
            // Evidence-required actions always let the contact upload.
            allowEvidence: input.allowEvidence || a.evidenceRequired,
            tokenHint: token.slice(-6),
            expiresAt: new Date(now.getTime() + input.days * 86_400_000).toISOString(),
            createdBy: actorRef(),
            createdAt: now.toISOString(),
            emailStatus: 'sent',
            accessCount: 0,
          };
          db.actionLinks.push(link);
          db.actionLinkSecrets.push({ actionLinkId: link._id, tokenHash: hashPassword(token) });
          db.notifications.push({
            _id: newId('ntf'),
            recipientEmail: link.contact.email,
            type: 'action_external',
            subject: `Action ${a.reference} from ${db.organisation.name}: ${a.title}`,
            entityType: 'action',
            entityId: a._id,
            status: 'sent',
            sentAt: link.createdAt,
            createdAt: link.createdAt,
          });
          const who = externalAuthorName(link);
          logActionUpdate(db, a, 'sent_to_contact', `Sent by email to ${who} at ${link.contact.email}.${link.message ? ` Message: ${link.message}` : ''}`);
          writeAudit(db, 'share', 'action', a._id, `Sent ${a.reference} to external contact ${who} <${link.contact.email}>`);
          const origin = typeof window !== 'undefined' ? window.location.origin : '';
          return { data: { link, url: `${origin}/action-link/${token}` }, message: `Email sent to ${link.contact.name}`, statusCode: 201 };
        }),
      { kind: 'write' },
    );
  },

  revoke(linkId: string) {
    if (!USE_MOCKS) return http.post<ActionLink>(`/external-links/${linkId}/revoke`);
    return mockCall(
      () =>
        mockStore.mutate((db) => {
          requirePermission('action.write');
          const l = db.actionLinks.find((x) => x._id === linkId) ?? notFound('Link');
          if (l.revokedAt) conflict('This link is already withdrawn.');
          l.revokedAt = new Date().toISOString();
          l.revokedBy = actorRef();
          const a = db.actions.find((x) => x._id === l.actionId);
          if (a) logActionUpdate(db, a, 'external_link_revoked', `Link for ${externalAuthorName(l)} withdrawn.`);
          writeAudit(db, 'revoke', 'action', l.actionId, `Withdrew the external link for ${l.contact.name}`);
          return { data: l, message: 'Link withdrawn', statusCode: 200 };
        }),
      { kind: 'write' },
    );
  },
};

/* --------------------------- Public (secure link) --------------------------- */
const gone = (message: string) => new ApiError(410, message);

/** Finds the link + action for a token, or throws 404 (unknown) / 410 (withdrawn, expired, unavailable). */
function resolve(db: MockDb, token: string): { link: ActionLink; action: Action } {
  const secret = db.actionLinkSecrets.find((s) => s.tokenHash === hashPassword(token));
  const link = secret && db.actionLinks.find((l) => l._id === secret.actionLinkId);
  if (!link) throw new ApiError(404, 'This link is not valid. Check you copied the whole address from the email.');
  if (link.revokedAt) throw gone('The property manager has withdrawn this link.');
  if (Date.parse(link.expiresAt) <= Date.now()) throw gone('This link has expired. Ask the property manager to send a new one.');
  const action = db.actions.find((a) => a._id === link.actionId);
  const property = action && db.properties.find((p) => p._id === action.propertyId);
  if (!action || !property || property.status === 'archived') throw gone('This action is no longer available.');
  return { link, action };
}

const externalRef = (l: ActionLink) => ({ _id: l._id, name: externalAuthorName(l) });
const auditAs = (l: ActionLink) => ({ id: l._id, name: externalAuthorName(l) });

function buildView(db: MockDb, link: ActionLink, a: Action): PublicActionView {
  const p = db.properties.find((x) => x._id === a.propertyId)!;
  const updates = db.actionUpdates.filter((u) => u.actionId === a._id).sort((x, y) => x.createdAt.localeCompare(y.createdAt));
  const sentAt = link.createdAt;
  const history: PublicActionView['history'] = [
    { _id: `sent_${link._id}`, at: sentAt, author: link.createdBy.name, kind: 'sent', body: link.message },
  ];
  let submitted = false;
  for (const u of updates) {
    if (u.createdAt < sentAt) continue;
    const mine = u.external && u.author._id === link._id;
    if (mine && u.type === 'external_comment') history.push({ _id: u._id, at: u.createdAt, author: 'You', kind: 'comment', body: u.body });
    else if (mine && u.type === 'evidence_added') history.push({ _id: u._id, at: u.createdAt, author: 'You', kind: 'evidence', body: u.body });
    else if (mine && u.type === 'verification_requested') {
      submitted = true;
      history.push({ _id: u._id, at: u.createdAt, author: 'You', kind: 'submitted', body: u.body });
    }
    // The property manager's reply to this contact's own submission.
    else if (submitted && u.type === 'more_evidence_requested') {
      submitted = false;
      history.push({ _id: u._id, at: u.createdAt, author: db.organisation.name, kind: 'returned', body: u.body });
    } else if (u.type === 'verified') history.push({ _id: u._id, at: u.createdAt, author: db.organisation.name, kind: 'closed' });
  }
  return {
    organisationName: db.organisation.name,
    propertyName: p.name,
    address: [p.address.line1, p.address.line2, p.address.city, p.address.postcode].filter(Boolean).join(', '),
    reference: a.reference,
    title: a.title,
    description: a.description,
    priority: a.priority,
    dueDate: a.dueDate,
    status: a.status,
    message: link.message,
    contactName: link.contact.name,
    allowEvidence: link.allowEvidence,
    evidenceRequired: a.evidenceRequired,
    expiresAt: link.expiresAt,
    attachments: (a.attachments ?? []).map((x) => ({ _id: x.file._id, name: x.file.name, mimeType: x.file.mimeType, sizeBytes: x.file.sizeBytes, description: x.description })),
    history,
    awaitingReview: a.status === 'awaiting_verification' && a.completion?.completedBy === link._id,
  };
}

/** Rejects input once the action is closed or already submitted for review. */
function assertOpenForInput(a: Action) {
  if (a.status === 'closed') conflict('This action has been verified and closed. No further changes are needed.');
  if (a.status === 'awaiting_verification') conflict('Completion has already been submitted and is waiting for the property manager to review it.');
}

export const publicActionService = {
  view(token: string) {
    if (!USE_MOCKS) return http.get<PublicActionView>(`/public/action-links/${encodeURIComponent(token)}`);
    return mockCall<PublicActionView>(() =>
      mockStore.mutate((db) => {
        const { link, action } = resolve(db, token);
        link.accessCount += 1;
        link.lastAccessedAt = new Date().toISOString();
        return { data: buildView(db, link, action) };
      }),
    );
  },

  comment(token: string, input: { body: string }) {
    if (!USE_MOCKS) return http.post<PublicActionView>(`/public/action-links/${encodeURIComponent(token)}/comments`, input);
    return mockCall(
      () =>
        mockStore.mutate((db) => {
          const { link, action } = resolve(db, token);
          if (action.status === 'closed') conflict('This action has been verified and closed.');
          if (!input.body?.trim()) invalid('Write a comment.', 'body');
          logActionUpdate(db, action, 'external_comment', input.body.trim(), undefined, undefined, { author: externalRef(link), external: true });
          writeAudit(db, 'update', 'action', action._id, `External comment on ${action.reference}`, undefined, auditAs(link));
          return { data: buildView(db, link, action), message: 'Comment sent' };
        }),
      { kind: 'write' },
    );
  },

  uploadEvidence(token: string, input: { file: File | UploadLike; description: string }) {
    if (!USE_MOCKS) {
      const form = new FormData();
      form.append('file', input.file as Blob);
      form.append('description', input.description);
      return http.upload<PublicActionView>(`/public/action-links/${encodeURIComponent(token)}/evidence`, form);
    }
    return mockCall(
      () =>
        mockStore.mutate((db) => {
          const { link, action } = resolve(db, token);
          if (!link.allowEvidence) conflict('Uploads are not enabled for this link.');
          assertOpenForInput(action);
          if (!input.description?.trim()) invalid('Describe what the photo or document shows.', 'description');
          const ev: Evidence = {
            _id: newId('evd'),
            actionId: action._id,
            file: acceptUpload(input.file),
            description: input.description.trim(),
            status: 'submitted',
            uploadedBy: externalRef(link),
            external: true,
            createdAt: new Date().toISOString(),
          };
          db.evidence.push(ev);
          logActionUpdate(db, action, 'evidence_added', ev.description, undefined, undefined, { author: externalRef(link), external: true });
          writeAudit(db, 'create', 'action', action._id, `External evidence added to ${action.reference}: ${ev.file.name}`, undefined, auditAs(link));
          return { data: buildView(db, link, action), message: 'File uploaded' };
        }),
      { kind: 'write' },
    );
  },

  /** Confirms completion; the action moves to awaiting verification for the Org Admin. */
  complete(token: string, input: { note: string }) {
    if (!USE_MOCKS) return http.post<PublicActionView>(`/public/action-links/${encodeURIComponent(token)}/complete`, input);
    return mockCall(
      () =>
        mockStore.mutate((db) => {
          const { link, action } = resolve(db, token);
          assertOpenForInput(action);
          if (!input.note?.trim()) invalid('Describe what was done and when.', 'note');
          const hasEvidence = db.evidence.some((e) => e.actionId === action._id && e.status !== 'rejected');
          if (action.evidenceRequired && !hasEvidence) conflict('This action needs a photo or document. Upload at least one before confirming completion.');
          const mineEvidence = db.evidence.some((e) => e.actionId === action._id && e.status !== 'rejected' && e.uploadedBy._id === link._id);
          const method = mineEvidence || action.evidenceRequired ? 'evidence' : 'confirmation';
          const name = externalAuthorName(link);
          action.completion = { method, note: input.note.trim(), completedBy: link._id, completedAt: new Date().toISOString(), externalContact: name };
          transitionAction(db, action, 'awaiting_verification', 'verification_requested', input.note.trim(), {
            author: externalRef(link),
            external: true,
            completionMethod: method,
          });
          writeAudit(db, 'update', 'action', action._id, `${name} confirmed completion of ${action.reference} by secure link`, undefined, auditAs(link));
          return { data: buildView(db, link, action), message: 'Thank you. Completion sent for review.' };
        }),
      { kind: 'write' },
    );
  },

  /** Opens an attachment the property manager added to the action. */
  fileUrl(token: string, fileId: string) {
    if (!USE_MOCKS) return http.get<SignedFileUrl>(`/public/action-links/${encodeURIComponent(token)}/files/${fileId}`);
    return mockCall<SignedFileUrl>(() => {
      const db = mockStore.get();
      const { action } = resolve(db, token);
      const file = action.attachments?.find((x) => x.file._id === fileId)?.file ?? notFound('File');
      return { data: mockFileUrl(file, `${action.reference} · ${action.title}`) };
    });
  },
};
