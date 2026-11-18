import { includesText, requirePermission, writeAudit } from '@/mocks/helpers';
import { mockStore } from '@/mocks/store';
import { newId } from '@/mocks/time';
import type { MockDb } from '@/mocks/types';
import type { Address, Property, PropertyRequirement, PropertyType, Rag, RequirementView } from '@/types/domain';
import { http } from './api';
import { USE_MOCKS } from './config';
import { conflict, invalid, mockCall, notFound, paginate } from './mock-adapter';

export type PropertySort = 'address' | 'name' | 'next_due' | 'rag' | 'open_actions';
export interface PropertyListQuery {
  search?: string;
  type?: PropertyType;
  rag?: Rag;
  /** any · has_open · has_overdue · none */
  actionStatus?: 'has_open' | 'has_overdue' | 'none';
  status?: 'active' | 'archived' | 'all';
  sort?: PropertySort;
  /** Sort direction (default asc). */
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface PropertyInput {
  name: string;
  reference?: string;
  address: Address;
  type: PropertyType;
  units?: number;
  floors?: number;
  managerId?: string;
  contacts?: Property['contacts'];
  coverImageUrl?: string;
}

const RAG_ORDER: Record<Rag, number> = { red: 0, amber: 1, green: 2 };
/** UK postcode (format check only — no lookup). Shared with the property form. */
export const UK_POSTCODE_RE = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function findProperty(db: MockDb, id: string) {
  return db.properties.find((p) => p._id === id) ?? notFound('Property');
}

/** Archived properties are read-only (409) until restored. */
export function assertActive(db: MockDb, propertyId: string) {
  if (db.properties.find((p) => p._id === propertyId)?.status === 'archived') conflict('This property is archived. Restore it before making changes.');
}

function validate(input: Partial<PropertyInput>, db: MockDb, selfId?: string) {
  if (input.name !== undefined && !input.name.trim()) invalid('Enter the property name.', 'name');
  if (input.address) {
    if (!input.address.line1?.trim()) invalid('Enter the first line of the address.', 'address.line1');
    if (!input.address.city?.trim()) invalid('Enter the town or city.', 'address.city');
    if (!input.address.postcode?.trim()) invalid('Enter the postcode.', 'address.postcode');
    if (!UK_POSTCODE_RE.test(input.address.postcode.trim())) invalid('Enter a valid UK postcode.', 'address.postcode');
  }
  for (const key of ['units', 'floors'] as const) {
    const v = input[key];
    if (v != null && (!Number.isInteger(v) || v < 0 || v > 10_000)) invalid(`Enter a whole number of ${key}.`, key);
  }
  input.contacts?.forEach((c, i) => {
    if (!c.name.trim()) invalid('Enter the contact name.', `contacts.${i}.name`);
    if (c.email && !EMAIL_RE.test(c.email)) invalid('Enter a valid email address.', `contacts.${i}.email`);
  });
  if (input.reference && db.properties.some((p) => p._id !== selfId && p.reference.toLowerCase() === input.reference!.toLowerCase())) {
    invalid('That reference is already used by another property.', 'reference');
  }
}

export const propertiesService = {
  list(q: PropertyListQuery = {}) {
    if (!USE_MOCKS) return http.get<Property[]>('/properties', q);
    return mockCall(
      () => {
        const db = mockStore.get();
        const status = q.status ?? 'active';
        let rows = db.properties.filter(
          (p) =>
            (status === 'all' || p.status === status) &&
            (!q.type || p.type === q.type) &&
            (!q.rag || p.ragStatus === q.rag) &&
            includesText([p.name, p.reference, p.address.line1, p.address.line2, p.address.city, p.address.postcode], q.search),
        );
        if (q.actionStatus) {
          rows = rows.filter((p) => {
            const acts = db.actions.filter((a) => a.propertyId === p._id && a.status !== 'closed');
            if (q.actionStatus === 'none') return acts.length === 0;
            if (q.actionStatus === 'has_overdue') return acts.some((a) => a.isOverdue);
            return acts.length > 0;
          });
        }
        const sorters: Record<PropertySort, (a: Property, b: Property) => number> = {
          address: (a, b) => a.address.line1.localeCompare(b.address.line1, 'en-GB', { numeric: true }),
          name: (a, b) => a.name.localeCompare(b.name, 'en-GB'),
          next_due: (a, b) => (a.nextDue?.date ?? '9999').localeCompare(b.nextDue?.date ?? '9999'),
          rag: (a, b) => RAG_ORDER[a.ragStatus] - RAG_ORDER[b.ragStatus] || a.name.localeCompare(b.name),
          open_actions: (a, b) => (b.counts?.openActions ?? 0) - (a.counts?.openActions ?? 0),
        };
        rows = [...rows].sort(sorters[q.sort ?? 'address']);
        if (q.order === 'desc') rows.reverse();
        return paginate(rows, q.page, q.limit ?? 50);
      },
      { empty: () => [] },
    );
  },

  get(id: string) {
    if (!USE_MOCKS) return http.get<Property>(`/properties/${id}`);
    return mockCall(() => ({ data: findProperty(mockStore.get(), id) }));
  },

  create(input: PropertyInput) {
    if (!USE_MOCKS) return http.post<Property>('/properties', input);
    return mockCall(
      () =>
        mockStore.mutate((db) => {
          requirePermission('property.write');
          validate({ ...input, name: input.name ?? '' }, db);
          db.counters.property += 1;
          const now = new Date().toISOString();
          const property: Property = {
            _id: newId('prop'),
            orgId: db.organisation._id,
            reference: input.reference?.trim() || `REF-${String(db.counters.property).padStart(3, '0')}`,
            name: input.name.trim(),
            address: input.address,
            type: input.type,
            units: input.units,
            floors: input.floors,
            managerId: input.managerId,
            contacts: input.contacts ?? [],
            coverImageUrl: input.coverImageUrl,
            status: 'active',
            ragStatus: 'red',
            createdAt: now,
            updatedAt: now,
          };
          db.properties.push(property);
          // Seed requirements from the active catalogue for this property type.
          for (const t of db.complianceTypes.filter((c) => c.active && c.applicableTo.includes(input.type))) {
            db.requirements.push({ _id: newId('req'), propertyId: property._id, complianceTypeId: t._id, applicability: 'applicable', status: 'missing' });
          }
          writeAudit(db, 'create', 'property', property._id, `Created property ${property.name} (${property.reference})`);
          return { data: property, message: 'Property created', statusCode: 201 };
        }),
      { kind: 'write' },
    );
  },

  update(id: string, input: Partial<PropertyInput>) {
    if (!USE_MOCKS) return http.patch<Property>(`/properties/${id}`, input);
    return mockCall(
      () =>
        mockStore.mutate((db) => {
          requirePermission('property.write');
          const p = findProperty(db, id);
          validate(input, db, id);
          // A blank reference keeps the existing one (it is required once assigned).
          const { reference, ...rest } = input;
          Object.assign(p, rest, { updatedAt: new Date().toISOString() });
          if (reference?.trim()) p.reference = reference.trim();
          writeAudit(db, 'update', 'property', id, `Updated property ${p.name}`);
          return { data: p, message: 'Property updated', statusCode: 200 };
        }),
      { kind: 'write' },
    );
  },

  archive(id: string, reason?: string) {
    if (!USE_MOCKS) return http.post<Property>(`/properties/${id}/archive`, { reason });
    return mockCall(
      () =>
        mockStore.mutate((db) => {
          requirePermission('property.write');
          const p = findProperty(db, id);
          if (p.status === 'archived') conflict('This property is already archived.');
          p.status = 'archived';
          p.updatedAt = new Date().toISOString();
          writeAudit(db, 'archive', 'property', id, `Archived property ${p.name}${reason ? `: ${reason}` : ''}`);
          return { data: p, message: 'Property archived', statusCode: 200 };
        }),
      { kind: 'write' },
    );
  },

  restore(id: string) {
    if (!USE_MOCKS) return http.post<Property>(`/properties/${id}/restore`);
    return mockCall(
      () =>
        mockStore.mutate((db) => {
          requirePermission('property.write');
          const p = findProperty(db, id);
          if (p.status === 'active') conflict('This property is already active.');
          p.status = 'active';
          p.updatedAt = new Date().toISOString();
          writeAudit(db, 'update', 'property', id, `Restored property ${p.name}`);
          return { data: p, message: 'Property restored', statusCode: 200 };
        }),
      { kind: 'write' },
    );
  },

  requirements(propertyId: string) {
    if (!USE_MOCKS) return http.get<RequirementView[]>(`/properties/${propertyId}/requirements`);
    return mockCall(
      () => {
        const db = mockStore.get();
        findProperty(db, propertyId);
        const data: RequirementView[] = db.requirements
          .filter((r) => r.propertyId === propertyId)
          .map((r) => ({
            ...r,
            complianceType: db.complianceTypes.find((t) => t._id === r.complianceTypeId)!,
            currentCertificate: db.certificates.find((c) => c._id === r.currentCertificateId),
          }))
          .sort((a, b) => a.complianceType.sortOrder - b.complianceType.sortOrder);
        return { data };
      },
      { empty: () => [] },
    );
  },

  updateRequirement(id: string, input: { applicability: PropertyRequirement['applicability']; naReason?: string; renewalMonthsOverride?: number | null }) {
    if (!USE_MOCKS) return http.patch<PropertyRequirement>(`/requirements/${id}`, input);
    return mockCall(
      () =>
        mockStore.mutate((db) => {
          requirePermission('requirement.write');
          const r = db.requirements.find((x) => x._id === id) ?? notFound('Requirement');
          assertActive(db, r.propertyId);
          if (input.applicability === 'not_applicable' && !input.naReason?.trim()) invalid('Give a reason why this does not apply.', 'naReason');
          if (input.renewalMonthsOverride != null && (input.renewalMonthsOverride < 1 || input.renewalMonthsOverride > 240)) {
            invalid('Renewal interval must be between 1 and 240 months.', 'renewalMonthsOverride');
          }
          r.applicability = input.applicability;
          r.naReason = input.applicability === 'not_applicable' ? input.naReason!.trim() : undefined;
          r.renewalMonthsOverride = input.renewalMonthsOverride ?? undefined;
          const t = db.complianceTypes.find((c) => c._id === r.complianceTypeId);
          writeAudit(db, 'update', 'property', r.propertyId, `${t?.name ?? 'Requirement'} marked ${input.applicability === 'not_applicable' ? 'not applicable' : 'applicable'}`);
          return { data: r, message: 'Requirement updated', statusCode: 200 };
        }),
      { kind: 'write' },
    );
  },
};
