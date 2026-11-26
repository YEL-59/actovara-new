/**
 * Data services. Each one calls the in-memory mock store while USE_MOCKS is on,
 * otherwise the Express API (`/api/...`, PRD §7). Both return the same
 * `ApiEnvelope<T>` ({ success, statusCode, message, meta?, data }), so screens
 * don't change when the backend arrives.
 */
export { USE_MOCKS, ENABLE_CSV_IMPORT } from './config';
export { ApiError, isApiError, errorMessage } from './errors';
export { currentMockState } from './mock-adapter';
export { propertiesService, UK_POSTCODE_RE } from './properties.service';
export type { PropertyListQuery, PropertyInput, PropertySort } from './properties.service';
export { certificatesService, complianceTypesService } from './certificates.service';
export type { CertificateListQuery, CertificateSort, CertificateSummary, CertificateUploadInput } from './certificates.service';
export { actionsService } from './actions.service';
export { actionLinksService, publicActionService, EXTERNAL_ROLE_LABEL, ACTION_LINK_DAY_OPTIONS, externalAuthorName, actionLinkStatus } from './action-links.service';
export type { SendActionLinkInput } from './action-links.service';
export type { ActionListQuery, ActionInput } from './actions.service';
export { dashboardService } from './dashboard.service';
export { reportsService, sharingService, publicShareService, SHARE_DEFAULT_DAYS, SHARE_MAX_DAYS } from './reports.service';
export { organisationService, teamService, notificationsService, auditService, adminService } from './organisation.service';
export type { AuditQuery } from './organisation.service';
export { importsService, SAMPLE_PROPERTY_CSV, SAMPLE_CERTIFICATE_CSV } from './imports.service';
export type { ImportPreviewInput, ImportCommitResult } from './imports.service';
export { demoService } from './demo.service';
export { authService } from './auth.service';
export type { AuthPayload, LoginInput, TokenCheck, TokenStatus } from './auth.service';
