import { recompute } from '@/mocks/engine';
import { requirePermission, writeAudit } from '@/mocks/helpers';
import {
  deleteImportDraft,
  getImportDraft,
  parseCsv,
  parseImportDate,
  saveImportDraft,
  suggestColumnMapping,
} from '@/mocks/imports';
import { mockStore } from '@/mocks/store';
import { addMonths, newId } from '@/mocks/time';
import type {
  Certificate,
  ImportDateFormat,
  ImportDuplicate,
  ImportLog,
  ImportPreview,
  ImportPreviewRow,
  ImportRowError,
  ImportType,
  Property,
  PropertyType,
} from '@/types/domain';
import { http } from './api';
import { USE_MOCKS } from './config';
import { invalid, mockCall, notFound, paginate } from './mock-adapter';
import { UK_POSTCODE_RE } from './properties.service';

const PROPERTY_TYPES: PropertyType[] = ['residential', 'hmo', 'commercial', 'mixed'];

export interface ImportPreviewInput {
  type: ImportType;
  fileName: string;
  csvText: string;
  dateFormat: ImportDateFormat;
  mapping?: Record<string, string>;
}

export interface ImportCommitResult {
  log: ImportLog;
  importedCount: number;
  skippedCount: number;
  errorCount: number;
}

export const SAMPLE_PROPERTY_CSV = [
  'Reference,Property Name,Address Line 1,City,Postcode,Property Type,Units,Floors',
  'PROP-010,Cedar Mews,18 Cedar Way,Manchester,M4 5AA,residential,6,3',
  'PROP-011,Harbour View,42 Dock Road,Bristol,BS1 5AB,hmo,8,4',
  'PROP-001,Brookfield House Duplicate,14 Station Road,London,SW1A 1AA,residential,12,4',
  'PROP-012,Invalid Postcode Row,9 High Street,Leeds,NOT-A-PC,commercial,2,1',
].join('\n');

export const SAMPLE_CERTIFICATE_CSV = [
  'Property Ref,Compliance Code,Issue Date,Expiry Date,Notes',
  'PROP-001,FRA,15/11/2026,15/11/2027,Annual FRA inspection imported via CSV',
  'PROP-002,GAS,01/11/2026,,Calculated expiry from Gas Safety rule',
  'PROP-099,EICR,10/11/2026,10/11/2031,Unknown property reference',
  'PROP-003,EICR,2026-11-10,2031-11-10,Wrong date format for dd/mm/yyyy',
].join('\n');

export const importsService = {
  list(q: { importType?: ImportType; page?: number; limit?: number } = {}) {
    if (!USE_MOCKS) return http.get<ImportLog[]>('/imports', q);
    return mockCall(
      () => {
        requirePermission('import.run');
        const rows = mockStore
          .get()
          .imports.filter((item) => !q.importType || item.importType === q.importType)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        return paginate(rows, q.page, q.limit ?? 15);
      },
      { empty: () => [] },
    );
  },

  preview(input: ImportPreviewInput) {
    if (!USE_MOCKS) return http.post<ImportPreview>(`/imports/${input.type}/preview`, input);
    return mockCall(() => {
      requirePermission('import.run');
      const { columns, records } = parseCsv(input.csvText);
      if (columns.length === 0 || records.length === 0) {
        invalid('The CSV needs a header row and at least one data row.', 'csvText');
      }

      const db = mockStore.get();
      const suggestedMapping = suggestColumnMapping(columns, input.type);
      const mapping = input.mapping && Object.keys(input.mapping).length > 0 ? input.mapping : suggestedMapping;

      const existingPropRefs = new Set(db.properties.map((p) => p.reference.toLowerCase()));
      const seenRefs = new Set<string>();
      const seenCertKeys = new Set<string>();

      const rows: ImportPreviewRow[] = [];
      const errors: ImportRowError[] = [];
      const duplicates: ImportDuplicate[] = [];

      records.forEach((raw, idx) => {
        const rowNum = idx + 1;
        const mapped: Record<string, string> = {};
        for (const [target, sourceCol] of Object.entries(mapping)) {
          if (sourceCol) mapped[target] = (raw[sourceCol] ?? '').trim();
        }

        const rowErrors: string[] = [];
        let warning: string | undefined;
        let isDuplicate = false;

        if (input.type === 'properties') {
          const ref = mapped.reference ?? '';
          const name = mapped.name ?? '';
          const line1 = mapped.line1 ?? '';
          const city = mapped.city ?? '';
          const postcode = (mapped.postcode ?? '').toUpperCase();
          const type = (mapped.type ?? '').toLowerCase();

          if (!ref) rowErrors.push('Property reference is required.');
          if (!name) rowErrors.push('Property name is required.');
          if (!line1) rowErrors.push('Address line 1 is required.');
          if (!city) rowErrors.push('City is required.');
          if (!UK_POSTCODE_RE.test(postcode)) rowErrors.push('Enter a valid UK postcode.');
          if (!PROPERTY_TYPES.includes(type as PropertyType)) {
            rowErrors.push(`Property type must be one of: ${PROPERTY_TYPES.join(', ')}.`);
          }
          if (mapped.units && (!/^\d+$/.test(mapped.units) || Number(mapped.units) < 1)) {
            rowErrors.push('Units must be a positive whole number.');
          }
          if (mapped.floors && (!/^\d+$/.test(mapped.floors) || Number(mapped.floors) < 1)) {
            rowErrors.push('Floors must be a positive whole number.');
          }

          if (ref && rowErrors.length === 0) {
            const lowerRef = ref.toLowerCase();
            if (existingPropRefs.has(lowerRef)) {
              isDuplicate = true;
              warning = `Property reference ${ref} already exists.`;
              const existing = db.properties.find((p) => p.reference.toLowerCase() === lowerRef);
              duplicates.push({
                row: rowNum,
                identifier: ref,
                existingId: existing?._id ?? '',
                reason: warning,
              });
            } else if (seenRefs.has(lowerRef)) {
              isDuplicate = true;
              warning = `Duplicate reference ${ref} earlier in this CSV.`;
              duplicates.push({ row: rowNum, identifier: ref, existingId: '', reason: warning });
            }
            seenRefs.add(lowerRef);
          }
        } else {
          const propRef = mapped.propertyReference ?? '';
          const compCode = mapped.complianceCode ?? '';
          const rawIssue = mapped.issueDate ?? '';
          const rawExpiry = mapped.expiryDate ?? '';
          const rawReview = mapped.reviewDate ?? '';

          const prop = db.properties.find((p) => p.reference.toLowerCase() === propRef.toLowerCase());
          if (!propRef) rowErrors.push('Property reference is required.');
          else if (!prop) rowErrors.push(`Property "${propRef}" was not found.`);
          else if (prop.status === 'archived') rowErrors.push(`Property "${propRef}" is archived.`);

          const compType = db.complianceTypes.find(
            (t) =>
              t.active &&
              (t.code.toLowerCase() === compCode.toLowerCase() || t.name.toLowerCase() === compCode.toLowerCase()),
          );
          if (!compCode) rowErrors.push('Compliance code is required.');
          else if (!compType) rowErrors.push(`Compliance type "${compCode}" is not active.`);

          const issueIso = parseImportDate(rawIssue, input.dateFormat);
          if (!rawIssue) rowErrors.push('Issue date is required.');
          else if (!issueIso) rowErrors.push(`Issue date "${rawIssue}" does not match ${input.dateFormat}.`);

          let expiryIso: string | null = null;
          if (rawExpiry) {
            expiryIso = parseImportDate(rawExpiry, input.dateFormat);
            if (!expiryIso) rowErrors.push(`Expiry date "${rawExpiry}" does not match ${input.dateFormat}.`);
            else if (issueIso && expiryIso < issueIso) rowErrors.push('Expiry date cannot be before issue date.');
          }

          if (rawReview && !parseImportDate(rawReview, input.dateFormat)) {
            rowErrors.push(`Review date "${rawReview}" does not match ${input.dateFormat}.`);
          }

          if (prop && compType && issueIso && rowErrors.length === 0) {
            const req = db.requirements.find(
              (r) => r.propertyId === prop._id && r.complianceTypeId === compType._id,
            );
            if (!req) {
              rowErrors.push(`${compType.code} is not tracked on ${prop.reference}.`);
            } else {
              const dupKey = `${prop._id}:${compType._id}:${issueIso}`;
              const hasExisting = db.certificates.some(
                (c) =>
                  c.propertyId === prop._id &&
                  c.complianceTypeId === compType._id &&
                  c.issueDate.slice(0, 10) === issueIso,
              );
              if (hasExisting || seenCertKeys.has(dupKey)) {
                isDuplicate = true;
                warning = `A ${compType.code} certificate issued on ${issueIso} already exists for ${prop.reference}.`;
                duplicates.push({
                  row: rowNum,
                  identifier: `${prop.reference} · ${compType.code}`,
                  existingId: prop._id,
                  reason: warning,
                });
              }
              seenCertKeys.add(dupKey);
            }
          }
        }

        rowErrors.forEach((msg) => errors.push({ row: rowNum, message: msg }));
        const status: ImportPreviewRow['status'] =
          rowErrors.length > 0 ? 'error' : isDuplicate ? 'duplicate' : 'valid';
        rows.push({ row: rowNum, raw, mapped, status, errors: rowErrors, warning });
      });

      const importId = newId('impdraft');
      const preview: ImportPreview = {
        importId,
        type: input.type,
        fileName: input.fileName || `${input.type}-import.csv`,
        dateFormat: input.dateFormat,
        columns,
        suggestedMapping,
        mapping,
        totalRows: rows.length,
        validCount: rows.filter((r) => r.status === 'valid').length,
        duplicateCount: rows.filter((r) => r.status === 'duplicate').length,
        errorCount: rows.filter((r) => r.status === 'error').length,
        rows,
        errors,
        duplicates,
      };
      saveImportDraft(importId, { preview, csvText: input.csvText });
      return { data: preview };
    });
  },

  commit(input: { importId: string; skipDuplicates?: boolean }) {
    const draft = getImportDraft(input.importId);
    if (!USE_MOCKS) {
      return http.post<ImportCommitResult>(`/imports/${draft?.preview.type ?? 'properties'}/commit`, input);
    }
    return mockCall(
      () =>
        mockStore.mutate((db) => {
          requirePermission('import.run');
          if (!draft) notFound('Import preview');
          const { preview } = draft;
          const skipDuplicates = input.skipDuplicates !== false;
          const rowsToCommit = preview.rows.filter(
            (r) => r.status === 'valid' || (!skipDuplicates && r.status === 'duplicate'),
          );
          if (rowsToCommit.length === 0) {
            invalid('There are no valid rows to import. Fix errors or upload a new file.');
          }

          const actor = mockStore.actor();
          const now = new Date().toISOString();

          if (preview.type === 'properties') {
            for (const row of rowsToCommit) {
              const m = row.mapped;
              db.counters.property += 1;
              const pType = m.type!.toLowerCase() as PropertyType;
              const prop: Property = {
                _id: newId('prop'),
                orgId: db.organisation._id,
                reference: m.reference!,
                name: m.name!,
                address: {
                  line1: m.line1!,
                  line2: m.line2 || undefined,
                  city: m.city!,
                  postcode: m.postcode!.toUpperCase(),
                },
                type: pType,
                units: m.units ? Number(m.units) : undefined,
                floors: m.floors ? Number(m.floors) : undefined,
                contacts: [],
                status: 'active',
                ragStatus: 'amber',
                createdAt: now,
                updatedAt: now,
              };
              db.properties.push(prop);
              for (const ct of db.complianceTypes.filter((t) => t.active && t.applicableTo.includes(pType))) {
                db.requirements.push({
                  _id: newId('req'),
                  propertyId: prop._id,
                  complianceTypeId: ct._id,
                  applicability: 'applicable',
                  status: ct.storeOnly ? 'store_only' : 'missing',
                });
              }
            }
            writeAudit(
              db,
              'import',
              'property',
              undefined,
              `Imported ${rowsToCommit.length} propert${rowsToCommit.length === 1 ? 'y' : 'ies'} from ${preview.fileName}`,
            );
          } else {
            for (const row of rowsToCommit) {
              const m = row.mapped;
              const prop = db.properties.find((p) => p.reference.toLowerCase() === m.propertyReference!.toLowerCase());
              const ct = db.complianceTypes.find(
                (t) =>
                  t.active &&
                  (t.code.toLowerCase() === m.complianceCode!.toLowerCase() ||
                    t.name.toLowerCase() === m.complianceCode!.toLowerCase()),
              );
              if (!prop || !ct) continue;
              const req = db.requirements.find((r) => r.propertyId === prop._id && r.complianceTypeId === ct._id);
              if (!req) continue;

              const issueIso = parseImportDate(m.issueDate!, preview.dateFormat)!;
              const explicitExpiry = m.expiryDate ? parseImportDate(m.expiryDate, preview.dateFormat) : null;
              const months = req.renewalMonthsOverride ?? ct.defaultRenewalMonths;
              let expiryDate: string | undefined;
              let expiryCalculated = false;
              if (!ct.storeOnly) {
                if (explicitExpiry) {
                  expiryDate = new Date(`${explicitExpiry}T12:00:00.000Z`).toISOString();
                } else if (months) {
                  expiryDate = addMonths(`${issueIso}T12:00:00.000Z`, months);
                  expiryCalculated = true;
                }
              }

              const existing = db.certificates.filter((c) => c.requirementId === req._id);
              for (const prev of existing) prev.isCurrent = false;
              const version = existing.length + 1;
              const cert: Certificate = {
                _id: newId('cert'),
                propertyId: prop._id,
                requirementId: req._id,
                complianceTypeId: ct._id,
                version,
                isCurrent: true,
                issueDate: new Date(`${issueIso}T12:00:00.000Z`).toISOString(),
                reviewDate: m.reviewDate
                  ? new Date(`${parseImportDate(m.reviewDate, preview.dateFormat)!}T12:00:00.000Z`).toISOString()
                  : undefined,
                expiryDate,
                expiryCalculated,
                file: {
                  _id: newId('fil'),
                  name: `${prop.reference}-${ct.code}-v${version}.pdf`,
                  mimeType: 'application/pdf',
                  sizeBytes: 124_000,
                  scanStatus: 'clean',
                },
                notes: m.notes || undefined,
                uploadedBy: { _id: actor._id, name: actor.name },
                createdAt: now,
              };
              db.certificates.push(cert);
              req.currentCertificateId = cert._id;
            }
            writeAudit(
              db,
              'import',
              'certificate',
              undefined,
              `Imported ${rowsToCommit.length} certificate${rowsToCommit.length === 1 ? '' : 's'} from ${preview.fileName}`,
            );
          }

          recompute(db);

          const skippedCount = preview.totalRows - rowsToCommit.length - preview.errorCount;
          const log: ImportLog = {
            _id: newId('imp'),
            orgId: db.organisation._id,
            importType: preview.type,
            fileName: preview.fileName,
            dateFormat: preview.dateFormat,
            totalRows: preview.totalRows,
            importedCount: rowsToCommit.length,
            skippedCount: Math.max(0, skippedCount),
            errorCount: preview.errorCount,
            status: preview.errorCount > 0 || skippedCount > 0 ? 'partial' : 'completed',
            createdBy: { _id: actor._id, name: actor.name },
            createdAt: now,
          };
          db.imports.unshift(log);
          deleteImportDraft(input.importId);

          return {
            data: {
              log,
              importedCount: log.importedCount,
              skippedCount: log.skippedCount,
              errorCount: log.errorCount,
            },
            message: `Imported ${log.importedCount} row${log.importedCount === 1 ? '' : 's'}`,
            statusCode: 201,
          };
        }),
      { kind: 'write' },
    );
  },
};
