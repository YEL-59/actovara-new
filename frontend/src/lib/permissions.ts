/**
 * RBAC matrix (PRD §3). The UI uses it to hide controls and the mock API uses it to return 403.
 * Hiding a control is not authorisation: the Express policy guards enforce the same rules (TASK-018).
 * Rows marked Q-xxx are working defaults awaiting client sign-off.
 */
import type { Role } from '@/types/domain';

export type Permission =
  | 'org.manage' // create / suspend organisations (platform)
  | 'org.settings' // org profile + notification settings
  | 'team.manage'
  | 'catalogue.manage'
  | 'property.write'
  | 'requirement.write'
  | 'certificate.write'
  | 'action.write'
  | 'action.verify' // Q-006: managers cannot verify by default
  | 'report.generate'
  | 'share.manage'
  | 'import.run' // Q-008
  | 'audit.view'
  | 'portfolio.view';

const MATRIX: Record<Role, Permission[]> = {
  platform_admin: ['org.manage', 'catalogue.manage', 'audit.view'],
  org_admin: ['org.settings', 'team.manage', 'catalogue.manage', 'property.write', 'requirement.write', 'certificate.write', 'action.write', 'action.verify', 'report.generate', 'share.manage', 'import.run', 'audit.view', 'portfolio.view'],
  manager: ['property.write', 'requirement.write', 'certificate.write', 'action.write', 'report.generate', 'import.run', 'portfolio.view'],
};

export function can(role: Role | undefined | null, permission: Permission): boolean {
  return !!role && MATRIX[role].includes(permission);
}

/** Audit-log label: an org role, or an external contact using a secure link. */
export const actorRoleLabel = (r: Role | 'external') => (r === 'external' ? 'External contact' : roleLabel[r]);

export const roleLabel: Record<Role, string> = {
  platform_admin: 'Platform Admin',
  org_admin: 'Org Admin',
  manager: 'Manager',
};
