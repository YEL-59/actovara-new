import type {
  Action,
  ActionUpdate,
  AuditEvent,
  Certificate,
  ComplianceType,
  Evidence,
  ImportLog,
  NotificationLog,
  Organisation,
  Property,
  PropertyRequirement,
  Report,
  ShareAccess,
  ShareLink,
  User,
} from '@/types/domain';

export interface ShareSecret {
  shareLinkId: string;
  tokenHash: string;
  passwordHash?: string;
}

/** The whole in-memory demo database. */
export interface MockDb {
  version: number;
  seededAt: string;
  organisation: Organisation;
  /** Other tenants — only visible in the platform admin console. */
  otherOrganisations: Organisation[];
  users: User[];
  complianceTypes: ComplianceType[];
  properties: Property[];
  requirements: PropertyRequirement[];
  certificates: Certificate[];
  actions: Action[];
  actionUpdates: ActionUpdate[];
  evidence: Evidence[];
  reports: Report[];
  shareLinks: ShareLink[];
  shareAccesses: ShareAccess[];
  /** Server-side only: hashed token + optional hashed password per link. Never returned by an API. */
  shareSecrets: ShareSecret[];
  notifications: NotificationLog[];
  auditEvents: AuditEvent[];
  imports: ImportLog[];
  counters: { action: number; property: number };
}
