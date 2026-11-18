# Architecture & Technical Decisions Log

> This document records confirmed technical choices, architectural patterns, and design trade-offs. Once recorded and approved, agents must adhere to these decisions and not alter them without human approval.

---

## Decision Records

### ADR-001: Adoption of Hierarchical Multi-Agent System (Avengers Protocol)
- **Date**: 2026-11-02
- **Status**: APPROVED
- **Context**: Monolithic single-agent workflows lead to high token burn, context contamination, and lack of specialized domain discipline.
- **Decision**: Adopt a Chief Orchestrator (`iron_man`) with 6 specialized agents (`jarvis`, `friday`, `edith`, `thor`, `thanos`, `ultron`).
- **Consequences**:
  - Positive: Clean context isolation, reduced token waste, independent testing verification.
  - Trade-off: Requires task decomposition and contract-driven communication through `docs/` and `planning/task.md`.

### ADR-002: Default Technology Stack Selection
- **Date**: 2026-11-02
- **Status**: APPROVED
- **Context**: The template requires modern, scalable, and type-safe default technologies.
- **Decision**:
  - Frontend: Next.js (App Router), TypeScript, Tailwind CSS, Zustand, TanStack Query.
  - Backend: NestJS, TypeScript, PostgreSQL, Prisma ORM, Redis.
  - Mobile (Optional): Flutter (Dart) with Riverpod/Bloc.
  - Infrastructure: Docker multi-stage builds and Nginx reverse proxy.
- **Consequences**:
  - High developer velocity, end-to-end type safety, production-ready containerization.

### ADR-003: Confirmation of PostgreSQL for Actovara Production Database
- **Date**: 2026-11-17
- **Status**: APPROVED
- **Context**: Client feedback (`Jannatul Reply - 16-11.pdf`) requested confirmation between PostgreSQL (original proposal) and MongoDB/Express (mentioned in an earlier frontend walkthrough).
- **Decision**: Use **PostgreSQL (v15+)** with **Prisma ORM** and **NestJS (TypeScript)** for all backend data persistence, multi-organisation isolation, relational compliance records, versioned certificates, corrective actions, and immutable audit logs.
- **Consequences**:
  - Guarantees ACID transactions, foreign-key integrity, and row-level/organisation-level data isolation across all compliance entities.

### ADR-004: Migration to EasyTemplate v2.0 Framework
- **Date**: 2026-11-17
- **Status**: APPROVED
- **Context**: The developer upgraded the agent framework from Avengers Protocol v1.0 to EasyTemplate v2.0.
- **Decision**:
  - Layout changed: `development/frontend` → `frontend/`, `development/backend` → `backend/`, `input/client-docs` → `inputs/client_docs/`.
  - Avengers agent roles (`iron_man`, `jarvis`, etc.), `.codex/`, `infrastructure/` (Docker/Nginx), `tests/` and `development/mobile` were removed; the new framework is Zero-Docker and has no mobile track.
  - Rules, skills (`.agents/skills`, `.claude/skills`), `docs/`, `scripts/`, and planning/memory files (`PROJECT_STATUS.md`, `planning/MEMORY.md`) now come from EasyTemplate v2.0.
  - `settings.json` `backendStack` = `NESTJS_PRISMA_POSTGRES`, keeping ADR-003. The template's Express/Mongoose demo backend was **not** copied.
  - The existing Actovara frontend, including its own `src/components/ui` library, is kept as-is.
  - ADR-001 and ADR-002 are superseded where they conflict with this ADR.
- **Consequences**: `docs/` now holds the generic v2.0 blueprints and must be regenerated for Actovara in TASK-001.
