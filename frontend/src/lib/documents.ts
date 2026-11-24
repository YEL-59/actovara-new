import type { ComplianceType, ExpiryMode } from '@/types/domain';

/** How a document type gets its expiry date. Derived from `storeOnly` + `defaultRenewalMonths`. */
export function expiryMode(t: Pick<ComplianceType, 'storeOnly' | 'defaultRenewalMonths'>): ExpiryMode {
  if (t.storeOnly) return 'none';
  return t.defaultRenewalMonths ? 'renewal' : 'on_upload';
}

/** Short label for catalogue tables and the property register. */
export function expiryLabel(t: Pick<ComplianceType, 'storeOnly' | 'defaultRenewalMonths'>, overrideMonths?: number | null): string {
  if (overrideMonths != null && !t.storeOnly) return `${overrideMonths} months`;
  const mode = expiryMode(t);
  if (mode === 'none') return 'No expiry (stored)';
  if (mode === 'on_upload') return 'Expiry set on upload';
  return `${t.defaultRenewalMonths} months`;
}

/** Documents count towards RAG unless the type opts out (older records without the flag count). */
export const affectsRag = (t: Pick<ComplianceType, 'affectsRag'> | undefined): boolean => t?.affectsRag !== false;

/** Category suggestions for the document type form; the catalogue's own categories are added on top. */
export const DEFAULT_DOCUMENT_CATEGORIES = [
  'Fire safety',
  'Electrical',
  'Gas',
  'Water hygiene',
  'Asbestos',
  'Energy',
  'Licensing',
  'Lifts',
  'Insurance',
  'Tenancy',
  'Contracts',
  'Other',
];
