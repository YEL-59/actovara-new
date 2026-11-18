import { acceptUpload, actorRef, includesText, requirePermission, writeAudit, type UploadLike } from '@/mocks/helpers';
import { mockFiles } from '@/mocks/files';
import { mockStore } from '@/mocks/store';
import { addMonths, newId } from '@/mocks/time';
import type { MockDb } from '@/mocks/types';
import type { Certificate, CertificateView, ComplianceType, RequirementStatus, SignedFileUrl } from '@/types/domain';
import { http } from './api';
import { USE_MOCKS } from './config';
import { conflict, invalid, mockCall, notFound, paginate } from './mock-adapter';
import { assertActive } from './properties.service';

export interface CertificateListQuery {
  propertyId?: string;
  typeId?: string;
  status?: RequirementStatus;
  /** Only current versions (default true). */
  current?: boolean;
  search?: string;
  /** urgent (default): overdue → due soon → valid → stored → superseded, then soonest expiry. */
  sort?: CertificateSort;
  page?: number;
  limit?: number;
}

export type CertificateSort = 'urgent' | 'expiry' | 'uploaded';

export interface CertificateSummary {
  current: number;
  overdue: number;
  dueSoon: number;
  valid: number;
  stored: number;
  calculated: number;
}

/** Lower = more urgent. Superseded versions (no status) sort last. */
const URGENCY: Record<RequirementStatus, number> = { overdue: 0, missing: 1, due_soon: 2, valid: 3, store_only: 4, not_applicable: 5 };
const urgency = (c: CertificateView) => (c.requirementStatus ? URGENCY[c.requirementStatus] : 9);
const byExpiry = (a: CertificateView, b: CertificateView) => (a.expiryDate ?? '9999').localeCompare(b.expiryDate ?? '9999');

const SIGNED_URL_TTL_MS = 5 * 60 * 1000;

const escapeHtml = (v: string) => v.replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);

/** Stand-in document for seeded fixtures that have no stored bytes. */
function demoDocument(c: CertificateView): Blob {
  const rows: [string, string][] = [
    ['Property', `${c.propertyName} (${c.propertyReference})`],
    ['Compliance type', c.complianceTypeName],
    ['Version', `v${c.version}${c.isCurrent ? ' (current)' : ' (superseded)'}`],
    ['Issue date', c.issueDate.slice(0, 10)],
    ['Expiry date', c.expiryDate ? c.expiryDate.slice(0, 10) + (c.expiryCalculated ? ' (calculated)' : '') : 'No expiry'],
    ['Original file', `${c.file.name} (${c.file.mimeType})`],
    ['Uploaded by', `${c.uploadedBy.name} on ${c.createdAt.slice(0, 10)}`],
  ];
  const body = rows.map(([k, v]) => `<tr><th>${escapeHtml(k)}</th><td>${escapeHtml(v)}</td></tr>`).join('');
  const html = [
    '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>' + escapeHtml(c.file.name) + '</title>',
    '<style>body{font:15px/1.5 system-ui,sans-serif;color:#0f223d;max-width:640px;margin:48px auto;padding:0 16px}',
    'th{text-align:left;padding:6px 16px 6px 0;color:#5b6b82;font-weight:500}td{padding:6px 0}',
    '.note{background:#eef4fc;border-radius:8px;padding:12px 16px}</style></head><body>',
    '<h1>Demo certificate record</h1>',
    '<p class="note">This demo fixture has no stored file. Once the backend is connected, this link opens the original document from secure storage.</p>',
    `<table>${body}</table></body></html>`,
  ].join('\n');
  return new Blob([html], { type: 'text/html' });
}

export interface CertificateUploadInput {
  requirementId: string;
  issueDate: string;
  expiryDate?: string;
  reviewDate?: string;
  notes?: string;
  file: File | UploadLike;
}

function toView(db: MockDb, c: Certificate): CertificateView {
  const p = db.properties.find((x) => x._id === c.propertyId);
  const req = db.requirements.find((r) => r._id === c.requirementId);
  return {
    ...c,
    propertyName: p?.name ?? '—',
    propertyReference: p?.reference ?? '',
    complianceTypeName: db.complianceTypes.find((t) => t._id === c.complianceTypeId)?.name ?? '—',
    requirementStatus: c.isCurrent ? req?.status : undefined,
  };
}

export const certificatesService = {
  list(q: CertificateListQuery = {}) {
    if (!USE_MOCKS) return http.get<CertificateView[]>('/certificates', q);
    return mockCall(
      () => {
        const db = mockStore.get();
        const activeProps = new Set(db.properties.filter((p) => p.status === 'active').map((p) => p._id));
        const rows = db.certificates
          .filter((c) => (q.current ?? true ? c.isCurrent : true))
          .filter((c) => (q.propertyId ? c.propertyId === q.propertyId : activeProps.has(c.propertyId)))
          .filter((c) => !q.typeId || c.complianceTypeId === q.typeId)
          .map((c) => toView(db, c))
          .filter((c) => !q.status || c.requirementStatus === q.status)
          .filter((c) => includesText([c.propertyName, c.propertyReference, c.complianceTypeName, c.file.name], q.search));
        const sort = q.sort ?? 'urgent';
        rows.sort((a, b) =>
          sort === 'uploaded'
            ? b.createdAt.localeCompare(a.createdAt)
            : sort === 'expiry'
              ? byExpiry(a, b)
              : urgency(a) - urgency(b) || byExpiry(a, b),
        );
        return paginate(rows, q.page, q.limit ?? 25);
      },
      { empty: () => [] },
    );
  },

  /** All versions for the requirement this certificate belongs to, newest first. */
  history(certificateId: string) {
    if (!USE_MOCKS) return http.get<CertificateView[]>(`/certificates/${certificateId}/history`);
    return mockCall(() => {
      const db = mockStore.get();
      const c = db.certificates.find((x) => x._id === certificateId) ?? notFound('Certificate');
      const data = db.certificates
        .filter((x) => x.requirementId === c.requirementId)
        .sort((a, b) => b.version - a.version)
        .map((x, i, all): CertificateView => ({ ...toView(db, x), supersededAt: i > 0 ? all[i - 1].createdAt : undefined }));
      return { data };
    });
  },

  /** Counts of current certificates by status (KPI tiles). Active properties only unless `propertyId` is given. */
  summary(q: { propertyId?: string } = {}) {
    if (!USE_MOCKS) return http.get<CertificateSummary>('/certificates/summary', q);
    return mockCall(
      () => {
        const db = mockStore.get();
        const activeProps = new Set(db.properties.filter((p) => p.status === 'active').map((p) => p._id));
        const rows = db.certificates
          .filter((c) => c.isCurrent && (q.propertyId ? c.propertyId === q.propertyId : activeProps.has(c.propertyId)))
          .map((c) => toView(db, c));
        const count = (s: RequirementStatus) => rows.filter((c) => c.requirementStatus === s).length;
        return {
          data: {
            current: rows.length,
            overdue: count('overdue'),
            dueSoon: count('due_soon'),
            valid: count('valid'),
            stored: count('store_only'),
            calculated: rows.filter((c) => c.expiryCalculated).length,
          },
        };
      },
      { empty: () => ({ current: 0, overdue: 0, dueSoon: 0, valid: 0, stored: 0, calculated: 0 }) },
    );
  },

  /** Short-lived signed link to the stored file (mock: an object URL that is revoked after 5 minutes). */
  fileUrl(certificateId: string) {
    if (!USE_MOCKS) return http.get<SignedFileUrl>(`/certificates/${certificateId}/file`);
    return mockCall<SignedFileUrl>(() => {
      const db = mockStore.get();
      const c = db.certificates.find((x) => x._id === certificateId) ?? notFound('Certificate');
      const stored = mockFiles.get(c.file._id);
      const blob = stored ?? demoDocument(toView(db, c));
      const url = URL.createObjectURL(blob);
      window.setTimeout(() => URL.revokeObjectURL(url), SIGNED_URL_TTL_MS);
      return {
        data: {
          url,
          expiresAt: new Date(Date.now() + SIGNED_URL_TTL_MS).toISOString(),
          fileName: c.file.name,
          mimeType: stored ? c.file.mimeType : 'text/html',
        },
      };
    });
  },

  upload(input: CertificateUploadInput) {
    if (!USE_MOCKS) {
      const form = new FormData();
      Object.entries(input).forEach(([k, v]) => v !== undefined && form.append(k, v as Blob | string));
      return http.upload<Certificate>('/certificates', form);
    }
    return mockCall(
      () =>
        mockStore.mutate((db) => {
          requirePermission('certificate.write');
          const req = db.requirements.find((r) => r._id === input.requirementId) ?? notFound('Requirement');
          assertActive(db, req.propertyId);
          if (req.applicability === 'not_applicable') conflict('This requirement is marked not applicable. Mark it applicable before uploading.');
          const type = db.complianceTypes.find((t) => t._id === req.complianceTypeId) as ComplianceType;
          if (!input.issueDate) invalid('Enter the inspection or issue date.', 'issueDate');
          if (Date.parse(input.issueDate) > Date.now()) invalid('The issue date cannot be in the future.', 'issueDate');
          if (input.expiryDate && Date.parse(input.expiryDate) <= Date.parse(input.issueDate)) invalid('The expiry date must be after the issue date.', 'expiryDate');
          const file = acceptUpload(input.file);

          const months = req.renewalMonthsOverride ?? type.defaultRenewalMonths;
          const issueIso = new Date(input.issueDate).toISOString();
          const expiryDate = input.expiryDate
            ? new Date(input.expiryDate).toISOString()
            : !type.storeOnly && months
              ? addMonths(issueIso, months)
              : undefined;

          const previous = db.certificates.filter((c) => c.requirementId === req._id);
          previous.forEach((c) => (c.isCurrent = false));
          const cert: Certificate = {
            _id: newId('cert'),
            propertyId: req.propertyId,
            requirementId: req._id,
            complianceTypeId: type._id,
            version: previous.reduce((m, c) => Math.max(m, c.version), 0) + 1,
            isCurrent: true,
            issueDate: issueIso,
            reviewDate: input.reviewDate ? new Date(input.reviewDate).toISOString() : undefined,
            expiryDate,
            expiryCalculated: !input.expiryDate && !!expiryDate,
            file,
            notes: input.notes?.trim() || undefined,
            uploadedBy: actorRef(),
            createdAt: new Date().toISOString(),
          };
          db.certificates.push(cert);
          req.currentCertificateId = cert._id;
          const p = db.properties.find((x) => x._id === req.propertyId);
          writeAudit(db, 'create', 'certificate', cert._id, `Uploaded ${type.name} v${cert.version} for ${p?.name ?? 'property'}`);
          return { data: cert, message: cert.version > 1 ? `Version ${cert.version} uploaded. The previous version is kept in the history.` : 'Certificate uploaded', statusCode: 201 };
        }),
      { kind: 'write' },
    );
  },
};

export const complianceTypesService = {
  list(q: { active?: boolean } = {}) {
    if (!USE_MOCKS) return http.get<ComplianceType[]>('/compliance-types', q);
    return mockCall(
      () => ({
        data: mockStore
          .get()
          .complianceTypes.filter((t) => q.active === undefined || t.active === q.active)
          .sort((a, b) => a.sortOrder - b.sortOrder),
      }),
      { empty: () => [] },
    );
  },

  create(input: Pick<ComplianceType, 'name' | 'code' | 'category' | 'applicableTo' | 'defaultRenewalMonths' | 'storeOnly'> & { legislation?: string; sortOrder?: number }) {
    if (!USE_MOCKS) return http.post<ComplianceType>('/compliance-types', input);
    return mockCall(
      () =>
        mockStore.mutate((db) => {
          requirePermission('catalogue.manage');
          if (!input.name?.trim()) invalid('Enter a name.', 'name');
          if (!input.code?.trim()) invalid('Enter a short code.', 'code');
          if (!input.applicableTo?.length) invalid('Choose at least one property type.', 'applicableTo');
          if (db.complianceTypes.some((t) => t.code.toLowerCase() === input.code?.trim().toLowerCase())) invalid('That code is already used.', 'code');
          if (!input.storeOnly && (!input.defaultRenewalMonths || input.defaultRenewalMonths < 1)) invalid('Enter renewal months (1 or more).', 'defaultRenewalMonths');
          const actor = mockStore.actor();
          const type: ComplianceType = {
            _id: newId('ct'),
            orgId: actor.role === 'platform_admin' ? null : db.organisation._id,
            name: input.name.trim(),
            code: input.code.trim().toUpperCase(),
            category: input.category?.trim() || 'Other',
            applicableTo: input.applicableTo,
            defaultRenewalMonths: input.storeOnly ? null : input.defaultRenewalMonths,
            storeOnly: input.storeOnly,
            legislationRefs: input.legislation?.trim() ? [{ version: 1, text: input.legislation.trim(), effectiveFrom: new Date().toISOString(), editedBy: actor.name }] : [],
            sortOrder: input.sortOrder ?? db.complianceTypes.length + 1,
            active: true,
          };
          db.complianceTypes.push(type);
          writeAudit(db, 'create', 'compliance_type', type._id, `Added compliance type ${type.name}`, {
            after: { name: type.name, code: type.code, category: type.category, defaultRenewalMonths: type.defaultRenewalMonths, storeOnly: type.storeOnly },
          });
          return { data: type, message: 'Compliance type added', statusCode: 201 };
        }),
      { kind: 'write' },
    );
  },

  /** Editing the legislation text creates a new version (history is kept). */
  update(id: string, input: Partial<Pick<ComplianceType, 'name' | 'category' | 'applicableTo' | 'defaultRenewalMonths' | 'storeOnly' | 'active' | 'sortOrder'>> & { legislation?: string }) {
    if (!USE_MOCKS) return http.patch<ComplianceType>(`/compliance-types/${id}`, input);
    return mockCall(
      () =>
        mockStore.mutate((db) => {
          requirePermission('catalogue.manage');
          const t = db.complianceTypes.find((x) => x._id === id) ?? notFound('Compliance type');
          if (input.name !== undefined && !input.name.trim()) invalid('Enter a name.', 'name');
          if (input.applicableTo !== undefined && !input.applicableTo.length) invalid('Choose at least one property type.', 'applicableTo');
          const before = {
            name: t.name,
            category: t.category,
            defaultRenewalMonths: t.defaultRenewalMonths,
            storeOnly: t.storeOnly,
            active: t.active,
            sortOrder: t.sortOrder,
            legislationVersion: t.legislationRefs[t.legislationRefs.length - 1]?.version,
          };
          const { legislation, ...rest } = input;
          Object.assign(t, rest);
          if (t.storeOnly) t.defaultRenewalMonths = null;
          const latest = t.legislationRefs[t.legislationRefs.length - 1];
          if (legislation !== undefined && legislation.trim() && legislation.trim() !== latest?.text) {
            t.legislationRefs.push({ version: (latest?.version ?? 0) + 1, text: legislation.trim(), effectiveFrom: new Date().toISOString(), editedBy: mockStore.actor().name });
          }
          const after = {
            name: t.name,
            category: t.category,
            defaultRenewalMonths: t.defaultRenewalMonths,
            storeOnly: t.storeOnly,
            active: t.active,
            sortOrder: t.sortOrder,
            legislationVersion: t.legislationRefs[t.legislationRefs.length - 1]?.version,
          };
          writeAudit(db, 'update', 'compliance_type', id, `Updated compliance type ${t.name}`, { before, after });
          return { data: t, message: 'Compliance type updated', statusCode: 200 };
        }),
      { kind: 'write' },
    );
  },
};
