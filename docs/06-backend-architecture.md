# 06 — Universal Backend Architecture (`docs/06-backend-architecture.md`)

> **Directory**: `backend/`  
> **Rules**: `backend/AGENTS.md` & `.agents/skills/backend-development/SKILL.md`  
> **Active Stack Setting**: Configured in `settings.json` (`"backendStack"`) & `project.config.md`

---

## 1. Multi-Backend Stack Profiles (Supports ANY Backend)

This framework is engineered so you can use **any backend technology** while keeping the same modular folder structure, Pre-Execution ERD Gate, and `docs/08-api-contract.md` response contract:

| Stack Profile | Framework & Language | ORM / ODM & Database | Best For |
|---|---|---|---|
| **`EXPRESS_MONGOOSE`** *(Default)* | Express 4 + TypeScript | Mongoose 8 + MongoDB | Fast client MVPs, flexible JSON schemas, MERN stack |
| **`EXPRESS_PRISMA_POSTGRES`** | Express 4 + TypeScript | Prisma ORM + PostgreSQL / MySQL | Relational SQL integrity with lightweight Express runtime |
| **`NESTJS_PRISMA_POSTGRES`** | NestJS + TypeScript | Prisma / TypeORM + PostgreSQL + Redis | Enterprise DI, complex domain modules, high-concurrency |
| **`FASTAPI_PYTHON`** | FastAPI + Python 3.11+ | SQLAlchemy / Tortoise / Motor + Pydantic | AI/ML integrations, data pipelines, async Python APIs |
| **`CUSTOM_ANY`** | Go (Fiber/Gin), Laravel, Supabase, etc. | Any SQL / NoSQL Database | Client-mandated custom backend stacks |

---

## 2. Modular Directory Structure (`backend/`)

```text
backend/
├── AGENTS.md                              # Universal Backend Agent Rules
├── prisma/                                # (Optional) Prisma schema & migrations when using SQL/Prisma
│   └── schema.prisma
├── src/
│   ├── common/                            # Shared Cross-Cutting Building Blocks
│   │   ├── constants/index.ts             # Pagination & TTL constants
│   │   ├── errors/AppError.ts             # Operational HTTP error class
│   │   ├── guards/auth.guard.ts           # JWT & RBAC authorization guards
│   │   ├── pipes/validateRequest.ts       # Zod / DTO request validation pipe
│   │   └── utils/                         # catchAsync, slugify, calculatePagination
│   ├── config/index.ts                    # Environment variables & stack selector
│   ├── database/                          # Universal Database Connection Adapter (Mongoose / Prisma / Memory)
│   │   ├── index.ts
│   │   └── README.md
│   ├── middlewares/
│   │   ├── globalErrorHandler.ts          # Standardized error envelope formatter
│   │   └── notFound.ts                    # 404 route handler
│   ├── modules/                           # Domain Feature Modules (Controller + Service + Model + Route)
│   │   ├── health/
│   │   │   ├── health.controller.ts
│   │   │   ├── health.service.ts
│   │   │   └── health.route.ts
│   │   └── <feature>/                     # e.g. auth/, users/, products/, orders/
│   ├── routes/index.ts                    # Central API route registry
│   ├── utils/sendResponse.ts              # Standardized JSON response wrapper
│   ├── app.ts                             # Express / Server application pipeline
│   └── server.ts                          # Bootstrap & DB connection lifecycle
```
