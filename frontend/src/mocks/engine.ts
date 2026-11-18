/**
 * Client-side mirror of the backend status engine (PRD §5.1–5.3, proposed rules — Q-004).
 * The backend `status.service.ts` will own these rules; keep both in sync.
 */
import { daysUntil } from '@/lib/format';
import type { Certificate, ComplianceType, PropertyRequirement, Rag, RequirementStatus } from '@/types/domain';
import type { MockDb } from './types';

export function requirementStatus(
  req: Pick<PropertyRequirement, 'applicability'>,
  cert: Certificate | undefined,
  type: ComplianceType | undefined,
  dueSoonDays: number,
  now: Date,
): RequirementStatus {
  if (req.applicability === 'not_applicable') return 'not_applicable';
  if (!cert) return 'missing';
  if (type?.storeOnly) return 'store_only';
  if (!cert.expiryDate) return 'valid';
  const d = daysUntil(cert.expiryDate, now);
  if (d < 0) return 'overdue';
  if (d <= dueSoonDays) return 'due_soon';
  return 'valid';
}

/** Recompute every derived field in place: requirement status, action overdue flags, property RAG/counts/nextDue. */
export function recompute(db: MockDb, now: Date = new Date()): MockDb {
  const dueSoonDays = db.organisation.settings.dueSoonDays;
  const types = new Map(db.complianceTypes.map((t) => [t._id, t]));
  const certs = new Map(db.certificates.map((c) => [c._id, c]));

  for (const r of db.requirements) {
    const cert = r.currentCertificateId ? certs.get(r.currentCertificateId) : undefined;
    r.status = requirementStatus(r, cert, types.get(r.complianceTypeId), dueSoonDays, now);
    r.nextDueDate = r.status === 'not_applicable' || r.status === 'store_only' ? undefined : cert?.expiryDate;
  }

  for (const a of db.actions) a.isOverdue = a.status !== 'closed' && daysUntil(a.dueDate, now) < 0;

  for (const p of db.properties) {
    const reqs = db.requirements.filter((r) => r.propertyId === p._id);
    const acts = db.actions.filter((a) => a.propertyId === p._id);
    const overdue = reqs.filter((r) => r.status === 'overdue').length;
    const missing = reqs.filter((r) => r.status === 'missing').length;
    const dueSoon = reqs.filter((r) => r.status === 'due_soon').length;
    const openActions = acts.filter((a) => a.status !== 'closed').length;
    const overdueActions = acts.filter((a) => a.isOverdue).length;
    const urgentActions = acts.filter((a) => a.status !== 'closed' && a.priority === 'urgent').length;

    let rag: Rag = 'green';
    if (overdue + missing > 0 || overdueActions > 0 || urgentActions > 0) rag = 'red';
    else if (dueSoon > 0 || openActions > 0) rag = 'amber';
    p.ragStatus = rag;
    p.counts = {
      certificates: db.certificates.filter((c) => c.propertyId === p._id && c.isCurrent).length,
      overdue,
      dueSoon,
      missing,
      openActions,
    };
    const next = reqs
      .filter((r) => r.nextDueDate && (r.status === 'valid' || r.status === 'due_soon' || r.status === 'overdue'))
      .sort((a, b) => a.nextDueDate!.localeCompare(b.nextDueDate!))[0];
    p.nextDue = next ? { date: next.nextDueDate!, complianceTypeName: types.get(next.complianceTypeId)?.name ?? '' } : undefined;
  }
  return db;
}

/** Gauge percentages (PRD §5.3). */
export function gauges(db: MockDb, propertyIds: Set<string>) {
  const reqs = db.requirements.filter((r) => propertyIds.has(r.propertyId) && r.applicability === 'applicable');
  const inDate = reqs.filter((r) => r.status === 'valid' || r.status === 'due_soon' || r.status === 'store_only').length;
  const certificatesInDate = reqs.length ? Math.round((inDate / reqs.length) * 100) : 0;
  const acts = db.actions.filter((a) => propertyIds.has(a.propertyId));
  const actionsClosed = acts.length ? Math.round((acts.filter((a) => a.status === 'closed').length / acts.length) * 100) : 0;
  return { certificatesInDate, actionsClosed, overall: Math.round((certificatesInDate + actionsClosed) / 2), inDateCount: inDate };
}
