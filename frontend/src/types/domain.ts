/** Core domain types — shared by mock fixtures now and Mongoose models later (PRD §6.4). */
export type Role = 'platform_admin' | 'org_admin' | 'manager';
export type PropertyType = 'residential' | 'hmo' | 'commercial' | 'mixed';
export type RequirementStatus = 'valid' | 'due_soon' | 'overdue' | 'missing' | 'not_applicable' | 'store_only';
export type Rag = 'green' | 'amber' | 'red';
export type ActionStatus = 'open' | 'in_progress' | 'awaiting_verification' | 'closed';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';
/** How the owner completed an action before submitting it for verification. */
export type CompletionMethod = 'evidence' | 'confirmation';
/**
 * Derived from `storeOnly` + `defaultRenewalMonths` (see `expiryMode()` in `lib/documents.ts`):
 * renewal = fixed cycle, expiry calculated from the issue date · on_upload = expiry date typed in on upload · none = store only.
 */
export type ExpiryMode = 'renewal' | 'on_upload' | 'none';

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  postcode: string;
}

export interface Property {
  _id: string;
  orgId: string;
  reference: string;
  name: string;
  address: Address;
  type: PropertyType;
  units?: number;
  floors?: number;
  managerId?: string;
  contacts: { name: string; role?: string; email?: string; phone?: string }[];
  coverImageUrl?: string;
  status: 'active' | 'archived';
  ragStatus: Rag;
  counts?: {
    certificates: number;
    overdue: number;
    dueSoon: number;
    missing: number;
    openActions: number;
    overdueActions?: number;
    urgentActions?: number;
  };
  nextDue?: { date: string; complianceTypeName: string };
  createdAt: string;
  updatedAt: string;
}

export interface ComplianceType {
  _id: string;
  orgId: string | null;
  name: string;
  code: string;
  category: string;
  applicableTo: PropertyType[];
  /** Renewal cycle used to calculate expiry. `null` with `storeOnly: false` = the expiry date is entered on upload. */
  defaultRenewalMonths: number | null;
  /** No expiry date and no reminders: the document is just kept on file. */
  storeOnly: boolean;
  /** When false the document is tracked and stored but never changes the property's RAG status, counts or gauges. */
  affectsRag: boolean;
  legislationRefs: { version: number; text: string; effectiveFrom: string; editedBy: string }[];
  sortOrder: number;
  active: boolean;
}

export interface PropertyRequirement {
  _id: string;
  propertyId: string;
  complianceTypeId: string;
  applicability: 'applicable' | 'not_applicable';
  naReason?: string;
  renewalMonthsOverride?: number;
  currentCertificateId?: string;
  status: RequirementStatus;
  nextDueDate?: string;
}

export interface Certificate {
  _id: string;
  propertyId: string;
  requirementId: string;
  complianceTypeId: string;
  version: number;
  isCurrent: boolean;
  issueDate: string;
  reviewDate?: string;
  expiryDate?: string;
  expiryCalculated: boolean;
  file: { _id: string; name: string; mimeType: string; sizeBytes: number; scanStatus: string };
  notes?: string;
  uploadedBy: { _id: string; name: string };
  createdAt: string;
}

export interface Action {
  _id: string;
  reference: string;
  propertyId: string;
  certificateId?: string;
  title: string;
  description?: string;
  source: 'manual' | 'report_finding';
  sourceRef?: string;
  priority: Priority;
  ownerId: string;
  dueDate: string;
  status: ActionStatus;
  isOverdue: boolean;
  /** When true the owner must attach evidence; otherwise a written completion note is enough. */
  evidenceRequired: boolean;
  /**
   * Latest submission for verification: who completed the work, how, and their note. Cleared on reopen or return.
   * `externalContact` is set when an external contact completed it through a secure link (`completedBy` = the link id).
   */
  completion?: { method: CompletionMethod; note: string; completedBy: string; completedAt: string; externalContact?: string };
  /** Reference photos/documents added when the action was raised (or later). Not completion evidence. */
  attachments?: ActionAttachment[];
  closure?: { verifiedBy: string; verifiedAt: string; summary: string };
  reopenCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApiEnvelope<T> {
  success: boolean;
  statusCode: number;
  message?: string;
  meta?: { page: number; limit: number; total: number; totalPage: number };
  data: T;
}

/* ------------------------------------------------------------------------ */
/* Supporting entities (PRD §6.2) — added in TASK-004 for the mock layer.    */
/* ------------------------------------------------------------------------ */

export type UserStatus = 'invited' | 'active' | 'deactivated';

export interface Organisation {
  _id: string;
  name: string;
  legalName?: string;
  email: string;
  phone?: string;
  address: Address;
  settings: {
    reminderThresholds: number[];
    dueSoonDays: number;
    reminderRecipients: string[];
    timezone: string;
  };
  seatLimit: number;
  status: 'active' | 'suspended';
  createdAt: string;
}

export interface User {
  _id: string;
  orgId: string | null;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  jobTitle?: string;
  notificationPrefs: { thresholds: number[]; overdueActions: boolean; unsubscribed: boolean };
  lastLoginAt?: string;
  createdAt: string;
}

export interface ActionAttachment {
  _id: string;
  file: FileSummary;
  description?: string;
  uploadedBy: { _id: string; name: string };
  createdAt: string;
}

export type ExternalContactRole = 'contractor' | 'facilities_manager' | 'landlord' | 'tenant' | 'resident' | 'other';

/**
 * Secure link that sends one action to an external contact (no Actovara account). The token is only in
 * the email; the server keeps a hash (like landlord share links).
 */
export interface ActionLink {
  _id: string;
  actionId: string;
  contact: { name: string; email: string; role: ExternalContactRole; company?: string };
  message?: string;
  /** Whether the contact may upload photos/documents as completion evidence. */
  allowEvidence: boolean;
  tokenHint: string;
  expiresAt: string;
  createdBy: { _id: string; name: string };
  createdAt: string;
  emailStatus: 'sent' | 'delivered' | 'bounced';
  revokedAt?: string;
  revokedBy?: { _id: string; name: string };
  accessCount: number;
  lastAccessedAt?: string;
}

/** What the external contact sees at `/action-link/:token`. No owners, internal notes or other actions. */
export interface PublicActionView {
  organisationName: string;
  propertyName: string;
  /** Address line, town and postcode so a contractor can find the site. */
  address: string;
  reference: string;
  title: string;
  description?: string;
  priority: Priority;
  dueDate: string;
  status: ActionStatus;
  /** Message the property manager wrote when sending the link. */
  message?: string;
  contactName: string;
  allowEvidence: boolean;
  evidenceRequired: boolean;
  expiresAt: string;
  attachments: { _id: string; name: string; mimeType: string; sizeBytes: number; description?: string }[];
  /** The external conversation only: what was sent, the contact's comments and submissions, returns and closure. */
  history: { _id: string; at: string; author: string; kind: 'sent' | 'comment' | 'evidence' | 'submitted' | 'returned' | 'closed'; body?: string }[];
  /** True while the contact's completion is waiting for the property manager. */
  awaitingReview: boolean;
}

export type ActionUpdateType =
  | 'created'
  | 'note'
  | 'status_change'
  | 'evidence_added'
  | 'verification_requested'
  | 'more_evidence_requested'
  | 'verified'
  | 'reopened'
  | 'due_date_changed'
  | 'reassigned'
  | 'attachment_added'
  | 'sent_to_contact'
  | 'external_link_revoked'
  | 'external_comment';

export interface ActionUpdate {
  _id: string;
  actionId: string;
  author: { _id: string; name: string };
  type: ActionUpdateType;
  body?: string;
  /** Set on `verification_requested` entries. */
  completionMethod?: CompletionMethod;
  /** Written by an external contact through a secure link (author `_id` is the link id). */
  external?: boolean;
  fromStatus?: ActionStatus;
  toStatus?: ActionStatus;
  createdAt: string;
}

export interface FileSummary {
  _id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  scanStatus: 'pending' | 'clean' | 'infected' | 'failed';
}

export interface Evidence {
  _id: string;
  actionId: string;
  file: FileSummary;
  description: string;
  status: 'submitted' | 'accepted' | 'rejected';
  uploadedBy: { _id: string; name: string };
  /** Uploaded by an external contact through a secure action link. */
  external?: boolean;
  reviewedBy?: { _id: string; name: string };
  reviewedAt?: string;
  createdAt: string;
}

export interface ReportSnapshotData {
  organisation: { name: string; address?: string; primaryContactEmail?: string };
  property: {
    _id: string;
    name: string;
    reference: string;
    address: string;
    postcode: string;
    propertyType: PropertyType;
    managerName: string;
  };
  counts: {
    valid: number;
    dueSoon: number;
    overdue: number;
    missing: number;
    notApplicable: number;
    storeOnly: number;
    openActions: number;
    closedActions: number;
  };
  requirements: Array<{
    _id: string;
    complianceTypeName: string;
    category: string;
    status: RequirementStatus;
    isApplicable: boolean;
    /** False for document types that are stored without affecting the RAG status. */
    affectsRag: boolean;
    expiryDate?: string;
    currentCertificateName?: string;
    currentCertificateVersion?: number;
  }>;
  certificates: Array<{
    _id: string;
    complianceTypeName: string;
    fileName: string;
    version: number;
    issueDate: string;
    expiryDate?: string;
    uploadedByName: string;
  }>;
  actions: Array<{
    _id: string;
    reference: string;
    title: string;
    priority: Priority;
    status: ActionStatus;
    dueDate: string;
    ownerName: string;
    evidenceRefs: string[];
    completionMethod?: CompletionMethod;
    completionNote?: string;
    completedByName?: string;
    closureSummary?: string;
    closedAt?: string;
  }>;
  disclaimerText: string;
}

export interface Report {
  _id: string;
  propertyId: string;
  reference: string;
  generatedBy: { _id: string; name: string };
  generatedAt: string;
  file: FileSummary;
  snapshot: { rag: Rag; requirements: number; overdue: number; dueSoon: number; missing: number; openActions: number };
  snapshotData?: ReportSnapshotData;
  disclaimerVersion: string;
}

export interface ShareLink {
  _id: string;
  propertyId: string;
  /** Last 6 characters of the token, for identification only (full token is shown once). */
  tokenHint: string;
  expiresAt: string;
  passwordProtected: boolean;
  createdBy: { _id: string; name: string };
  createdAt: string;
  revokedAt?: string;
  revokedBy?: { _id: string; name: string };
  accessCount: number;
  lastAccessedAt?: string;
}

export interface ShareAccess {
  _id: string;
  shareLinkId: string;
  accessedAt: string;
  ip: string;
  userAgent: string;
  outcome: 'granted' | 'bad_password' | 'expired' | 'revoked';
}

/** Why a public share link cannot be opened (sent as `errorSources[0].message` with HTTP 410). */
export type ShareUnavailableReason = 'expired' | 'revoked' | 'unavailable';

/**
 * The landlord's read-only view (`POST /public/share/:token`). Deliberately minimal:
 * no files, notes, owners, evidence, people or audit data ever leave the server.
 */
export interface PublicShareView {
  organisationName: string;
  propertyName: string;
  /** Town and postcode only. */
  locality: string;
  rag: Rag;
  generatedAt: string;
  expiresAt: string;
  requirements: { complianceTypeName: string; status: RequirementStatus; expiryDate?: string }[];
  openActions: { title: string; dueDate: string }[];
}

export type NotificationType = 'cert_expiry' | 'action_overdue' | 'action_assigned' | 'action_external' | 'invite' | 'password_reset';

export interface NotificationLog {
  _id: string;
  userId?: string;
  recipientEmail: string;
  type: NotificationType;
  subject: string;
  entityType?: 'certificate' | 'action' | 'user';
  entityId?: string;
  threshold?: number;
  status: 'queued' | 'sent' | 'delivered' | 'bounced' | 'failed';
  sentAt?: string;
  createdAt: string;
}

export type AuditActionVerb =
  | 'create'
  | 'update'
  | 'delete'
  | 'archive'
  | 'login'
  | 'logout'
  | 'login_failed'
  | 'export'
  | 'share'
  | 'revoke'
  | 'download'
  | 'verify'
  | 'reopen'
  | 'import';

export interface AuditEvent {
  _id: string;
  orgId: string | null;
  actorId: string;
  actorName: string;
  /** `external` = a contact acting through a secure action link (no Actovara account). */
  actorRole: Role | 'external';
  action: AuditActionVerb;
  entityType: 'property' | 'certificate' | 'action' | 'report' | 'share_link' | 'user' | 'organisation' | 'compliance_type' | 'session';
  entityId?: string;
  summary: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  ip: string;
  createdAt: string;
}

/** Dashboard payload (GET /dashboard). */
export interface DashboardSummary {
  gauges: { overall: number; certificatesInDate: number; actionsClosed: number };
  kpis: {
    certificatesInDate: number;
    overdueItems: number;
    openActions: number;
    totalProperties: number;
    trends: { certificatesInDate: number; overdueItems: number; openActions: number };
  };
  urgentRequirements: (PropertyRequirement & { propertyName: string; complianceTypeName: string })[];
  openActions: Action[];
  properties: Property[];
  lastUpdated: string;
}

export interface ListQuery {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
}

/* View models returned by list/detail endpoints (joined fields for display). */
export interface RequirementView extends PropertyRequirement {
  complianceType: ComplianceType;
  currentCertificate?: Certificate;
}

export interface CertificateView extends Certificate {
  propertyName: string;
  propertyReference: string;
  complianceTypeName: string;
  /** Status of the requirement this certificate currently satisfies (current versions only). */
  requirementStatus?: RequirementStatus;
  /** When a newer version replaced this one (history endpoint only). */
  supersededAt?: string;
}

/** Short-lived signed link to a stored file (PRD §7: files are never public). */
export interface SignedFileUrl {
  url: string;
  expiresAt: string;
  fileName: string;
  mimeType: string;
}

export interface ActionView extends Action {
  propertyName: string;
  ownerName: string;
  /** Name of the Org Admin who verified and closed the action (closed actions only). */
  verifiedByName?: string;
  /** Name of the person who submitted the completion (`completion.completedBy`). */
  completedByName?: string;
}

export interface ActionDetail {
  action: ActionView;
  updates: ActionUpdate[];
  evidence: Evidence[];
}

export interface ReportView extends Report {
  propertyName: string;
}

export interface TeamPayload {
  users: User[];
  seatLimit: number;
  activeCount: number;
}

export interface AdminOrganisationView extends Organisation {
  activeUsers: number;
  propertyCount: number;
  adminEmail?: string;
}

export interface CreateOrganisationInput {
  name: string;
  legalName?: string;
  email: string;
  phone?: string;
  address: Address;
  seatLimit?: number;
  adminName: string;
  adminEmail: string;
}

export type ImportType = 'properties' | 'certificates';
export type ImportDateFormat = 'dd/mm/yyyy' | 'yyyy-mm-dd' | 'dd Mon yyyy';

export interface ImportRowError {
  row: number;
  field?: string;
  message: string;
}

export interface ImportDuplicate {
  row: number;
  identifier: string;
  existingId: string;
  reason: string;
}

export interface ImportPreviewRow {
  row: number;
  raw: Record<string, string>;
  mapped: Record<string, string>;
  status: 'valid' | 'duplicate' | 'error';
  errors: string[];
  warning?: string;
}

export interface ImportPreview {
  importId: string;
  type: ImportType;
  fileName: string;
  dateFormat: ImportDateFormat;
  columns: string[];
  suggestedMapping: Record<string, string>;
  mapping: Record<string, string>;
  totalRows: number;
  validCount: number;
  duplicateCount: number;
  errorCount: number;
  rows: ImportPreviewRow[];
  errors: ImportRowError[];
  duplicates: ImportDuplicate[];
}

export interface ImportLog {
  _id: string;
  orgId: string;
  importType: ImportType;
  fileName: string;
  dateFormat: ImportDateFormat;
  totalRows: number;
  importedCount: number;
  skippedCount: number;
  errorCount: number;
  status: 'completed' | 'partial' | 'failed';
  createdBy: { _id: string; name: string };
  createdAt: string;
}
