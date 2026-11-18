# TASK-001: Client Intake, Figma/Screenshot Analysis & Architecture Blueprint

- **Task ID**: `TASK-001`
- **Domain**: Architecture, Figma/Screenshot Analysis & Planning
- **Status**: `READY`
- **Priority**: `P0`
- **Assigned Role**: Architect / Orchestrator
- **Dependencies**: None

---

## 1. Objective
Run `npm run inputs` (`node scripts/parse-inputs.js`) to analyze all client materials in `inputs/client_docs/` (PDFs & Telegram chats), `inputs/figma/` (`figma_links.md`, tokens, exports), `inputs/screenshots/` (with exact pixel dimensions), and `inputs/references.md`. Resolve contradictions (Telegram chat overrides PDF brief), map design tokens (`docs/04-design-system.md`), prepare the Backend Pre-Execution Gate (`planning/BACKEND_PLAN.md`), and generate `PRD_AND_PLAN.md` with visual Mermaid flow diagrams, database plan, ERD diagram, and schemas for the active `backendStack`.

---

## 2. Deliverables
1. `inputs/INTAKE_SUMMARY.md`: Automated scan of Figma URLs, PDFs, Telegram chats, and screenshots.
2. `PRD_AND_PLAN.md`: Comprehensive breakdown of requirements, visual system architecture & user flow diagrams, database plan & visual ERD diagram (Mermaid), schemas with field matrices, API endpoints, and UI screen breakdown.
3. `planning/BACKEND_PLAN.md`: Pre-Execution Backend Gate document (System & API Flowchart, Visual Database ERD, and Endpoint Specification Matrix).
4. Update `planning/task.md` and `PROJECT_STATUS.md` with refined tasks ordered per active `executionStrategy`.
5. Update `planning/open-questions.md` with any unresolved client ambiguities under the Zero-Assumption Policy.

---

## 3. Acceptance Criteria
- [ ] All client files in `inputs/` are inspected (`npm run inputs` -> `inputs/INTAKE_SUMMARY.md`).
- [ ] Conflicting requirements between PDF brief, Figma, and Telegram chat are resolved in favor of Telegram.
- [ ] Visual System Architecture and User Journey flow diagrams are rendered using Mermaid.
- [ ] Database plan and visual ERD diagram (`mermaid erDiagram`) with relations and cardinality are documented.
- [ ] Backend data models (matching active `backendStack` in `settings.json`) are documented.
- [ ] Backend REST API endpoints are mapped with `sendResponse` request/response envelopes (`docs/08-api-contract.md`).
- [ ] Frontend screenshot/Figma breakdown (layout, colors, 11 UI primitives, 6 UI states, responsive breakpoints) is documented.
- [ ] Plan presented to human developer for `"OK"` / `"Proceed"` approval before application code is written.
