#!/usr/bin/env node

/**
 * EasyTemplate v2.0 — Clean New-Project Reset Engine
 *
 * Resets planning/MEMORY.md, PROJECT_STATUS.md, planning/task.md,
 * planning/updateplanning.md, planning/open-questions.md, and
 * planning/tasks/TASK-001.md .. TASK-006.md to a fresh, 0% starting state
 * so a new client project never inherits completed demo state.
 *
 * Usage:
 *   npm run new-project
 *   node scripts/new-project.js [targetDir]
 */

const fs = require('fs');
const path = require('path');

function readSettings(targetDir) {
  const defaults = {
    language: 'en',
    executionStrategy: 'FRONTEND_FIRST',
    backendStack: 'EXPRESS_MONGOOSE',
  };
  const settingsPath = path.join(targetDir, 'settings.json');
  if (!fs.existsSync(settingsPath)) return defaults;
  try {
    const parsed = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    return {
      language: parsed.language || defaults.language,
      executionStrategy: parsed.executionStrategy || defaults.executionStrategy,
      backendStack: parsed.backendStack || defaults.backendStack,
    };
  } catch {
    return defaults;
  }
}

function getFreshTemplates(settings, timestamp) {
  const langUpper = String(settings.language || 'en').toUpperCase();
  const strategy = settings.executionStrategy || 'FRONTEND_FIRST';
  const stack = settings.backendStack || 'EXPRESS_MONGOOSE';

  const projectStatusMd = `# 📊 Project Live Status & Module Checklist

> **Framework Version**: \`EasyTemplate v2.0\` (Universal Any-Backend + Figma/Screenshot 100% Clone + Client Reply & Full-Stack Ripple Modification Engine)  
> **Overall Progress**: \`[░░░░░░░░░░] 0% (0/6 Project Tasks Completed)\`  
> **Active Running Task**: \`[⏳ ACTIVE] TASK-001: Client Intake, Figma/Screenshot Analysis & Architecture Blueprint\`  
> **Execution Strategy**: \`${strategy}\` *(Supports \`FIGMA_TO_FULLSTACK\`, \`BOTH_FULLSTACK\`, \`BACKEND_FIRST\`)*  
> **Active Backend Stack**: \`${stack}\` *(Implemented: \`EXPRESS_MONGOOSE\`; Plan/Blueprint templates: \`EXPRESS_PRISMA_POSTGRES\`, \`NESTJS_PRISMA_POSTGRES\`, \`FASTAPI_PYTHON\`, \`CUSTOM_ANY\`)*  
> **Language Preference**: \`${langUpper}\` *(Configurable via \`npm run settings\` or \`settings.json\`)*  
> **Last Checkpoint**: \`${timestamp}\` (Local Time)  

---

## 🚀 1-Click Resume Command (Next Day / Fresh Session)
*When you resume or open a fresh AI chat window, copy and paste this line:*

\`\`\`text
Read PROJECT_STATUS.md and planning/MEMORY.md (Checkpoint: ${timestamp}) to restore session state and execute the next task [TASK-001].
\`\`\`

*(বাংলায় চালাতে চাইলে: \`PROJECT_STATUS.md এবং planning/MEMORY.md (চেকপয়েন্ট: ${timestamp}) দেখে সেশন স্টেট রিস্টোর করো এবং পরবর্তী টাস্কটি [TASK-001] এক্সিকিউট করো।\`)*

---

## 📦 Module-by-Module Progress & Checklist

### 🔹 Module 1: Intake, Figma/Screenshot Analysis & Architecture (\`TASK-001\` — \`READY\`)
- [ ] **Task 1.1**: Run \`npm run inputs\` (\`scripts/parse-inputs.js\`) to parse PDFs (\`zlib\` stream decompression), Telegram chats (\`messages.html\`/\`.txt\`/\`.json\`), Figma links (\`inputs/figma/figma_links.md\`), and UI screenshots (with exact \`width × height\` pixel dimensions)
- [ ] **Task 1.2**: Extract Figma / Screenshot design tokens into \`docs/04-design-system.md\` & \`frontend/DESIGN_GUIDELINES.md\`
- [ ] **Task 1.3**: Map screens & Figma Auto-Layout in \`docs/03-figma-analysis.md\` and \`PRD_AND_PLAN.md\`
- [ ] **Task 1.4**: Generate visual Database ERD (\`docs/07-database-design.md\`) & API Contract (\`docs/08-api-contract.md\`) + Backend Pre-Execution Gate (\`planning/BACKEND_PLAN.md\`)

### 🔹 Module 4: Frontend Layout, Figma Tokens & Design System (\`TASK-004\` — \`BACKLOG\`)
- [ ] **Task 4.1**: Configure Tailwind CSS brand variables in \`frontend/src/app/globals.css\` & \`frontend/tailwind.config.ts\`
- [ ] **Task 4.2**: Build 100% Figma/screenshot-accurate responsive Navbar with mobile drawer (\`<640px\`) (\`frontend/src/components/layout/Navbar.tsx\`)
- [ ] **Task 4.3**: Build global Footer (\`frontend/src/components/layout/Footer.tsx\`) & page wrapper shell (\`frontend/src/app/layout.tsx\`)

### 🔹 Module 2: Universal Database & Domain Schemas (\`TASK-002\` — \`BACKLOG\`)
- [ ] **Task 2.1**: Execute Backend Pre-Execution Gate (\`planning/BACKEND_PLAN.md\` prepared in \`TASK-001\`)
- [ ] **Task 2.2**: Create schemas/models for the active \`backendStack\` in \`backend/src/modules/\`
- [ ] **Task 2.3**: Configure database connection (\`backend/src/database/index.ts\`) & seed data (\`backend/src/database/seed.ts\`)

### 🔹 Module 3: Modular Backend REST APIs & Guards (\`TASK-003\` — \`BACKLOG\`)
- [ ] **Task 3.1**: Implement modular feature controllers, services, and validation pipes (\`backend/src/modules/\`)
- [ ] **Task 3.2**: Synchronize all endpoints with \`docs/08-api-contract.md\` and \`sendResponse\` envelope
- [ ] **Task 3.3**: Verify backend compilation (\`npm run build --prefix backend\`) & contract validation (\`npm run validate-contracts\`)

### 🔹 Module 5: Feature Pages, 11 UI Primitives & 6-State UI (\`TASK-005\` — \`BACKLOG\`)
- [ ] **Task 5.1**: Build Hero banner & visual showcase sections with semantic local assets (\`frontend/public/images/*\`)
- [ ] **Task 5.2**: Implement Card Grids, SpecTables, Tabs, and Modals using \`frontend/src/components/ui/\`
- [ ] **Task 5.3**: Enforce all 6 UI states (Default, Skeleton, Empty, Validation/Error, Responsive, Interactive/Focus)
- [ ] **Task 5.4**: Connect Next.js frontend with backend API endpoints (\`frontend/src/services/api.ts\`)

### 🔹 Module 6: Full Platform QA & Pre-Delivery Audit (\`TASK-006\` — \`BACKLOG\`)
- [ ] **Task 6.1**: Run full build & test verification (\`npm run build\`, \`npm test\`, \`npm run validate\`)
- [ ] **Task 6.2**: Run automated validation suites (\`npm run validate\`, \`npm run validate-contracts\`, \`npm run audit-assets\`)
- [ ] **Task 6.3**: Generate client delivery handover summary

---

## 📋 Task Status Summary

| Task ID | Module | Title | Status | Verification |
|---|---|---|---|---|
| \`TASK-001\` | Planning & Figma | Client Intake, Figma/Screenshot Analysis & Architecture Blueprint | \`[⏳ ACTIVE] READY\` | Pending \`npm run inputs\` & Developer Approval |
| \`TASK-004\` | Frontend Core | Figma/Screenshot Design Tokens, Navbar & Layout | \`BACKLOG\` | Awaiting \`TASK-001\` |
| \`TASK-002\` | Backend Data | Universal Database Schemas & ERD Models | \`BACKLOG\` | Awaiting \`TASK-001\` |
| \`TASK-003\` | Backend API | Modular Backend Routes, Services & Validation | \`BACKLOG\` | Awaiting \`TASK-002\` |
| \`TASK-005\` | Full-Stack | Feature Views, 6-State UI & API Integration | \`BACKLOG\` | Awaiting \`TASK-003\`, \`TASK-004\` |
| \`TASK-006\` | QA | Full Platform Verification & Build Audit | \`BACKLOG\` | Awaiting \`TASK-005\` |
`;

  const memoryMd = `# 🧠 Project Memory Bank & Continuous Session State

> **Purpose**: This file is the permanent memory of the project. Whenever a prompt is executed, the AI automatically logs the prompt summary, modified files, and verified system state here. When starting a fresh session or resuming the next day, the AI reads this file first to instantly restore 100% context with minimal token usage and zero workflow mismatch.

---

## 1. 📌 Active System State Snapshot (বর্তমান প্রজেক্টের লাইভ স্টেট)
*This section is automatically updated at the end of every prompt/task.*

- **Project Name**: EasyTemplate v2.0 Client Project (Fresh Workspace)
- **Last Active Session**: ${timestamp}
- **Overall Progress**: \`0% (0/6 Tasks Completed — Ready for TASK-001 Intake)\`
- **Language Preference**: \`${langUpper}\` *(Configurable via \`npm run settings\` or \`settings.json\`: \`en\` or \`bn\`)*
- **Current Execution Strategy**: \`${strategy}\` *(Supports \`FIGMA_TO_FULLSTACK\`, \`BOTH_FULLSTACK\`, \`BACKEND_FIRST\`)*
- **Active Backend Stack**: \`${stack}\` *(Implemented runtime: \`EXPRESS_MONGOOSE\`; Plan/Blueprint templates: \`EXPRESS_PRISMA_POSTGRES\`, \`NESTJS_PRISMA_POSTGRES\`, \`FASTAPI_PYTHON\`, \`CUSTOM_ANY\`)*
- **Next Project Task**: \`TASK-001: Client Intake, Figma/Screenshot Analysis & Architecture Blueprint\`
- **Overall System Health**: \`CLEAN_TEMPLATE_INITIALIZED\` (Awaiting client inputs in \`inputs/\` and \`TASK-001\` execution)
- **Recently Touched Files**:
  - \`PROJECT_STATUS.md\`, \`planning/MEMORY.md\`, \`planning/task.md\`, \`planning/updateplanning.md\`

---

## 2. ⚡ Cumulative Rolling Summary (টোকেন সাশ্রয়ী সামগ্রিক সারসংক্ষেপ)
*A high-density snapshot (<150 words) enabling any new AI session to grasp the entire project trajectory instantly.*

- **Status**: Workspace initialized to a clean starting state via \`scripts/new-project.js\`.
- **Next Action**: Drop client materials (PDF briefs, Telegram chat exports, Figma links, UI screenshots) into \`inputs/\`, run \`npm run inputs\`, and execute \`TASK-001\` to generate \`PRD_AND_PLAN.md\`, \`planning/BACKEND_PLAN.md\`, \`docs/07-database-design.md\`, and \`docs/08-api-contract.md\`.

---

## 3. 📜 Chronological Prompt & Task Execution Log (প্রম্পট ও কাজের ইতিহাস)
*Every user prompt, feature change, bug fix, and task completion is recorded here chronologically.*

| # | Time | User Prompt / Goal | Actions Taken & Files Modified | Verification / Build | Next Ready Step |
|---|---|---|---|---|---|
| 01 | ${timestamp} | Initialize clean project state (\`npm run new-project\`) | Reset \`PROJECT_STATUS.md\`, \`planning/MEMORY.md\`, \`planning/task.md\`, \`planning/updateplanning.md\`, \`planning/open-questions.md\`, and \`planning/tasks/TASK-001..006.md\`. | Verified Clean (0% state) | Execute \`TASK-001\` |

---

## 4. 🌅 Next-Day / Fresh Session Resume Protocol (পরবর্তী দিন বা নতুন চ্যাটে শুরু করার নিয়ম)

### In English:
\`\`\`text
Read PROJECT_STATUS.md and planning/MEMORY.md (Checkpoint: ${timestamp}) to restore session state and execute the next task [TASK-001].
\`\`\`

### বাংলায়:
\`\`\`text
PROJECT_STATUS.md এবং planning/MEMORY.md (চেকপয়েন্ট: ${timestamp}) দেখে সেশন স্টেট রিস্টোর করো এবং পরবর্তী টাস্কটি [TASK-001] এক্সিকিউট করো।
\`\`\`
`;

  const taskMd = `# Project Task Board (\`planning/task.md\`)

> **Workflow Rule**: 
> - Tasks are strictly executed sequentially 1-by-1 once a client project begins.
> - A task is only marked \`DONE\` after both Backend and Frontend build checks pass (\`npm run build\`).
> - Token Efficiency: For detailed instructions on an active task, inspect the isolated task file in \`planning/tasks/TASK-XXX.md\`.
> - Always update \`planning/MEMORY.md\` and \`PROJECT_STATUS.md\` after every task, modification, or client reply.

---

## Active Task Board (Ordered per \`${strategy}\` Execution Strategy)

| Task ID | Task Title | Domain | Dependencies | Status | Priority | Verification |
|---|---|---|---|---|---|---|
| [\`TASK-001\`](tasks/TASK-001.md) | Client Intake, Figma/Screenshot Analysis & Architecture Blueprint | Planning | None | \`READY\` | \`P0\` | Pending \`npm run inputs\` & Developer Approval |
| [\`TASK-004\`](tasks/TASK-004.md) | Frontend Design Tokens, Navbar & Layout (100% Figma/Screenshot Clone) | Frontend | \`TASK-001\` | \`BACKLOG\` | \`P0\` | Pending |
| [\`TASK-002\`](tasks/TASK-002.md) | Universal Database Schemas & ERD Models (Any Backend) | Backend | \`TASK-001\` | \`BACKLOG\` | \`P0\` | Pending |
| [\`TASK-003\`](tasks/TASK-003.md) | Modular Backend API Routes, Controllers & Validation | Backend | \`TASK-002\` | \`BACKLOG\` | \`P0\` | Pending |
| [\`TASK-005\`](tasks/TASK-005.md) | Frontend Feature Views, 6-State UI & API Integration | Full-Stack | \`TASK-003\`, \`TASK-004\` | \`BACKLOG\` | \`P0\` | Pending |
| [\`TASK-006\`](tasks/TASK-006.md) | Full Platform Verification & Build Audit | QA | \`TASK-005\` | \`BACKLOG\` | \`P0\` | Pending |

---

## Task Status Legend
- \`BACKLOG\`: Awaiting prior dependency completion.
- \`READY\`: All dependencies met; ready to be picked up in current or fresh session.
- \`IN_PROGRESS\`: Actively being coded.
- \`IN_REVIEW\`: Code written, pending build/test verification.
- \`DONE\`: Build passed, acceptance criteria validated.
- \`BLOCKED\`: Blocked by missing client specification (see \`planning/open-questions.md\`).
`;

  const updatePlanningMd = `# 🔄 Active Session Checkpoint (\`planning/updateplanning.md\`)

- **Last Updated**: \`${timestamp}\`
- **Framework Version**: \`EasyTemplate v2.0\` (Master Reusable Full-Stack Template)
- **Active Strategy**: \`${strategy}\` (Configurable: \`FIGMA_TO_FULLSTACK\`, \`BOTH_FULLSTACK\`, \`BACKEND_FIRST\`)
- **Active Backend Stack**: \`${stack}\`
- **Latest Milestone**: Clean project state initialized. Ready for client intake (\`TASK-001\`).
- **Next Ready Task**: \`TASK-001: Client Intake, Figma/Screenshot Analysis & Architecture Blueprint\`
- **Fresh Session Handoff Command**:
  \`Read PROJECT_STATUS.md and planning/MEMORY.md (Checkpoint: ${timestamp}) to restore session state and execute the next task [TASK-001].\`
`;

  const openQuestionsMd = `# Client Open Questions & Zero-Assumption Log (\`planning/open-questions.md\`)

> **Zero-Assumption Policy (\`AGENTS.md\` Mandate 4)**: AI agents must NEVER invent client requirements. Any missing, ambiguous, or contradictory specifications discovered during intake (\`TASK-001\`) or execution must be recorded here.

---

## Active Questions

| ID | Topic / Feature | Question for Client / Developer | Impact on Development | Status | Resolution |
|---|---|---|---|---|---|
| - | - | No open questions recorded yet. Run \`npm run inputs\` during \`TASK-001\`. | - | - | - |

---

## Resolved Questions Archive

| ID | Topic | Question | Final Resolution (Client Confirmed) | Date Resolved |
|---|---|---|---|---|
| - | - | - | - | - |
`;

  const tasks = {
    'TASK-001.md': `# TASK-001: Client Intake, Figma/Screenshot Analysis & Architecture Blueprint

- **Task ID**: \`TASK-001\`
- **Domain**: Architecture, Figma/Screenshot Analysis & Planning
- **Status**: \`READY\`
- **Priority**: \`P0\`
- **Assigned Role**: Architect / Orchestrator
- **Dependencies**: None

---

## 1. Objective
Run \`npm run inputs\` (\`node scripts/parse-inputs.js\`) to analyze all client materials in \`inputs/client_docs/\` (PDFs & Telegram chats), \`inputs/figma/\` (\`figma_links.md\`, tokens, exports), \`inputs/screenshots/\` (with exact pixel dimensions), and \`inputs/references.md\`. Resolve contradictions (Telegram chat overrides PDF brief), map design tokens (\`docs/04-design-system.md\`), prepare the Backend Pre-Execution Gate (\`planning/BACKEND_PLAN.md\`), and generate \`PRD_AND_PLAN.md\` with visual Mermaid flow diagrams, database plan, ERD diagram, and schemas for the active \`backendStack\`.

---

## 2. Deliverables
1. \`inputs/INTAKE_SUMMARY.md\`: Automated scan of Figma URLs, PDFs, Telegram chats, and screenshots.
2. \`PRD_AND_PLAN.md\`: Comprehensive breakdown of requirements, visual system architecture & user flow diagrams, database plan & visual ERD diagram (Mermaid), schemas with field matrices, API endpoints, and UI screen breakdown.
3. \`planning/BACKEND_PLAN.md\`: Pre-Execution Backend Gate document (System & API Flowchart, Visual Database ERD, and Endpoint Specification Matrix).
4. Update \`planning/task.md\` and \`PROJECT_STATUS.md\` with refined tasks ordered per active \`executionStrategy\`.
5. Update \`planning/open-questions.md\` with any unresolved client ambiguities under the Zero-Assumption Policy.

---

## 3. Acceptance Criteria
- [ ] All client files in \`inputs/\` are inspected (\`npm run inputs\` -> \`inputs/INTAKE_SUMMARY.md\`).
- [ ] Conflicting requirements between PDF brief, Figma, and Telegram chat are resolved in favor of Telegram.
- [ ] Visual System Architecture and User Journey flow diagrams are rendered using Mermaid.
- [ ] Database plan and visual ERD diagram (\`mermaid erDiagram\`) with relations and cardinality are documented.
- [ ] Backend data models (matching active \`backendStack\` in \`settings.json\`) are documented.
- [ ] Backend REST API endpoints are mapped with \`sendResponse\` request/response envelopes (\`docs/08-api-contract.md\`).
- [ ] Frontend screenshot/Figma breakdown (layout, colors, 11 UI primitives, 6 UI states, responsive breakpoints) is documented.
- [ ] Plan presented to human developer for \`"OK"\` / \`"Proceed"\` approval before application code is written.
`,
    'TASK-002.md': `# TASK-002: Universal Database Schemas & ERD Models

- **Task ID**: \`TASK-002\`
- **Domain**: Backend (Active \`backendStack\` in \`settings.json\`)
- **Status**: \`BACKLOG\`
- **Priority**: \`P0\`
- **Assigned Role**: Full-Stack Developer
- **Dependencies**: \`TASK-001\`

---

## 1. Objective
Implement TypeScript/Python interfaces and database models under \`backend/src/modules/\` based on the visual ERD diagram, relationships, and database schema specifications approved in \`PRD_AND_PLAN.md\`, \`planning/BACKEND_PLAN.md\`, and \`docs/07-database-design.md\`.

---

## 2. Deliverables
1. Domain interfaces & schemas/models in \`backend/src/modules/<feature>/\`.
2. Field validations, defaults, unique/compound indexes, foreign key references, soft-delete flags (\`isDeleted\`), and timestamps as defined in the ERD diagram.
3. Database connection & seed helper in \`backend/src/database/index.ts\` and \`backend/src/database/seed.ts\`.

---

## 3. Acceptance & Verification Criteria
- [ ] Database models strictly reflect the visual ERD diagram and schema tables in \`PRD_AND_PLAN.md\` and \`docs/07-database-design.md\`.
- [ ] Relationships and compound indexes match the database plan.
- [ ] Backend build (\`npm run build --prefix backend\`) and validation check exit with code 0.
`,
    'TASK-003.md': `# TASK-003: Backend API Routes, Controllers & Validation

- **Task ID**: \`TASK-003\`
- **Domain**: Backend (Express API)
- **Status**: \`BACKLOG\`
- **Priority**: \`P0\`
- **Assigned Role**: Full-Stack Developer
- **Dependencies**: \`TASK-002\`

---

## 1. Objective
Implement controllers, services, and route handlers for the backend API endpoints specified in \`PRD_AND_PLAN.md\` and \`docs/08-api-contract.md\`.

---

## 2. Deliverables
1. Service layer with business logic & database queries.
2. Controller functions utilizing \`sendResponse\` utility.
3. Express router modules mounted on \`/api/...\` and \`/api/v1/...\` (\`routes/index.ts\`).
4. Input validation and RBAC guards (\`validateRequest\`, \`requireAuth\`, and \`globalErrorHandler\`).

---

## 3. Acceptance & Verification Criteria
- [ ] Response adheres to standard envelope: \`{ success: true, statusCode: 200, message: string, meta?: object, data: any }\`.
- [ ] Invalid or unauthorized requests are rejected with \`400\` / \`401\` / \`403\` via \`validateRequest\`, \`requireAuth\`, and \`globalErrorHandler\`.
- [ ] Backend TypeScript compilation (\`npm run build --prefix backend\`) and contract validation pass with 0 errors.
`,
    'TASK-004.md': `# TASK-004: Frontend Design Tokens, Navbar & Layout (100% Figma/Screenshot-Accurate)

- **Task ID**: \`TASK-004\`
- **Domain**: Frontend (Next.js App Router / Tailwind CSS)
- **Status**: \`BACKLOG\`
- **Priority**: \`P0\`
- **Assigned Role**: Full-Stack Developer
- **Dependencies**: \`TASK-001\`

---

## 1. Objective
Extract exact colors, typography hierarchy, spacing, and component structure from \`inputs/figma/\` and \`inputs/screenshots/\` (\`docs/04-design-system.md\` & \`frontend/DESIGN_GUIDELINES.md\`) and implement the 100% pixel-accurate global layout shell (Navbar with Mobile Drawer \`< 640px\`, Desktop Navigation \`> 1024px\`, and Footer).

---

## 2. Deliverables
1. Semantic CSS variables & dark/light tokens in \`frontend/src/app/globals.css\` and \`frontend/tailwind.config.ts\`.
2. Responsive Header / Navbar component (\`frontend/src/components/layout/Navbar.tsx\`) with mobile drawer menu (\`< 640px\`) and desktop navigation (\`> 1024px\`).
3. Global Footer component (\`frontend/src/components/layout/Footer.tsx\`).
4. Root Layout integration in \`frontend/src/app/layout.tsx\`.

---

## 3. Acceptance & Verification Criteria
- [ ] Navbar, Footer, and theme tokens visually match the client's Figma design or screenshots 100%.
- [ ] Responsive navigation verified (mobile drawer + desktop menu + keyboard focus rings).
- [ ] Next.js compilation (\`npm run build --prefix frontend\`) passes with 0 errors.
`,
    'TASK-005.md': `# TASK-005: Frontend Feature Views & API Integration

- **Task ID**: \`TASK-005\`
- **Domain**: Frontend / Integration
- **Status**: \`BACKLOG\`
- **Priority**: \`P0\`
- **Assigned Role**: Full-Stack Developer
- **Dependencies**: \`TASK-003\`, \`TASK-004\`

---

## 1. Objective
Build the client-requested feature pages and integrate them with the backend Express API using \`frontend/src/services/api.ts\` or custom hooks.

---

## 2. Deliverables
1. Page routes in \`frontend/src/app/...\`.
2. Semantic visual assets in \`frontend/public/images/*\`.
3. 6 Mandatory UI States implemented on interactive components:
   - (1) Default / Success
   - (2) Loading Skeleton (\`<SkeletonProductCard />\`, \`<SkeletonTableRow />\`)
   - (3) Empty State (\`<EmptyState />\`)
   - (4) Validation / Error Alert (\`<Input error="..." />\`, \`<Alert variant="danger" />\`)
   - (5) Responsive Breakpoints (\`<640px\`, \`640px-1024px\`, \`>1024px\`)
   - (6) Interactive / Hover / Focus states (\`focus-visible:ring-2\`)
4. Reactive form handling and API mutation feedback (\`frontend/src/services/api.ts\`).

---

## 3. Acceptance & Verification Criteria
- [ ] Forms submit correct JSON payloads to the backend API and surface HTTP \`4xx/5xx\` errors clearly.
- [ ] UI states (loading, empty, error) display correctly without blank screens.
- [ ] Project & Contract validation suites (\`npm run validate\` & \`npm run validate-contracts\`) pass with 0 errors.
`,
    'TASK-006.md': `# TASK-006: Full Platform Verification & Build Audit

- **Task ID**: \`TASK-006\`
- **Domain**: QA & Verification
- **Status**: \`BACKLOG\`
- **Priority**: \`P0\`
- **Assigned Role**: QA Verifier
- **Dependencies**: \`TASK-005\`

---

## 1. Objective
Perform end-to-end audit, TypeScript compilation validation for both backend and frontend, run automated tests, and prepare clean client handover report.

---

## 2. Deliverables
1. Run backend build and API test suite in \`backend/\`.
2. Run frontend build and lint check in \`frontend/\`.
3. Execute \`scripts/validate-project.ps1\`, \`scripts/validate-contracts.ps1\`, and \`scripts/audit-assets.ps1\`.
4. Update \`planning/updateplanning.md\`, \`planning/task.md\`, \`PROJECT_STATUS.md\`, and \`planning/MEMORY.md\` marking all tasks completed.
5. Generate client handover summary with endpoint table, UI fidelity checklist, and git commit command.

---

## 3. Acceptance & Verification Criteria
- [ ] Backend build and API smoke tests pass with exit code 0.
- [ ] Frontend build passes with exit code 0.
- [ ] Zero unhandled errors in console (\`validate-project\`, \`validate-contracts\`, and \`audit-assets\` pass with 0 issues).
- [ ] Handover report delivered to human developer.
`,
  };

  return {
    projectStatusMd,
    memoryMd,
    taskMd,
    updatePlanningMd,
    openQuestionsMd,
    tasks,
  };
}

function resetProjectState(targetDir = path.resolve(__dirname, '..'), options = { overwriteExisting: true }) {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const settings = readSettings(targetDir);
  const templates = getFreshTemplates(settings, timestamp);

  const planningDir = path.join(targetDir, 'planning');
  const tasksDir = path.join(planningDir, 'tasks');
  fs.mkdirSync(tasksDir, { recursive: true });

  const writeIfAllowed = (relPath, content) => {
    const absPath = path.join(targetDir, relPath);
    if (!options.overwriteExisting && fs.existsSync(absPath)) {
      return false;
    }
    fs.mkdirSync(path.dirname(absPath), { recursive: true });
    fs.writeFileSync(absPath, content, 'utf8');
    return true;
  };

  writeIfAllowed('PROJECT_STATUS.md', templates.projectStatusMd);
  writeIfAllowed('planning/MEMORY.md', templates.memoryMd);
  writeIfAllowed('planning/task.md', templates.taskMd);
  writeIfAllowed('planning/updateplanning.md', templates.updatePlanningMd);
  writeIfAllowed('planning/open-questions.md', templates.openQuestionsMd);

  for (const [taskFile, content] of Object.entries(templates.tasks)) {
    writeIfAllowed(path.join('planning', 'tasks', taskFile), content);
  }

  // Clear any generated intake summary so the new project starts fresh
  const intakeSummaryPath = path.join(targetDir, 'inputs', 'INTAKE_SUMMARY.md');
  if (options.overwriteExisting && fs.existsSync(intakeSummaryPath)) {
    fs.unlinkSync(intakeSummaryPath);
  }

  return { timestamp, settings };
}

if (require.main === module) {
  const target = process.argv[2]
    ? path.resolve(process.argv[2])
    : path.resolve(__dirname, '..');
  const { timestamp, settings } = resetProjectState(target, { overwriteExisting: true });
  console.log('===============================================================');
  console.log('  ✨ EasyTemplate v2.0 — Clean New-Project State Initialized');
  console.log('===============================================================');
  console.log(`  📂 Workspace         : ${target}`);
  console.log(`  🕒 Checkpoint        : ${timestamp}`);
  console.log(`  🎯 Strategy          : ${settings.executionStrategy}`);
  console.log(`  ⚙️  Backend Stack     : ${settings.backendStack}`);
  console.log(`  📋 Active Next Task  : TASK-001 (READY — 0/6 Tasks Done)`);
  console.log('===============================================================');
}

module.exports = { resetProjectState, getFreshTemplates };
