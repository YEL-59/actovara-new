import { hashPassword } from '@/mocks/auth';
import { actorRef, buildReportSnapshot, includesText, requirePermission, writeAudit } from '@/mocks/helpers';
import { mockStore } from '@/mocks/store';
import { newId, yyyymmdd } from '@/mocks/time';
import type { MockDb } from '@/mocks/types';
import type { PublicShareView, Report, ReportView, ShareAccess, ShareLink, ShareUnavailableReason, SignedFileUrl } from '@/types/domain';
import { http } from './api';
import { USE_MOCKS } from './config';
import { ApiError } from './errors';
import { conflict, currentMockState, invalid, mockCall, notFound } from './mock-adapter';
import { assertActive } from './properties.service';

const SIGNED_URL_TTL_MS = 5 * 60_000;

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

function demoReportBlob(report: ReportView): Blob {
  const s = report.snapshotData;
  const reqRows = (s?.requirements ?? [])
    .map(
      (r) =>
        `<tr><td>${esc(r.complianceTypeName)}${r.affectsRag === false ? ' (not in RAG)' : ''}</td><td>${esc(r.status)}</td><td>${esc(r.expiryDate ? r.expiryDate.slice(0, 10) : '—')}</td><td>${esc(r.currentCertificateName ?? '—')}</td></tr>`,
    )
    .join('');
  const actRows = (s?.actions ?? [])
    .map(
      (a) =>
        `<tr><td>${esc(a.reference)}</td><td>${esc(a.title)}</td><td>${esc(a.status)}</td><td>${esc(a.dueDate.slice(0, 10))}</td><td>${esc(a.evidenceRefs.join(', ') || (a.completionMethod === 'confirmation' ? 'Written confirmation' : '—'))}</td></tr>`,
    )
    .join('');
  const html = [
    '<!doctype html><html lang="en"><head><meta charset="utf-8">',
    `<title>${esc(report.reference)} — ${esc(report.propertyName)}</title>`,
    '<style>body{font-family:system-ui,sans-serif;max-width:820px;margin:32px auto;padding:0 20px;color:#0f172a;line-height:1.5}',
    'table{width:100%;border-collapse:collapse;margin:12px 0 24px}th,td{border:1px solid #e5e9ef;padding:8px 10px;text-align:left;font-size:13px}',
    'th{background:#f0f2f5}.note{background:#fef7e8;border:1px solid #feebbf;padding:12px 14px;border-radius:8px;font-size:12px}</style></head><body>',
    `<h1>Compliance Report: ${esc(report.reference)}</h1>`,
    `<p><strong>Property:</strong> ${esc(report.propertyName)} · <strong>Generated:</strong> ${esc(report.generatedAt.slice(0, 16).replace('T', ' '))} UTC · <strong>By:</strong> ${esc(report.generatedBy.name)}</p>`,
    `<p><strong>RAG:</strong> ${esc(report.snapshot.rag.toUpperCase())} · Requirements: ${report.snapshot.requirements} · Overdue: ${report.snapshot.overdue} · Due soon: ${report.snapshot.dueSoon} · Missing: ${report.snapshot.missing} · Open actions: ${report.snapshot.openActions}</p>`,
    '<h2>Requirements Snapshot</h2><table><thead><tr><th>Type</th><th>Status</th><th>Expiry</th><th>Document</th></tr></thead><tbody>',
    reqRows || '<tr><td colspan="4">No requirements recorded</td></tr>',
    '</tbody></table><h2>Actions Snapshot</h2><table><thead><tr><th>Ref</th><th>Title</th><th>Status</th><th>Due</th><th>Evidence</th></tr></thead><tbody>',
    actRows || '<tr><td colspan="5">No actions recorded</td></tr>',
    '</tbody></table>',
    `<div class="note">${esc(s?.disclaimerText ?? 'Demo snapshot report.')}</div>`,
    '<p style="margin-top:24px;font-size:12px;color:#5b6576">Demo snapshot exported by Actovara. Production exports a server-rendered PDF.</p>',
    '</body></html>',
  ].join('');
  return new Blob([html], { type: 'text/html' });
}

export const reportsService = {
  list(q: { propertyId?: string; search?: string } = {}) {
    if (!USE_MOCKS) return http.get<ReportView[]>('/reports', q);
    return mockCall(
      () => {
        const db = mockStore.get();
        const data = db.reports
          .filter((r) => !q.propertyId || r.propertyId === q.propertyId)
          .map((r): ReportView => ({ ...r, propertyName: db.properties.find((p) => p._id === r.propertyId)?.name ?? '—' }))
          .filter((r) => includesText([r.reference, r.propertyName, r.generatedBy.name], q.search))
          .sort((a, b) => b.generatedAt.localeCompare(a.generatedAt));
        return { data };
      },
      { empty: () => [] },
    );
  },

  get(id: string) {
    if (!USE_MOCKS) return http.get<ReportView>(`/reports/${id}`);
    return mockCall(() => {
      const db = mockStore.get();
      const r = db.reports.find((x) => x._id === id) ?? notFound('Report');
      const propertyName = r.snapshotData?.property.name ?? db.properties.find((p) => p._id === r.propertyId)?.name ?? '—';
      return { data: { ...r, propertyName } };
    });
  },

  generate(propertyId: string) {
    if (!USE_MOCKS) return http.post<Report>('/reports', { propertyId });
    return mockCall(
      () =>
        mockStore.mutate((db) => {
          requirePermission('report.generate');
          const p = db.properties.find((x) => x._id === propertyId) ?? notFound('Property');
          const now = new Date().toISOString();
          const prefix = `ACT-${p.reference.replace('-', '')}-${yyyymmdd(now)}`;
          const seq = db.reports.filter((r) => r.reference.startsWith(prefix)).length + 1;
          const reference = `${prefix}-${String(seq).padStart(2, '0')}`;
          const snapshotData = buildReportSnapshot(db, propertyId);
          const report: Report = {
            _id: newId('rpt'),
            propertyId,
            reference,
            generatedBy: actorRef(),
            generatedAt: now,
            file: { _id: newId('file'), name: `${reference}.pdf`, mimeType: 'application/pdf', sizeBytes: 320_000 + Math.round(Math.random() * 400_000), scanStatus: 'clean' },
            snapshot: {
              rag: p.ragStatus,
              requirements: snapshotData.requirements.length,
              overdue: snapshotData.counts.overdue,
              dueSoon: snapshotData.counts.dueSoon,
              missing: snapshotData.counts.missing,
              openActions: snapshotData.counts.openActions,
            },
            snapshotData,
            disclaimerVersion: 'v1',
          };
          db.reports.push(report);
          writeAudit(db, 'export', 'report', report._id, `Generated report ${reference}`);
          return { data: report, message: 'Report generated', statusCode: 201 };
        }),
      { kind: 'write' },
    );
  },

  /** Short-lived signed link to the report PDF (mock: downloadable HTML snapshot + audit entry). */
  fileUrl(id: string) {
    if (!USE_MOCKS) return http.get<SignedFileUrl>(`/reports/${id}/file`);
    return mockCall<SignedFileUrl>(() =>
      mockStore.mutate((db) => {
        const r = db.reports.find((x) => x._id === id) ?? notFound('Report');
        const propertyName = r.snapshotData?.property.name ?? db.properties.find((p) => p._id === r.propertyId)?.name ?? '—';
        const blob = demoReportBlob({ ...r, propertyName });
        const url = URL.createObjectURL(blob);
        window.setTimeout(() => URL.revokeObjectURL(url), SIGNED_URL_TTL_MS);
        writeAudit(db, 'download', 'report', r._id, `Downloaded report ${r.reference}`);
        return {
          data: {
            url,
            expiresAt: new Date(Date.now() + SIGNED_URL_TTL_MS).toISOString(),
            fileName: r.file.name,
            mimeType: 'text/html',
          },
        };
      }),
    );
  },
};

export const SHARE_DEFAULT_DAYS = 30;
export const SHARE_MAX_DAYS = 365;
/** Wrong-password attempts allowed per link inside the window before a 429. */
const SHARE_MAX_BAD_PASSWORDS = 5;
const SHARE_LOCK_WINDOW_MS = 15 * 60_000;

/** `YYYY-MM-DD` → last moment of that local day (the link works for the whole chosen day). */
function endOfDay(date: string) {
  const d = /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Date(`${date}T23:59:59`) : new Date(date);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString();
}

function demoUserAgent() {
  if (typeof navigator === 'undefined') return 'Unknown browser';
  const ua = navigator.userAgent;
  const browser = /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : 'Browser';
  const os = /Windows/.test(ua) ? 'Windows' : /iPhone|iPad/.test(ua) ? 'iOS' : /Android/.test(ua) ? 'Android' : /Mac OS/.test(ua) ? 'macOS' : 'Linux';
  return `${browser} on ${os}`;
}

function logAccess(db: MockDb, shareLinkId: string, outcome: ShareAccess['outcome']) {
  const at = new Date().toISOString();
  db.shareAccesses.push({ _id: newId('sha'), shareLinkId, accessedAt: at, ip: '192.0.2.10', userAgent: demoUserAgent(), outcome });
  const link = db.shareLinks.find((l) => l._id === shareLinkId);
  if (link && outcome === 'granted') {
    link.accessCount += 1;
    link.lastAccessedAt = at;
  }
}

const gone = (reason: ShareUnavailableReason, message: string) => new ApiError(410, message, [{ path: 'reason', message: reason }]);

function buildPublicView(db: MockDb, propertyId: string, expiresAt: string): PublicShareView {
  const p = db.properties.find((x) => x._id === propertyId)!;
  const typeById = new Map(db.complianceTypes.map((t) => [t._id, t]));
  const certById = new Map(db.certificates.map((c) => [c._id, c]));
  const requirements = db.requirements
    .filter((r) => r.propertyId === propertyId && r.applicability === 'applicable')
    .map((r) => {
      const t = typeById.get(r.complianceTypeId);
      const cert = r.currentCertificateId ? certById.get(r.currentCertificateId) : undefined;
      return { order: t?.sortOrder ?? 999, row: { complianceTypeName: t?.name ?? 'Other requirement', status: r.status, expiryDate: cert?.expiryDate } };
    })
    .sort((a, b) => a.order - b.order)
    .map((x) => x.row);
  const openActions = db.actions
    .filter((a) => a.propertyId === propertyId && a.status !== 'closed')
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .map((a) => ({ title: a.title, dueDate: a.dueDate }));
  return {
    organisationName: db.organisation.name,
    propertyName: p.name,
    locality: [p.address.city, p.address.postcode].filter(Boolean).join(', '),
    rag: p.ragStatus,
    generatedAt: new Date().toISOString(),
    expiresAt,
    requirements,
    openActions,
  };
}

/**
 * Public landlord page (no session). Every attempt on a known link is written to its access log.
 * Errors: 404 unknown token · 410 expired/revoked/unavailable (`errorSources[0].message` = reason)
 * · 401 password required (no sources) or wrong (`path: 'password'`) · 429 too many wrong passwords.
 */
export const publicShareService = {
  view(token: string, password?: string) {
    if (!USE_MOCKS) return http.post<PublicShareView>(`/public/share/${encodeURIComponent(token)}`, password ? { password } : {});
    return mockCall<PublicShareView>(() => {
      const outcome = mockStore.mutate((db): { view: PublicShareView } | { error: ApiError } => {
        const secret = db.shareSecrets.find((x) => x.tokenHash === hashPassword(token));
        const link = secret && db.shareLinks.find((l) => l._id === secret.shareLinkId);
        if (!secret || !link) return { error: new ApiError(404, 'This link is not valid. Check you copied the whole address.') };
        if (link.revokedAt) {
          logAccess(db, link._id, 'revoked');
          return { error: gone('revoked', 'The property manager has withdrawn this link.') };
        }
        if (Date.parse(link.expiresAt) <= Date.now()) {
          logAccess(db, link._id, 'expired');
          return { error: gone('expired', 'This link has expired.') };
        }
        const property = db.properties.find((x) => x._id === link.propertyId);
        if (!property || property.status === 'archived') return { error: gone('unavailable', 'This property is no longer shared.') };
        if (secret.passwordHash) {
          const since = Date.now() - SHARE_LOCK_WINDOW_MS;
          const recentBad = db.shareAccesses.filter((a) => a.shareLinkId === link._id && a.outcome === 'bad_password' && Date.parse(a.accessedAt) > since).length;
          if (recentBad >= SHARE_MAX_BAD_PASSWORDS) return { error: new ApiError(429, 'Too many incorrect passwords. Try again in 15 minutes.') };
          if (!password) return { error: new ApiError(401, 'This link is password protected.') };
          if (hashPassword(password) !== secret.passwordHash) {
            logAccess(db, link._id, 'bad_password');
            return { error: new ApiError(401, 'That password is not correct.', [{ path: 'password', message: 'That password is not correct.' }]) };
          }
        }
        logAccess(db, link._id, 'granted');
        return { view: buildPublicView(db, link.propertyId, link.expiresAt) };
      });
      if ('error' in outcome) throw outcome.error;
      // `?mockState=empty` previews a property with nothing recorded yet.
      if (currentMockState() === 'empty') return { data: { ...outcome.view, requirements: [], openActions: [] } };
      return { data: outcome.view };
    });
  },
};

/** Landlord share links (P1). */
export const sharingService = {
  list(propertyId: string) {
    if (!USE_MOCKS) return http.get<ShareLink[]>(`/properties/${propertyId}/share-links`);
    return mockCall(
      () => ({ data: mockStore.get().shareLinks.filter((l) => l.propertyId === propertyId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)) }),
      { empty: () => [] },
    );
  },

  /** The full URL is returned once only. Afterwards just `tokenHint` is kept. */
  create(propertyId: string, input: { expiresAt: string; password?: string }) {
    if (!USE_MOCKS) return http.post<{ shareLink: ShareLink; url: string }>(`/properties/${propertyId}/share-links`, input);
    return mockCall(
      () =>
        mockStore.mutate((db) => {
          requirePermission('share.manage');
          const p = db.properties.find((x) => x._id === propertyId) ?? notFound('Property');
          assertActive(db, propertyId);
          if (!input.expiresAt || Date.parse(endOfDay(input.expiresAt)) <= Date.now()) invalid('Choose an expiry date in the future.', 'expiresAt');
          if (Date.parse(input.expiresAt) > Date.now() + SHARE_MAX_DAYS * 86_400_000) invalid(`Links can last up to ${SHARE_MAX_DAYS} days.`, 'expiresAt');
          if (input.password && input.password.length < 8) invalid('Use at least 8 characters for the password.', 'password');
          const bytes = new Uint8Array(32);
          crypto.getRandomValues(bytes);
          const token = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
          const link: ShareLink = {
            _id: newId('shl'),
            propertyId,
            tokenHint: token.slice(-6),
            expiresAt: endOfDay(input.expiresAt),
            passwordProtected: !!input.password,
            createdBy: actorRef(),
            createdAt: new Date().toISOString(),
            accessCount: 0,
          };
          db.shareLinks.push(link);
          db.shareSecrets.push({ shareLinkId: link._id, tokenHash: hashPassword(token), passwordHash: input.password ? hashPassword(input.password) : undefined });
          writeAudit(db, 'share', 'share_link', link._id, `Created a landlord share link for ${p.name}`);
          const origin = typeof window !== 'undefined' ? window.location.origin : '';
          return { data: { shareLink: link, url: `${origin}/share/${token}` }, message: 'Share link created. Copy it now: it will not be shown again.', statusCode: 201 };
        }),
      { kind: 'write' },
    );
  },

  revoke(id: string) {
    if (!USE_MOCKS) return http.post<ShareLink>(`/share-links/${id}/revoke`);
    return mockCall(
      () =>
        mockStore.mutate((db) => {
          requirePermission('share.manage');
          const l = db.shareLinks.find((x) => x._id === id) ?? notFound('Share link');
          if (l.revokedAt) conflict('This link is already revoked.');
          l.revokedAt = new Date().toISOString();
          l.revokedBy = actorRef();
          writeAudit(db, 'revoke', 'share_link', id, 'Revoked a landlord share link');
          return { data: l, message: 'Share link revoked', statusCode: 200 };
        }),
      { kind: 'write' },
    );
  },

  accesses(id: string) {
    if (!USE_MOCKS) return http.get<ShareAccess[]>(`/share-links/${id}/accesses`);
    return mockCall(
      () => {
        requirePermission('share.manage');
        return { data: mockStore.get().shareAccesses.filter((a) => a.shareLinkId === id).sort((a, b) => b.accessedAt.localeCompare(a.accessedAt)) };
      },
      { empty: () => [] },
    );
  },
};
