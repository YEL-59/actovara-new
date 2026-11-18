# Universal Backend Agent Rules (`backend/AGENTS.md`)

> **Domain**: Backend API, Business Logic, Database Schemas, & Data Persistence  
> **Architecture**: Universal Modular Domain Architecture (Supports **Any Backend Stack**)  
> **Contract Bridge**: `docs/08-api-contract.md` & `planning/BACKEND_PLAN.md`

---

## 1. Universal Multi-Backend Stack Support

This framework is **Backend-Agnostic** by design. Before writing backend code, inspect `settings.json` (`"backendStack"`) and `project.config.md` to identify the active backend profile:

| Profile Key | Runtime & Framework | ORM / ODM & Database | Directory / Structure |
|---|---|---|---|
| **`EXPRESS_MONGOOSE`** *(Default)* | Node.js + Express + TypeScript | Mongoose ODM + MongoDB | `backend/src/modules/<feature>/` |
| **`EXPRESS_PRISMA_POSTGRES`** | Node.js + Express + TypeScript | Prisma ORM + PostgreSQL / MySQL | `backend/prisma/schema.prisma` + `backend/src/modules/` |
| **`NESTJS_PRISMA_POSTGRES`** | NestJS (Modular Architecture) | Prisma / TypeORM + PostgreSQL + Redis | `backend/src/modules/<feature>/` (`*.module.ts`, `*.controller.ts`, `*.service.ts`) |
| **`FASTAPI_PYTHON`** | Python 3.11+ + FastAPI + Pydantic | SQLAlchemy / Tortoise / Motor | `backend/app/modules/` or `backend/routers/` |
| **`CUSTOM_ANY`** | Go (Fiber/Gin), Laravel, Supabase, etc. | Any SQL / NoSQL Engine | Standardized REST / GraphQL via `docs/08-api-contract.md` |

---

## 2. Mandatory Backend Pre-Execution Gate (Mandate 7)

Before writing ANY database models, migrations, routes, or controllers:
1. **Audit SRS & Existing Frontend**: Inspect `SRS.md`, `inputs/`, and `frontend/src/app/` + `frontend/src/components/` (or Figma frames in `docs/03-figma-analysis.md`) to extract every required entity, field, filter, and calculation.
2. **Generate Visual Flow & ERD**:
   - End-to-End API Request Flowchart (`mermaid flowchart TD`)
   - Visual Database ERD Diagram (`mermaid erDiagram`)
   - Endpoint Specification Matrix (`docs/08-api-contract.md` & `planning/BACKEND_PLAN.md`)
3. **STOP & PRESENT**: Present the visual backend plan to the developer and wait for `"OK"` / `"Proceed"` before writing backend implementation code.

---

## 3. Modular Domain Architecture (`backend/src/`)

Regardless of framework (Express, NestJS, or FastAPI), enforce clean separation of concerns:

```text
backend/
├── src/
│   ├── common/
│   │   ├── constants/        # Pagination defaults, TTLs, system constants
│   │   ├── errors/           # AppError custom HTTP exception class
│   │   ├── guards/           # Auth & Role-Based Access Control (RBAC) guards
│   │   ├── pipes/            # Request DTO / Schema validation middleware
│   │   └── utils/            # catchAsync, sendResponse, slugify, pagination helpers
│   ├── config/               # Environment & stack configuration
│   ├── database/             # Multi-DB connection adapters (Mongoose / Prisma / SQL) & seeds
│   ├── middlewares/          # globalErrorHandler & notFound handlers
│   ├── modules/              # Feature domain modules (Controller + Service + Model/Repository + Route)
│   │   └── health/           # System & stack health inspection module
│   ├── routes/               # Central API router aggregator
│   ├── app.ts                # Application gateway & middleware pipeline
│   └── server.ts             # Server bootstrap & graceful shutdown
```

- **Controllers (Transport Layer)**: Parse HTTP requests, extract params/query/body, invoke services, and return standardized responses via `sendResponse`.
- **Services (Business Logic Layer)**: Pure domain logic, compatibility rules, calculations, and database queries/transactions.
- **Models / Repositories (Data Layer)**: Mongoose schemas (`*.model.ts`), Prisma client queries (`prisma.<model>`), or SQL repositories.

---

## 4. Standardized API Response Contract

Every backend stack MUST return responses adhering to this universal envelope (defined in `docs/08-api-contract.md`):

### Success Envelope (`200` / `201`)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Operation completed successfully",
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  },
  "data": {}
}
```

### Error Envelope (`400` / `401` / `403` / `404` / `500`)
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errorSources": [
    {
      "path": "email",
      "message": "Invalid email address"
    }
  ]
}
```

---

## 5. Security, Database Safety & Verification Rules

1. **Zero Destructive Operations Without Approval**: Never drop tables/collections or run destructive migrations without explicit human confirmation.
2. **Input Validation**: Validate all incoming request bodies, params, and query strings before hitting business services.
3. **Context Isolation**: Do not load unrelated CSS or image files when executing pure backend tasks—rely on `docs/07-database-design.md`, `docs/08-api-contract.md`, and `planning/BACKEND_PLAN.md`.
4. **Verification Gate**: Always run `npm run build` in `backend/` (or the stack's compile/test command) to guarantee `0` errors before marking any backend task `DONE`.
