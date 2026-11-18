# 🗺️ Task-to-Context Routing Map (`docs/context-map.md`)

> **Context Routing Guide**: Load only the documents mapped to your current task domain to achieve 90% token savings.

| Task Domain | Read First | Inspect When Needed | Skill Playbook |
|---|---|---|---|
| **Client Intake & Planning** | `settings.json`, `project.config.md`, `inputs/INTAKE_SUMMARY.md` | `inputs/client_docs/`, `inputs/figma/figma_links.md`, `PRD_AND_PLAN.md` | `.agents/skills/project-planning/SKILL.md` |
| **Figma-to-Fullstack** | `inputs/figma/figma_links.md`, `docs/03-figma-analysis.md`, `docs/04-design-system.md` | `docs/07-database-design.md`, `docs/08-api-contract.md` | `.agents/skills/figma-to-fullstack/SKILL.md` |
| **UI/UX & Design Tokens** | `docs/04-design-system.md`, `frontend/DESIGN_GUIDELINES.md` | `frontend/src/app/globals.css`, `frontend/tailwind.config.ts` | `.agents/skills/design-system/SKILL.md` |
| **Frontend Web Pages** | `planning/tasks/TASK-XXX.md`, `docs/03-figma-analysis.md`, `docs/08-api-contract.md` | `docs/05-frontend-architecture.md`, `frontend/src/components/ui/` | `.agents/skills/frontend-development/SKILL.md` |
| **Backend Pre-Execution Gate** | `SRS.md`, `docs/03-figma-analysis.md`, `frontend/src/app/` | `planning/BACKEND_PLAN.md`, `docs/07-database-design.md` | `.agents/skills/backend-development/SKILL.md` |
| **Backend Modules & APIs** | `planning/tasks/TASK-XXX.md`, `backend/AGENTS.md`, `docs/08-api-contract.md` | `docs/06-backend-architecture.md`, `docs/07-database-design.md`, `docs/09-error-handling-and-logging.md` | `.agents/skills/backend-development/SKILL.md` |
| **Client Modifications** | `planning/MEMORY.md`, `PROJECT_STATUS.md`, `inputs/modifications/` | `docs/07-database-design.md`, `docs/08-api-contract.md`, targeted files | `.agents/skills/client-modification/SKILL.md` |
| **Client Messages & Replies** | `inputs/client_comms/incoming_message.md`, `planning/MEMORY.md`, `PROJECT_STATUS.md` | `inputs/client_docs/telegram_chat.txt`, `inputs/client_comms/reply_history.md` | `.agents/skills/client-communication/SKILL.md` |
| **QA & Verification** | `docs/11-testing-strategy.md`, `docs/12-deployment-and-devops.md`, `docs/13-acceptance-criteria.md` | `scripts/validate-project.ps1`, `scripts/validate-contracts.ps1` | `.agents/skills/testing/SKILL.md` |
