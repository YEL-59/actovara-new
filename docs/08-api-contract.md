# 08 — API Contracts: Frontend & Any-Backend Bridge (`docs/08-api-contract.md`)

> **Validation Script**: `powershell -ExecutionPolicy Bypass -File scripts/validate-contracts.ps1` (`npm run validate-contracts`)  
> **Synchronized with**: `PRD_AND_PLAN.md` & `planning/BACKEND_PLAN.md`

---

## 1. Global Conventions
- **Base URL**: `http://localhost:5000/api` (or `/api/v1`)
- **Format**: JSON (`Content-Type: application/json`)
- **Authentication**: `Authorization: Bearer <token>` or HTTP-Only Cookie
- **Standard Success Envelope (`sendResponse`)**:
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Operation completed successfully",
    "meta": {
      "page": 1,
      "limit": 12,
      "total": 24
    },
    "data": {}
  }
  ```
- **Standard Error Envelope (`globalErrorHandler`)**:
  ```json
  {
    "success": false,
    "message": "Validation failed",
    "errorSources": [
      {
        "path": "field_name",
        "message": "Validation error detail"
      }
    ]
  }
  ```

---

## 2. Core Endpoints Specification

### 2.1 System, Health & Interactive Swagger Documentation
- `GET /api` — Root API status check & endpoint directory (`{ name, version, status, swaggerDocs, openApiJson }`).
- `GET /api/docs` — **Interactive Swagger UI Explorer** (OpenAPI 3.0.3 with JWT Bearer authorization support and offline explorer fallback).
- `GET /api/docs/json` (or `GET /api/docs.json`) — Raw OpenAPI 3.0.3 JSON specification for Postman/Insomnia/TypeScript SDK generation.
- `GET /api/health` — Detailed backend stack, database state, and uptime telemetry (`{ status, stack, database, uptime }`).

### 2.2 Authentication & Users
- `POST /api/auth/register` — Register new user account (`{ name, email, password }` -> `{ user, token }`). Always creates role `user`; sending `role` is rejected (400). Password min 8 chars, stored as salted scrypt.
- `POST /api/auth/login` — Authenticate user and issue JWT (`{ email, password }` -> `{ user, token }`).
- `GET /api/auth/me` — Retrieve current authenticated user profile (`{ user }`).

### 2.3 Categories CRUD
- `GET /api/categories` — List active categories (`?isActive=true` -> `[ Category... ]`).
- `GET /api/categories/:slug` — Retrieve single category by slug or ID (`Category`).
- `POST /api/categories` — Create new category (`{ name, slug, description, icon }` -> `Category`, Admin Protected).
- `PATCH /api/categories/:id` — Partial update of category (`Category`, Admin Protected).
- `DELETE /api/categories/:id` — Soft-delete category (`{ id, isDeleted: true }`, Admin Protected).

### 2.4 Primary Resource (`items`) CRUD
- `GET /api/items` — Paginated & filtered resource listing (`?page=1&limit=12&search=&category=&featured=&badge=&sortBy=&sortOrder=` -> `[ Item... ]` + `meta`).
- `GET /api/items/:slug` — Detailed single resource view with populated category and `specifications` matrix (`Item`).
- `POST /api/items` — Create new catalog item (Admin Protected).
- `PATCH /api/items/:id` — Partial update of catalog item (Admin Protected).
- `DELETE /api/items/:id` — Soft-delete catalog item (`{ id, isDeleted: true }`, Admin Protected).

### 2.5 Orders & Line Items (`orders`) CRUD
- `GET /api/orders` — List orders (`?userId=&status=` -> `[ Order... ]`, Auth Required). Users see only their own orders; `userId` filter is admin-only.
- `GET /api/orders/:id` — Retrieve order by `_id` or `orderNumber` (`Order`, Auth Required; non-owners get 404).
- `POST /api/orders` — Create order with calculated line-item subtotals (`{ items: [{ itemId, quantity }] }` -> `Order`, Auth Required). Owner is taken from the token; status is always `PENDING`.
- `PATCH /api/orders/:id/status` — Update order fulfillment status (`{ status }` -> `Order`, Admin Protected).

### 2.6 Actovara — Corrective Action Lifecycle (`actions`)
> Mirrors `frontend/src/services/actions.service.ts` (mock implementation). Workflow: `open → in_progress → awaiting_verification → closed`, with `closed → in_progress` on reopen and `awaiting_verification → in_progress` on "request more evidence".
> **Completion methods (client revision 24 Nov 2026):** the owner submits an action for verification either **with evidence** (≥1 uploaded file) or **by written confirmation** (completion note only). Both go through Org Admin verification and keep the full audit trail. `Action.evidenceRequired = true` forces the evidence route.
- **`Action` fields added:** `evidenceRequired: boolean` (default `false`); `completion?: { method: 'evidence' | 'confirmation', note, completedBy, completedAt }` (latest submission; cleared on reopen and on request-more). `ActionUpdate.completionMethod?` is set on `verification_requested` entries.
- `GET /api/actions` — List (`?propertyId=&status=&priority=&ownerId=&overdue=&search=&sort=due|priority|created&page=&limit=` -> `[ ActionView... ]` + `meta`). `ActionView` = `Action` + `propertyName`, `ownerName`, `verifiedByName?` (closed actions: name of the Org Admin in `closure.verifiedBy`), `completedByName?` (name of `completion.completedBy`).
- `GET /api/actions/:id` — `{ action: ActionView, updates: ActionUpdate[], evidence: Evidence[] }`.
- `POST /api/actions` — `{ propertyId, certificateId?, title, description?, source, sourceRef?, priority, ownerId, dueDate, evidenceRequired? }` -> `Action` (`action.write`).
- `PATCH /api/actions/:id` — `{ title?, description?, priority?, ownerId?, dueDate?, dueDateReason?, evidenceRequired? }` -> `Action` (`action.write`; changing `evidenceRequired` also needs `action.verify`, i.e. Org Admin, so an owner cannot waive it; 409 if closed).
- `POST /api/actions/:id/evidence` — Multipart upload (`file`, `description`) -> `Evidence` (`action.write`; 409 if closed).
- `POST /api/actions/:id/request-verification` — `{ method: 'evidence' | 'confirmation', note }` -> `Action` (`action.write`; 409 unless open/in progress). `note` is required (400). `evidence` needs ≥1 non-rejected evidence item (409). `confirmation` is refused with 409 when `evidenceRequired`. Records `completion { method, note, completedBy: <actor>, completedAt: now }`.
- `POST /api/actions/:id/verify` — `{ decision: 'accept' | 'request_more', summary?, reason?, acceptedEvidenceIds[], requireEvidence? }` -> `Action` (`action.verify`, Org Admin only; 409 unless awaiting verification). `accept` requires `summary`, plus ≥1 accepted evidence item **only when `completion.method = 'evidence'`**, and records `closure { verifiedBy, verifiedAt, summary }`. `request_more` requires `reason`, clears `completion`, returns the action to `in_progress` and, with `requireEvidence: true`, sets `evidenceRequired`.
- `POST /api/actions/:id/reopen` — `{ reason }` -> `Action` (`action.verify`; 409 unless closed). Clears `closure` and `completion`, increments `reopenCount`, status `in_progress`.
- Every transition writes an `ActionUpdate` (timeline, with `fromStatus`/`toStatus`, author and reason) and an audit-log entry (the submission entry names the completion method).
- Report snapshot `actions[]` adds `completionMethod?`, `completionNote?`, `completedByName?`.

### 2.8 Actovara — Action Attachments & External Action Links
> Client request 26 Nov 2026 (TASK-MOD-002). Mirrors `frontend/src/services/actions.service.ts` (attachments) and `frontend/src/services/action-links.service.ts` (external links). Same security model as landlord share links: 32-byte random token, only its hash stored, expiry, withdrawal, access count, no indexing, `Referrer-Policy: no-referrer`.
- **Attachments (reference files when raising an action):** `Action.attachments[] { _id, file: FileSummary, description?, uploadedBy, createdAt }`. They are separate from completion `Evidence`.
  - `POST /api/actions/:id/attachments`: multipart (`file`, `description?`) -> `ActionAttachment` (`action.write`; 409 if closed). The create form uploads them straight after `POST /api/actions`.
  - `GET /api/actions/:id/files/:fileId` -> `SignedFileUrl` (attachment or evidence file of that action).
- **External links (signed in):** `ActionLink { _id, actionId, contact { name, email, role: contractor|facilities_manager|landlord|tenant|resident|other, company? }, message?, allowEvidence, tokenHint, expiresAt, createdBy, createdAt, emailStatus, revokedAt?, revokedBy?, accessCount, lastAccessedAt? }`.
  - `GET /api/actions/:id/external-links` -> `ActionLink[]`.
  - `POST /api/actions/:id/external-links`: `{ name, email, role, company?, message?, days (1–90), allowEvidence }` -> `{ link, url }` (`action.write`; 409 if closed). Sends the email (NotificationLog `type: 'action_external'`) and logs a `sent_to_contact` timeline entry and an audit event. `allowEvidence` is forced on when `evidenceRequired`. The full URL is returned once only.
  - `POST /api/external-links/:id/revoke` -> `ActionLink` (`action.write`). Logs `external_link_revoked`.
- **External links (public, token only, no account):**
  - `GET /api/public/action-links/:token` -> `PublicActionView`: organisation, property name and address, reference, title, description, priority, due date, status, message, attachments, the external conversation history, `awaitingReview`. Owners, internal notes, other actions and other contacts are never included. 404 for an unknown token; 410 when withdrawn, expired or no longer available.
  - `POST …/:token/comments` `{ body }` -> `PublicActionView`. Logs `external_comment` (`ActionUpdate.external = true`, author = contact). 409 if closed.
  - `POST …/:token/evidence` multipart (`file`, `description`) -> `PublicActionView`. Creates `Evidence { external: true }`. 409 when uploads are not allowed, the action is closed, or it is awaiting verification.
  - `POST …/:token/complete` `{ note }` -> `PublicActionView`. Records `completion { method: evidence|confirmation, note, completedBy: <linkId>, completedAt, externalContact }` and moves the action to `awaiting_verification`. The Org Admin then verifies or returns it via §2.6 as normal. 409 when `evidenceRequired` and no evidence exists.
  - `GET …/:token/files/:fileId` -> `SignedFileUrl` (attachments only).
- **Audit:** public writes record `actorRole: 'external'` with the contact's name.
- **Backend notes:** use a transactional email provider (sender domain with SPF/DKIM). Rate-limit public endpoints per token and IP. Scan uploads for malware like other uploads. Bounce webhooks update `emailStatus`.

### 2.7 Actovara — Document Types Catalogue (`compliance-types`)
> Mirrors `complianceTypesService` in `frontend/src/services/certificates.service.ts`. Shown in the UI as **Settings → Document Types**. Org Admins (`catalogue.manage`) add and manage organisation document types (`orgId` = their org) alongside the global statutory catalogue (`orgId: null`, Platform Admin).
- **`ComplianceType` fields:** `name`, `code` (unique, immutable), `category` (free text; UI suggests existing + defaults), `applicableTo: PropertyType[]`, `defaultRenewalMonths: number | null`, `storeOnly: boolean`, **`affectsRag: boolean`** (new, default `true`), `legislationRefs[]` (versioned), `sortOrder`, `active`.
- **Expiry mode** (derived, `frontend/src/lib/documents.ts`): `storeOnly: true` = no expiry, no reminders · `storeOnly: false` + `defaultRenewalMonths: N` = fixed cycle, expiry calculated from the issue date unless typed in · `storeOnly: false` + `defaultRenewalMonths: null` = **expiry date entered on upload** (upload and CSV import reject a missing expiry with 400).
- **`affectsRag: false`**: requirement status is still computed and shown (register, certificates, reports, reminders) but the requirement is excluded from property `ragStatus`, `counts`, `nextDue`, dashboard gauges, urgent list and overdue KPI, and report snapshot `counts`. Report snapshot `requirements[]` carries `affectsRag`.
- `GET /api/compliance-types` — `?active=` -> `ComplianceType[]` sorted by `sortOrder`.
- `POST /api/compliance-types` — `{ name, code, category, applicableTo[], storeOnly, defaultRenewalMonths: number | null, affectsRag?, sortOrder?, legislation? }` -> `ComplianceType` (201). Renewal months, when given, must be 1–120. **Side effect:** creates a `missing` requirement on every existing property whose type is in `applicableTo` (message: "Document type added and added to N properties").
- `PATCH /api/compliance-types/:id` — any of the above except `code`, plus `active` -> `ComplianceType`. Widening `applicableTo` or reactivating attaches the type to the properties that lack it. Requirements are never deleted (their certificates are history). New legislation text appends a version.
- Both writes record an audit event with a before/after diff.
