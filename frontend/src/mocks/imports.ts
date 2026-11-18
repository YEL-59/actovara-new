import type { ImportDateFormat, ImportPreview, ImportType } from '@/types/domain';

export interface ImportDraft {
  preview: ImportPreview;
  csvText: string;
}

const drafts = new Map<string, ImportDraft>();

export function saveImportDraft(importId: string, draft: ImportDraft) {
  drafts.set(importId, draft);
}

export function getImportDraft(importId: string): ImportDraft | undefined {
  return drafts.get(importId);
}

export function deleteImportDraft(importId: string) {
  drafts.delete(importId);
}

/** Parse RFC-4180 style CSV text into headers + rows. */
export function parseCsv(text: string): { columns: string[]; records: Record<string, string>[] } {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
  if (!normalized) return { columns: [], records: [] };

  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized[i]!;
    if (inQuotes) {
      if (ch === '"') {
        if (normalized[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field.trim());
      field = '';
    } else if (ch === '\n') {
      row.push(field.trim());
      if (row.some((cell) => cell !== '')) rows.push(row);
      row = [];
      field = '';
    } else {
      field += ch;
    }
  }
  row.push(field.trim());
  if (row.some((cell) => cell !== '')) rows.push(row);

  if (rows.length === 0) return { columns: [], records: [] };
  const columns = rows[0]!.map((c, idx) => c || `Column ${idx + 1}`);
  const records = rows.slice(1).map((cells) => {
    const rec: Record<string, string> = {};
    columns.forEach((col, i) => {
      rec[col] = (cells[i] ?? '').trim();
    });
    return rec;
  });
  return { columns, records };
}

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
};

/** Parse a date string in the chosen format and return ISO `YYYY-MM-DD` or null. */
export function parseImportDate(raw: string, format: ImportDateFormat): string | null {
  const value = raw.trim();
  if (!value) return null;

  let y = 0;
  let m = 0;
  let d = 0;

  if (format === 'yyyy-mm-dd') {
    const match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(value);
    if (!match) return null;
    y = Number(match[1]);
    m = Number(match[2]);
    d = Number(match[3]);
  } else if (format === 'dd/mm/yyyy') {
    const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value);
    if (!match) return null;
    d = Number(match[1]);
    m = Number(match[2]);
    y = Number(match[3]);
  } else {
    const match = /^(\d{1,2})\s+([A-Za-z]{3,4})\s+(\d{4})$/.exec(value);
    if (!match) return null;
    d = Number(match[1]);
    m = MONTHS[match[2]!.toLowerCase()] ?? 0;
    y = Number(match[3]);
  }

  if (y < 1950 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) return null;
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
  return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export interface ImportFieldSpec {
  key: string;
  label: string;
  required: boolean;
  synonyms: string[];
}

export const PROPERTY_IMPORT_FIELDS: ImportFieldSpec[] = [
  { key: 'reference', label: 'Property reference', required: true, synonyms: ['reference', 'ref', 'property ref', 'property_reference', 'code'] },
  { key: 'name', label: 'Property name', required: true, synonyms: ['name', 'property name', 'property_name', 'property', 'building', 'title'] },
  { key: 'line1', label: 'Address line 1', required: true, synonyms: ['line1', 'address', 'address 1', 'address_1', 'address_line_1', 'street'] },
  { key: 'line2', label: 'Address line 2', required: false, synonyms: ['line2', 'address 2', 'address_2', 'address_line_2'] },
  { key: 'city', label: 'City / Town', required: true, synonyms: ['city', 'town', 'locality'] },
  { key: 'postcode', label: 'Postcode', required: true, synonyms: ['postcode', 'post code', 'post_code', 'zip'] },
  { key: 'type', label: 'Property type', required: true, synonyms: ['type', 'property type', 'property_type', 'category'] },
  { key: 'units', label: 'Units', required: false, synonyms: ['units', 'unit count', 'flats'] },
  { key: 'floors', label: 'Floors', required: false, synonyms: ['floors', 'floor count', 'storeys'] },
];

export const CERTIFICATE_IMPORT_FIELDS: ImportFieldSpec[] = [
  { key: 'propertyReference', label: 'Property reference', required: true, synonyms: ['property reference', 'property_reference', 'property ref', 'reference', 'ref', 'property'] },
  { key: 'complianceCode', label: 'Compliance code / type', required: true, synonyms: ['compliance code', 'compliance_code', 'compliance type', 'code', 'type', 'certificate type'] },
  { key: 'issueDate', label: 'Issue date', required: true, synonyms: ['issue date', 'issue_date', 'issued', 'date issued'] },
  { key: 'expiryDate', label: 'Expiry date', required: false, synonyms: ['expiry date', 'expiry_date', 'expires', 'due date', 'next due'] },
  { key: 'reviewDate', label: 'Review date', required: false, synonyms: ['review date', 'review_date'] },
  { key: 'notes', label: 'Notes', required: false, synonyms: ['notes', 'note', 'comments', 'remarks'] },
];

export function fieldsForImportType(type: ImportType): ImportFieldSpec[] {
  return type === 'properties' ? PROPERTY_IMPORT_FIELDS : CERTIFICATE_IMPORT_FIELDS;
}

export function suggestColumnMapping(columns: string[], type: ImportType): Record<string, string> {
  const fields = fieldsForImportType(type);
  const used = new Set<string>();
  const mapping: Record<string, string> = {};

  for (const field of fields) {
    const normSynonyms = field.synonyms.map((s) => s.toLowerCase().replace(/[^a-z0-9]/g, ''));
    const match = columns.find((col) => {
      if (used.has(col)) return false;
      const normCol = col.toLowerCase().replace(/[^a-z0-9]/g, '');
      return normSynonyms.includes(normCol) || normCol === field.key.toLowerCase();
    });
    if (match) {
      mapping[field.key] = match;
      used.add(match);
    }
  }
  return mapping;
}
