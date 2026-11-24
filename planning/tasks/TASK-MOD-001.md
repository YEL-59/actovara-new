# TASK-MOD-001 — Action completion by confirmation + custom document types

- **Source**: Sardip (client), Telegram, 24 Nov 2026 (`inputs/modifications/telegram_chats/telegram_chat.txt`)
- **Type**: Client modification (Phase 5 ripple), frontend + mock API + API contract. The backend is still on hold (FRONTEND_FIRST).
- **Status**: `DONE` (frontend build verified)

## Request 1: close corrective actions without mandatory evidence

| Layer | Change |
|---|---|
| Data (`types/domain.ts`) | `Action.evidenceRequired: boolean`; `Action.completion?: { method: 'evidence' \| 'confirmation', note, completedBy, completedAt }`; `ActionUpdate.completionMethod?`; `ActionView.completedByName?`; report snapshot actions get `completionMethod`, `completionNote`, `completedByName` |
| API / mock (`services/actions.service.ts`) | `request-verification` takes `{ method, note }` (note required; evidence route needs ≥1 file; confirmation refused when `evidenceRequired`). `verify` accept needs evidence only for the evidence route; `request_more` can set `requireEvidence`. Reopen and request-more clear `completion`. Only an Org Admin can change `evidenceRequired` |
| UI | `RequestVerificationModal` → "Submit for verification" with *With evidence* / *By confirmation*. `VerifyActionModal` shows a `CompletionSummary` (who, how, when, note), makes evidence optional for confirmations and adds a "Require evidence when resubmitted" checkbox. `ActionFormModal` has a "Require evidence to close this action" checkbox. The action record has a Completion card, an "Evidence required" badge, a "To close this action" detail and an Org Admin toggle. The Actions list shows "· by confirmation". Report sheet and download show the completion method |
| Contract | `docs/08-api-contract.md` §2.6 |

## Request 2: custom document types

| Layer | Change |
|---|---|
| Data | `ComplianceType.affectsRag: boolean` (default true). Expiry mode is derived (`lib/documents.ts`): fixed cycle / entered on upload (`storeOnly:false` + `defaultRenewalMonths:null`) / none (store only) |
| Engine (`mocks/engine.ts`, `dashboard.service.ts`, `mocks/helpers.ts`) | `affectsRag:false` requirements are excluded from property RAG, counts, nextDue, gauges, dashboard urgent list, overdue KPI and report counts. They still show their own status |
| API / mock (`certificates.service.ts`, `imports.service.ts`) | Creating a type, widening "applies to" or reactivating it **attaches it to existing properties**. This was a gap: new types never reached existing properties. Upload and CSV import require an expiry date for types without a renewal cycle. Renewal months are validated 1–120 |
| UI | Settings tab renamed **Document Types**. Form has a free-text category with suggestions (this also fixes the old fixed list, which did not match the seeded categories), three expiry modes and a "Counts towards RAG status" switch. The catalogue has Expiry and RAG columns. The register shows a "Not in RAG" tag. The upload modal requires the expiry date when the type has no cycle |
| Seed (`MOCK_DB_VERSION` 5 → 6) | Org types *Buildings Insurance Policy* (expiry on upload, not in RAG; Elm House's policy is expired but the property stays green) and *Tenancy Deposit Protection Certificate* (store only, not in RAG). Two confirmation actions: ACT-0031 "Remove rubbish from storage area" (closed, Brookfield House) and ACT-0032 "Replace missing fire action notice in reception" (Wellington Court) (awaiting verification). Urgent seeded actions require evidence |
| Contract | `docs/08-api-contract.md` §2.7 |

## Verification
- `npx tsc --noEmit` (frontend): 0 errors
- `npm run build --prefix frontend`: passed (20/20 pages, 0 errors)
- Backend build/test: not run. `backend/` has no node_modules and is on hold until client sign-off. No backend files changed
