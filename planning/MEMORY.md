# 🧠 Project Memory Bank & Continuous Session State

> **Purpose**: This file is the permanent memory of the project. Whenever a prompt is executed, the AI automatically logs the prompt summary, modified files, and verified system state here. When starting a fresh session or resuming the next day, the AI reads this file first to instantly restore 100% context with minimal token usage and zero workflow mismatch.

---

## 1. 📌 Active System State Snapshot (বর্তমান প্রজেক্টের লাইভ স্টেট)
*This section is automatically updated at the end of every prompt/task.*

- **Project Name**: Actovara — Know. Act. Prove. (Compliance & Action Management Platform)
- **Last Active Session**: 2026-11-18 10:05
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
