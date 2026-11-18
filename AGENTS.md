# Autonomous Project Execution Protocol: EasyTemplate v2.0

This workspace enforces a **Plan-First, Context-Isolated, Universal Full-Stack Execution Engine** with persistent session memory, Figma/screenshot cloning, and modular skill playbooks (`.agents/skills/` and `.claude/skills/`).

---

## 1. Core Mandates

1. **Architecture (Zero-Docker Default)**:
   - **Frontend (`frontend/`)**: Next.js (App Router) + TypeScript + Tailwind CSS + Lucide Icons + 11 6-State UI Primitives (`frontend/src/components/ui/`).
   - **Backend (`backend/`)**: Modular domain pattern (`backend/src/modules/<feature>/`, `backend/AGENTS.md`) adhering to `docs/08-api-contract.md`.
     - `EXPRESS_MONGOOSE` *(Implemented default runtime)*: Node.js + Express + TypeScript + Mongoose (with in-memory seed fallback when MongoDB is unreachable).
     - `EXPRESS_PRISMA_POSTGRES`, `NESTJS_PRISMA_POSTGRES`, `FASTAPI_PYTHON`, `CUSTOM_ANY`: Plan/schema templates (`backend/prisma/schema.prisma`, `docs/06-backend-architecture.md`) to be scaffolded during `TASK-002`/`TASK-003` when selected in `settings.json`.
2. **Context Isolation & Skills**:
   - High-level task state lives in `PROJECT_STATUS.md` and `planning/task.md`; atomic specs live in `planning/tasks/TASK-XXX.md`.
   - Load **only** the active task spec and the blueprint/skill mapped in `docs/context-map.md`.
   - Skills live in both `.agents/skills/` and `.claude/skills/`: `project-planning`, `figma-to-fullstack`, `design-system`, `frontend-development`, `backend-development`, `api-contract-validation`, `task-execution`, `client-modification`, `client-communication`, `testing`.
3. **Conflict Resolution & Input Scanner (`npm run inputs`)**:
   - Priority: Active user prompt > Telegram chat exports (`inputs/client_docs/`) > Figma designs (`inputs/figma/figma_links.md`) > UI Screenshots (`inputs/screenshots/`) > Initial PDF/brief.
   - Run `node scripts/parse-inputs.js` (`npm run inputs`) to parse PDFs, Telegram chats, Figma links, and image dimensions into `inputs/INTAKE_SUMMARY.md`.
   - Run `npm run new-project` (`node scripts/new-project.js`) when starting a brand-new client project to reset `PROJECT_STATUS.md` and `planning/*` to a clean `0%` state.
4. **Zero-Assumption Policy**:
   - Never invent client requirements. Log missing specs in `planning/open-questions.md` and ask the developer.
5. **Persistent Session Memory**:
   - Every prompt execution, touched file, and build verification must be logged to `planning/MEMORY.md` and `PROJECT_STATUS.md`.
   - On session resume, read `PROJECT_STATUS.md` and `planning/MEMORY.md` first to restore context in under 300 tokens.
6. **Language Preference (`settings.json`)**:
   - Inspect `"language"` in `settings.json` (`"en"` or `"bn"`). Respond 100% in English when `"en"`, or Bangla when `"bn"`.
7. **Mandatory Backend Pre-Execution Gate**:
   - Before writing any backend schemas or routes, audit client briefs, Figma designs (`docs/03-figma-analysis.md`), and frontend views, then generate and present:
     1. End-to-End System & API Request Flowchart (`mermaid flowchart TD`)
     2. Visual Database ERD (`mermaid erDiagram`) in `docs/07-database-design.md`
     3. Endpoint Specification Matrix in `docs/08-api-contract.md` and `planning/BACKEND_PLAN.md`
   - **STOP & PRESENT TO DEVELOPER**: Wait for explicit `"OK"` / `"Proceed"` approval before coding backend modules.

---

## 2. The 3 Execution Phases

### Phase 1: Intake & Plan Generation (Before Coding)
1. Follow `.agents/skills/project-planning/SKILL.md` (and `.agents/skills/figma-to-fullstack/SKILL.md` if Figma links exist).
2. Run `npm run inputs`, resolve conflicts, confirm `executionStrategy` (`FRONTEND_FIRST`, `FIGMA_TO_FULLSTACK`, `BOTH_FULLSTACK`, or `BACKEND_FIRST`) and `backendStack` from `settings.json`.
3. Generate `PRD_AND_PLAN.md`, `planning/BACKEND_PLAN.md`, `docs/03`–`08`, and populate `planning/tasks/TASK-001.md`..`TASK-006.md`.
4. **STOP & PRESENT TO USER**: Do not write application code until the user replies `"OK"` or `"Proceed"`.

### Phase 2: Sequential Execution (1-by-1)
1. Follow `.agents/skills/task-execution/SKILL.md` for the next ready task in `PROJECT_STATUS.md`.
2. **Frontend 6-State Requirement**: Every interactive screen must implement (1) Default/Success, (2) Loading Skeleton, (3) Empty State, (4) Validation/Error Alert, (5) Responsive Breakpoints (`<640px`, `640-1024px`, `>1024px`), and (6) Keyboard Focus (`focus-visible:ring-2`).
3. **Zero-Placeholder Assets**: Store local visuals under semantic folders in `frontend/public/images/` (`hero`, `products`, `categories`, `gallery`, `features`, `anatomy`, `showroom`, `slices`).
4. **Build & Test Gate**: Run `npm run build --prefix backend`, `npm test --prefix backend`, and `npm run build --prefix frontend` (0 errors).
5. **Memory & Completion Card**: Update `planning/task.md`, `PROJECT_STATUS.md`, and `planning/MEMORY.md`, and display the bilingual Task Completion Report defined in `.agents/skills/task-execution/SKILL.md`.

### Phase 3: Final Verification & Handover
1. Run `.agents/skills/testing/SKILL.md` checks: `npm run validate`, `npm run validate-contracts`, `npm test`, and `npm run audit-assets`.
2. Present the client handover summary and startup commands (`npm run dev`).

---

## 3. Client Modifications & Client Replies

- **Client Modifications (Phase 5 Ripple)**: Follow `.agents/skills/client-modification/SKILL.md`. Audit `planning/MEMORY.md`, trace changes across Database (`docs/07-database-design.md`) -> Backend (`docs/08-api-contract.md`) -> Frontend UI, verify builds, and log to `planning/MEMORY.md`.
- **Client Communication**: Follow `.agents/skills/client-communication/SKILL.md`. Read `inputs/client_comms/incoming_message.md` and `planning/MEMORY.md`, draft Quick Chat + Formal Platform replies, and log to `inputs/client_comms/reply_history.md`.
