# 🧠 Project Memory Bank & Continuous Session State

> **Purpose**: This file is the permanent memory of the project. Whenever a prompt is executed, the AI automatically logs the prompt summary, modified files, and verified system state here. When starting a fresh session or resuming the next day, the AI reads this file first to instantly restore 100% context with minimal token usage and zero workflow mismatch.

---

## 1. 📌 Active System State Snapshot (বর্তমান প্রজেক্টের লাইভ স্টেট)
*This section is automatically updated at the end of every prompt/task.*

- **Project Name**: Actovara — Know. Act. Prove. (Compliance & Action Management Platform)
- **Last Active Session**: 2026-11-24 (client revision TASK-MOD-001)
- **Overall Progress**: `17% (1/6 Tasks Completed — TASK-004 Frontend Aligned & Verified; TASK-001 Ready for PostgreSQL ERD/API Gate)`
- **Language Preference**: `EN` *(Configurable via `npm run settings` or `settings.json`: `en` or `bn`)*
- **Current Execution Strategy**: `FRONTEND_FIRST` *(Supports `FIGMA_TO_FULLSTACK`, `BOTH_FULLSTACK`, `BACKEND_FIRST`)*
- **Active Backend Stack**: `NESTJS_PRISMA_POSTGRES` *(Implemented runtime: `EXPRESS_MONGOOSE`; Plan/Blueprint templates: `EXPRESS_PRISMA_POSTGRES`, `NESTJS_PRISMA_POSTGRES`, `FASTAPI_PYTHON`, `CUSTOM_ANY`)*
- **Next Project Task**: `Awaiting Client Frontend Sign-Off → then TASK-001 (PostgreSQL ERD & API Contract Gate)`
- **Overall System Health**: `FRONTEND_READY_FOR_CLIENT_SIGNOFF` (`tsc --noEmit` & `next build` pass; backend paused until client confirms)
- **Recently Touched Files**:
  - `frontend/src/types/domain.ts`, `frontend/src/mocks/engine.ts`, `frontend/src/components/dashboard/PropertyOverviewCard.tsx`, `frontend/src/components/dashboard/PropertyOverviewList.tsx`, `frontend/src/components/dashboard/KpiRow.tsx`, `planning/task.md`, `PROJECT_STATUS.md`, `planning/MEMORY.md`

---

## 2. ⚡ Cumulative Rolling Summary (টোকেন সাশ্রয়ী সামগ্রিক সারসংক্ষেপ)
*A high-density snapshot (<150 words) enabling any new AI session to grasp the entire project trajectory instantly.*

- **Status**: Workspace initialized to a clean starting state via `scripts/new-project.js`.
- **Next Action**: Drop client materials (PDF briefs, Telegram chat exports, Figma links, UI screenshots) into `inputs/`, run `npm run inputs`, and execute `TASK-001` to generate `PRD_AND_PLAN.md`, `planning/BACKEND_PLAN.md`, `docs/07-database-design.md`, and `docs/08-api-contract.md`.

---

## 3. 📜 Chronological Prompt & Task Execution Log (প্রম্পট ও কাজের ইতিহাস)
*Every user prompt, feature change, bug fix, and task completion is recorded here chronologically.*

| # | Time | User Prompt / Goal | Actions Taken & Files Modified | Verification / Build | Next Ready Step |
|---|---|---|---|---|---|
| 01 | 2026-11-17 18:03 | Initialize clean project state (`npm run new-project`) | Reset `PROJECT_STATUS.md`, `planning/MEMORY.md`, `planning/task.md`, `planning/updateplanning.md`, `planning/open-questions.md`, and `planning/tasks/TASK-001..006.md`. | Verified Clean (0% state) | Execute `TASK-001` |

---

## 4. 🌅 Next-Day / Fresh Session Resume Protocol (পরবর্তী দিন বা নতুন চ্যাটে শুরু করার নিয়ম)

### In English:
```text
Read PROJECT_STATUS.md and planning/MEMORY.md (Checkpoint: 2026-11-17 18:03) to restore session state and execute the next task [TASK-001].
```

### বাংলায়:
```text
PROJECT_STATUS.md এবং planning/MEMORY.md (চেকপয়েন্ট: 2026-11-17 18:03) দেখে সেশন স্টেট রিস্টোর করো এবং পরবর্তী টাস্কটি [TASK-001] এক্সিকিউট করো।
```

---

## Migration Note (2026-11-17)
- Project migrated from Avengers Protocol v1.0 to EasyTemplate v2.0 (see `planning/decisions.md` ADR-004).
- **Existing work**: `frontend/` already holds the Actovara Next.js app (auth, dashboard, properties, certificates, actions, reports, settings, admin, share) on mock data in `frontend/src/mocks/`. Do not regenerate it from scratch.
- **Backend**: `backend/` is a NestJS + Prisma stub. Scaffold per ADR-003 after the Backend Pre-Execution Gate.
- **Client inputs**: `inputs/client_docs/` (PDF, DOCX briefs, Telegram chat, Jannatul reply 16-11).
- Pre-migration backup: `C:\Users\Tofayel\Desktop\actovara-new_BACKUP_before_easytemplate_v2`.

## Fix (2026-11-18): Sidebar detached when a modal/drawer opens
- Cause: `useFocusTrap` set `body { overflow: hidden }`; with `html { overflow-x: clip }` the body became its own scroll container, so the sticky sidebar jumped to its unscrolled position (looked cut off on scrolled pages, e.g. /actions/act_011 "Upload evidence").
- Fix: scroll lock moved to `<html>` with scrollbar-width padding compensation in `frontend/src/lib/hooks/useFocusTrap.ts`.

## Client revision (2026-11-19): Sardip — closing corrective actions (MVP) + Phase 2 inspections question
- Source: `inputs/modifications/telegram_chats/telegram_chat.txt`.
- Finding: the verify/close/reopen flow already existed (`actions.service.ts` verify/reopen and the detail page), but only on the action record and only for Org Admin (`action.verify`). The Actions tab had no lifecycle controls.
- Built:
  - `frontend/src/components/actions/ActionQuickActions.tsx` (new): a ⋯ menu per row/card with Verify & close, Request more evidence, Request verification, Add progress note, Upload evidence, Reopen and Open record, depending on status and permission. It reuses the existing modals.
  - `ActionTable.tsx` / `ActionBoard.tsx`: menu, `onChanged` reload, and `VerifiedMeta` ("Verified by X · date").
  - `actions/page.tsx`: Org Admin banner "N awaiting your verification → Review now".
  - `actions/[id]/page.tsx`: verifier name from `verifiedByName`; button renamed "Review evidence & close"; demo link to switch to Org Admin.
  - `VerifyActionModal`: new `initialDecision` prop. `ActionView.verifiedByName` added (types + service mapper). `docs/08-api-contract.md` §2.6 documents the action lifecycle endpoints.
- Phase 2 inspections: reply only, logged as Q-P2-01. Budget confirmation is Q-BUD-01 (Jannatul to confirm).
- Reply draft: `inputs/client_comms/reply_2026-11-19_sardip.md`.

## Client revision (2026-11-24): Sardip — close actions by confirmation + custom document types
- Source: `inputs/modifications/telegram_chats/telegram_chat.txt`. Spec: `planning/tasks/TASK-MOD-001.md`. Contract: `docs/08-api-contract.md` §2.6 (updated), §2.7 (new).
- **Actions:** `Action.evidenceRequired` + `Action.completion { method: evidence|confirmation, note, completedBy, completedAt }`. "Submit for verification" (renamed from "Request verification") offers *With evidence* / *By confirmation*. A completion note is required for both. Org Admin verification is unchanged, but evidence is only required to accept when the completion was with evidence. Only an Org Admin can change `evidenceRequired`; request-more can set it.
- **Document types:** `ComplianceType.affectsRag` (default true) excludes a type from RAG, counts, nextDue, gauges, dashboard urgent/overdue and report counts. Expiry mode is derived in `frontend/src/lib/documents.ts` (renewal / on_upload = `storeOnly:false` + months `null` / none). Creating or widening a type now attaches it to existing properties (previous gap). Category is free text. The Settings tab is renamed "Document Types" (route unchanged).
- **Seed:** `MOCK_DB_VERSION` 6 (resets browser demo data). Org types INS (insurance, expiry on upload, not in RAG; expired at Elm House, which stays green) and TDP (store only, not in RAG). ACT-0031 is closed by confirmation, ACT-0032 is awaiting verification by confirmation. Urgent seeded actions require evidence.
- Touched: `types/domain.ts`, `lib/documents.ts` (new), `mocks/{engine,seed,helpers}.ts`, `services/{actions,certificates,dashboard,imports,reports}.service.ts`, `components/actions/{ActionLifecycleModals,ActionQuickActions,ActionFormModal,ActionTable}.tsx`, `app/(app)/actions/[id]/page.tsx`, `components/settings/{ComplianceTypeModal,SettingsNav}.tsx`, `app/(app)/settings/{compliance-types/page,layout}.tsx`, `components/property-detail/RegisterTab.tsx`, `components/certificates/CertificateUploadModal.tsx`, `components/reports/ReportSheet.tsx`.
- Budget: Q-BUD-02 (Jannatul to confirm). Reply draft: `inputs/client_comms/reply_2026-11-24_sardip.md`.
- Verification: `tsc --noEmit` 0 errors; `npm run build --prefix frontend` passed (20/20 pages). Backend gate not run (no node_modules, backend on hold, untouched).

## SECURITY (2026-11-24): origin/main compromised — push halted
- `git fetch` showed origin/main force-updated to `3f1409f`. It forges the 19 Nov commit (same author, message and date) but adds obfuscated JS after a long run of tabs in `frontend/postcss.config.js`, new `init`/`frontend/init`/`backend/init` files, and `node init &&` in the dev/build scripts.
- The initial commit `e7e4060` already contained `.vscode/tasks.json` (hidden, `runOn: folderOpen`, running `node .vscode/ini`, an obfuscated payload) and `.vscode/settings.json` with `task.allowAutomaticTasks: true`. The local working tree had already been cleaned (19 Nov 14:31) but the cleanup was not committed.
- The local working tree was scanned and is clean: no `init` files, no `node init`, no obfuscated code outside node_modules, no git hooks.
- **Do NOT `git pull` or merge origin/main.** Nothing was pushed. Next steps (developer): rotate GitHub credentials and scan the machine, then commit the clean tree and overwrite the remote, then protect the branch.
