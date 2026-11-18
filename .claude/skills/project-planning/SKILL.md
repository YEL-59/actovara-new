---
name: project-planning
description: Workflow for analyzing client requirements (PDF briefs, Telegram chat exports, Figma links, and screenshots), preparing technical blueprints in docs/ and PRD_AND_PLAN.md, and decomposing isolated tasks in planning/tasks/.
---

# Project Planning & Client Intake Workflow

## Purpose
Translate raw client materials (`inputs/client_docs/`, `inputs/figma/`, `inputs/screenshots/`, `inputs/references.md`) into structured technical blueprints (`PRD_AND_PLAN.md` & `docs/`) and atomic task files (`planning/tasks/TASK-XXX.md`) with zero wasted tokens and zero invented requirements.

## Prerequisites
1. Read `settings.json` and `project.config.md` (verify active `language`, `executionStrategy`, and `backendStack`).
2. Run `node scripts/parse-inputs.js` (`npm run inputs`) or inspect:
   - `inputs/client_docs/telegram_chat.txt` / `messages.html` / `result.json`
   - `inputs/client_docs/requirements.md` / `.pdf`
   - `inputs/figma/figma_links.md` & `inputs/figma/exports/`
   - `inputs/screenshots/` & `inputs/references.md`

## Execution Steps

### 1. Conflict Resolution & Zero-Assumption Discovery
- Apply strict hierarchy: **Active User Prompt > Telegram Chat (`messages.html` / `.txt`) > Figma Designs > Initial PDF Brief**.
- Record any missing or ambiguous business logic in `planning/open-questions.md`. Never guess client intent.

### 2. Technical Blueprint Generation (`PRD_AND_PLAN.md` & `docs/`)
Generate or update the core technical specifications:
- `PRD_AND_PLAN.md`: Master Visual Blueprint (Mermaid System Architecture, User Journey Flowchart, API Sequence Diagram, Database ERD, and Screen Mapping).
- `docs/01-requirements-analysis.md`: Functional (`REQ-F-001`...) & Non-functional requirements.
- `docs/02-system-architecture.md`: Full-stack architecture matched to the selected `backendStack`.
- `docs/03-figma-analysis.md`: Figma frame/node inventory, responsive breakpoints, and screenshot mapping.
- `docs/04-design-system.md`: Semantic CSS variables, colors, typography scale, and 6 UI states.
- `docs/06-backend-architecture.md`: Modular backend architecture for the active stack (`EXPRESS_MONGOOSE`, `EXPRESS_PRISMA_POSTGRES`, `NESTJS_PRISMA_POSTGRES`, `FASTAPI_PYTHON`, or `CUSTOM_ANY`).
- `docs/07-database-design.md`: Visual Mermaid ERD + Mongoose or Prisma/SQL schema definitions.
- `docs/08-api-contract.md`: Endpoints, request/response DTOs, and standardized `sendResponse` envelope.

### 3. Granular Task Decomposition (`planning/tasks/TASK-XXX.md`)
- Populate `planning/task.md` and `PROJECT_STATUS.md`.
- Create isolated ~50-line task files in `planning/tasks/TASK-001.md`..`TASK-00N.md` ordered according to `executionStrategy` (`FRONTEND_FIRST`, `BOTH_FULLSTACK`, `BACKEND_FIRST`, or `FIGMA_TO_FULLSTACK`).

### 4. Human Approval Gate
- Stop and present the plan in the user's configured language (`en` or `bn`). Do not write application code until approved with `"OK"` or `"Proceed"`.
