import { affectsRag } from '@/lib/documents';
import { can, type Permission } from '@/lib/permissions';
import { forbidden, invalid } from '@/services/mock-adapter';
import type { AuditEvent, FileSummary, ReportSnapshotData } from '@/types/domain';
import { newId } from './time';
import { mockStore } from './store';
import type { MockDb } from './types';
import { mockFiles } from './files';

/** 403 unless the current demo user has the permission (mirrors the Express policy guards). */
export function requirePermission(permission: Permission) {
  if (!can(mockStore.actor().role, permission)) forbidden();
}

export function writeAudit(
  db: MockDb,
  action: AuditEvent['action'],
  entityType: AuditEvent['entityType'],
  entityId: string | undefined,
  summary: string,
  diff?: { before?: Record<string, unknown>; after?: Record<string, unknown> },
) {
  const actor = mockStore.actor();
  db.auditEvents.unshift({
    _id: newId('aud'),
    orgId: actor.orgId,
    actorId: actor._id,
    actorName: actor.name,
    actorRole: actor.role,
    action,
    entityType,
    entityId,
    summary,
    ...(diff?.before ? { before: diff.before } : {}),
    ...(diff?.after ? { after: diff.after } : {}),
    ip: '192.0.2.1',
    createdAt: new Date().toISOString(),
  });
}

export const actorRef = () => {
  const a = mockStore.actor();
  return { _id: a._id, name: a.name };
};

/** Upload allowlist (PRD §9): PDF/JPG/PNG/HEIC up to 20 MB. The backend checks magic bytes as well. */
export const UPLOAD_MAX_BYTES = 20 * 1024 * 1024;
export const UPLOAD_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/heic'];

export interface UploadLike {
  name: string;
  type: string;
  size: number;
}

export function acceptUpload(file: UploadLike | undefined, path = 'file'): FileSummary {
  if (!file) invalid('Choose a file to upload.', path);
  const type = file.type || (file.name.toLowerCase().endsWith('.heic') ? 'image/heic' : '');
  if (!UPLOAD_MIME_TYPES.includes(type)) invalid('Only PDF, JPG, PNG or HEIC files can be uploaded.', path);
  if (file.size > UPLOAD_MAX_BYTES) invalid('The file is larger than 20 MB.', path);
  const summary: FileSummary = { _id: newId('file'), name: file.name, mimeType: type, sizeBytes: file.size, scanStatus: 'clean' };
  if (typeof Blob !== 'undefined' && file instanceof Blob) mockFiles.put(summary._id, file);
  return summary;
}

export const includesText = (haystack: (string | undefined)[], needle?: string) => {
  if (!needle?.trim()) return true;
  const n = needle.trim().toLowerCase();
  return haystack.some((h) => h?.toLowerCase().includes(n));
};

export const REPORT_DISCLAIMER_V1 =
  'PLACEHOLDER DISCLAIMER (Q-011): This compliance snapshot reflects records held in Actovara at the exact date and time of generation. It is an operational management summary and does not constitute formal legal, regulatory, or statutory sign-off. Final legal compliance remains the responsibility of the duty holder.';

function formatAddress(a: { line1: string; line2?: string; city: string; postcode: string }) {
  return [a.line1, a.line2, a.city, a.postcode].filter(Boolean).join(', ');
}

/** Freezes the property's compliance register, current documents, and actions as at report generation time. */
export function buildReportSnapshot(db: MockDb, propertyId: string): ReportSnapshotData {
  const p = db.properties.find((x) => x._id === propertyId);
  if (!p) throw new Error(`Property ${propertyId} not found`);
  const manager = db.users.find((u) => u._id === p.managerId);
  const typeById = new Map(db.complianceTypes.map((t) => [t._id, t]));
  const certById = new Map(db.certificates.map((c) => [c._id, c]));
  const userById = new Map(db.users.map((u) => [u._id, u]));

  const reqs = db.requirements.filter((r) => r.propertyId === propertyId);
  const reqRows = reqs.map((r) => {
    const t = typeById.get(r.complianceTypeId);
    const cert = r.currentCertificateId ? certById.get(r.currentCertificateId) : undefined;
    return {
      _id: r._id,
      complianceTypeName: t?.name ?? 'Unknown type',
      category: t?.category ?? 'other',
      status: r.status,
      isApplicable: r.applicability === 'applicable',
      affectsRag: affectsRag(t),
      expiryDate: cert?.expiryDate,
      currentCertificateName: cert?.file.name,
      currentCertificateVersion: cert?.version,
    };
  });

  const certRows = db.certificates
    .filter((c) => c.propertyId === propertyId && c.isCurrent)
    .map((c) => ({
      _id: c._id,
      complianceTypeName: typeById.get(c.complianceTypeId)?.name ?? 'Unknown type',
      fileName: c.file.name,
      version: c.version,
      issueDate: c.issueDate,
      expiryDate: c.expiryDate,
      uploadedByName: c.uploadedBy.name,
    }));

  const propActions = db.actions.filter((a) => a.propertyId === propertyId);
  const actionRows = propActions.map((a) => {
    const evs = db.evidence.filter((e) => e.actionId === a._id).map((e) => `${e.file.name} (${e.status})`);
    return {
      _id: a._id,
      reference: a.reference,
      title: a.title,
      priority: a.priority,
      status: a.status,
      dueDate: a.dueDate,
      ownerName: userById.get(a.ownerId)?.name ?? 'Unassigned',
      evidenceRefs: evs,
      completionMethod: a.completion?.method,
      completionNote: a.completion?.note,
      completedByName: a.completion ? userById.get(a.completion.completedBy)?.name : undefined,
      closureSummary: a.closure?.summary,
      closedAt: a.closure?.verifiedAt,
    };
  });

  // Counts match the property RAG: document types stored without affecting RAG are listed but not counted.
  const countStatus = (s: string) => reqs.filter((r) => r.status === s && affectsRag(typeById.get(r.complianceTypeId))).length;
  return {
    organisation: {
      name: db.organisation.name,
      address: formatAddress(db.organisation.address),
      primaryContactEmail: db.organisation.email,
    },
    property: {
      _id: p._id,
      name: p.name,
      reference: p.reference,
      address: formatAddress(p.address),
      postcode: p.address.postcode,
      propertyType: p.type,
      managerName: manager?.name ?? 'Unassigned',
    },
    counts: {
      valid: countStatus('valid'),
      dueSoon: countStatus('due_soon'),
      overdue: countStatus('overdue'),
      missing: countStatus('missing'),
      notApplicable: countStatus('not_applicable'),
      storeOnly: countStatus('store_only'),
      openActions: propActions.filter((a) => a.status !== 'closed').length,
      closedActions: propActions.filter((a) => a.status === 'closed').length,
    },
    requirements: reqRows,
    certificates: certRows,
    actions: actionRows,
    disclaimerText: REPORT_DISCLAIMER_V1,
  };
}
