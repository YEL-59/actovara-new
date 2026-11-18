# Project Task Board (`planning/task.md`)

> **Workflow Rule**: 
> - Tasks are strictly executed sequentially 1-by-1 once a client project begins.
> - A task is only marked `DONE` after both Backend and Frontend build checks pass (`npm run build`).
> - Token Efficiency: For detailed instructions on an active task, inspect the isolated task file in `planning/tasks/TASK-XXX.md`.
> - Always update `planning/MEMORY.md` and `PROJECT_STATUS.md` after every task, modification, or client reply.

---

## Active Task Board (Ordered per `FRONTEND_FIRST` Execution Strategy)

| Task ID | Task Title | Domain | Dependencies | Status | Priority | Verification |
|---|---|---|---|---|---|---|
| [`TASK-004`](tasks/TASK-004.md) | Actovara Frontend MVP, Brand Logo, Know/Act/Prove, RAG & Photo Upload | Frontend | None | `DONE` | `P0` | `npx tsc --noEmit` & `npm run build` passed |
| [`TASK-001`](tasks/TASK-001.md) | Client Intake (`Jannatul Reply - 16-11.pdf`), PostgreSQL ERD & API Contract Gate | Planning | None | `READY` | `P0` | `npm run inputs` done; pending ERD/API Gate |
| [`TASK-002`](tasks/TASK-002.md) | PostgreSQL + Prisma Database Schemas & Multi-Org Isolation (`NESTJS_PRISMA_POSTGRES`) | Backend | `TASK-001` | `BACKLOG` | `P0` | Pending |
| [`TASK-003`](tasks/TASK-003.md) | NestJS Modular REST APIs, RBAC, PDF Reports & Audit Trail | Backend | `TASK-002` | `BACKLOG` | `P0` | Pending |
| [`TASK-005`](tasks/TASK-005.md) | Frontend Live API Integration (`NEXT_PUBLIC_USE_MOCKS=false`) & 6-State QA | Full-Stack | `TASK-003`, `TASK-004` | `BACKLOG` | `P0` | Pending |
| [`TASK-006`](tasks/TASK-006.md) | Full Platform Verification, Contract Validation & Handover Audit | QA | `TASK-005` | `BACKLOG` | `P0` | Pending |

---

## Task Status Legend
- `BACKLOG`: Awaiting prior dependency completion.
- `READY`: All dependencies met; ready to be picked up in current or fresh session.
- `IN_PROGRESS`: Actively being coded.
- `IN_REVIEW`: Code written, pending build/test verification.
- `DONE`: Build passed, acceptance criteria validated.
- `BLOCKED`: Blocked by missing client specification (see `planning/open-questions.md`).
