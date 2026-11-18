---
name: backend-development
description: Universal backend workflow supporting ANY backend stack (Express+Mongoose, Express+Prisma/PostgreSQL, NestJS+Prisma, FastAPI, or Custom) with modular domain architecture, Pre-Execution ERD/Flowchart Gate, and standardized API contracts.
---

# Universal Backend Development Workflow (Any-Backend Engine)

## Purpose
Guide backend implementation in `backend/` across **any chosen backend technology stack** while enforcing strict modular architecture, visual database planning, and standardized API contracts.

## Supported Backend Stacks (`settings.json` -> `backendStack`)
1. **`EXPRESS_MONGOOSE`** *(Default MERN)*: Node.js + Express + TypeScript + Mongoose ODM (MongoDB).
2. **`EXPRESS_PRISMA_POSTGRES`** *(PERN / SQL)*: Node.js + Express + TypeScript + Prisma ORM (PostgreSQL / MySQL).
3. **`NESTJS_PRISMA_POSTGRES`** *(Enterprise Modular)*: NestJS + TypeScript + Prisma/TypeORM + PostgreSQL + Redis.
4. **`FASTAPI_PYTHON`** *(Python Async)*: FastAPI + Pydantic + SQLAlchemy / Tortoise / Motor.
5. **`CUSTOM_ANY`** *(Polyglot)*: Go (Fiber/Gin), Laravel, Supabase, or custom backend adhering to `docs/08-api-contract.md`.

## Step-by-Step Procedure

### 1. Mandatory Pre-Execution Gate (Mandate 7)
Before writing any schema or endpoint code:
- Audit `SRS.md`, `inputs/`, and all frontend pages/components (`frontend/src/app/`, `docs/03-figma-analysis.md`) to extract every field, filter, relation, and calculation.
- Generate in `planning/BACKEND_PLAN.md` and `docs/07-database-design.md`:
  1. **End-to-End API Request Flowchart** (`mermaid flowchart TD`)
  2. **Visual Database ERD Diagram** (`mermaid erDiagram`)
  3. **Endpoint Specification Matrix** (`docs/08-api-contract.md`)
- Present the plan to the developer and wait for `"OK"` / `"Proceed"`.

### 2. Modular Domain Implementation (`backend/src/modules/<feature>/`)
Keep transport, business logic, and data access cleanly separated:
- **Model / Schema / Prisma**: Define entities with strict types, indexes, and soft-delete/audit timestamps.
- **DTO / Validation**: Validate incoming `body`, `query`, and `params` (via `validateRequest` + Zod/Joi in Express, `class-validator` in NestJS, or Pydantic in FastAPI).
- **Service**: Implement pure business logic, pagination (`calculatePagination`), and atomic database transactions.
- **Controller & Route**: Parse HTTP requests, invoke service methods via `catchAsync`, and return responses using `sendResponse`.

### 3. Contract Synchronization & Build Gate
- Keep `docs/08-api-contract.md` 100% synchronized with implemented routes.
- Run `npm run build` in `backend/` (and `./scripts/validate-contracts.ps1`) to guarantee `0` compilation errors.
