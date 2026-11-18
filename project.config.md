# ⚙️ Project Configuration: EasyTemplate v2.0 (Universal AI Full-Stack & Figma Engine)

> **Version**: 2.0  
> **Architecture**: Next.js 14 App Router + Universal Modular Backend (Express / NestJS / Prisma / Mongoose / FastAPI / Any Stack)  
> **Execution Engine**: Plan-First, Context-Isolated (`.agents/skills/` + `docs/`), Figma-to-Fullstack, Zero-State-Loss Memory  

---

## 1. Project Information & Metadata

- **Project Name**: Actovara (Compliance Management MVP)
- **Project Domain**: Full-Stack Web Application (Freelance / Client MVP / Enterprise Modular)
- **Status**: `IN_DEVELOPMENT` (Frontend built on mock data; backend not started)
- **Language Preference**: `EN` (English)
- **Active Strategy**: `FRONTEND_FIRST`
- **Active Backend Stack**: `NESTJS_PRISMA_POSTGRES` (see planning/decisions.md ADR-003)
- **Client Brief & PDF Source**: `inputs/client_docs/requirements.md` & `.pdf`
- **Telegram / Chat Export**: `inputs/client_docs/telegram_chat.txt` & `messages.html`
- **Figma Design Links & Tokens**: `inputs/figma/figma_links.md`, `inputs/figma/tokens/`, `inputs/figma/exports/`
- **UI Screenshots**: `inputs/screenshots/`
- **Client Modifications / Bundles**: `inputs/modifications/` & `inputs/client_docs/updates.md`
- **Reference Websites**: `inputs/references.md`

---

## 2. Global Settings, Language & Stack Control (`npm run settings`)
- Run `npm run settings` in terminal anytime to interactively:
  - Press `1` to toggle language between English (`en`) and বাংলা (`bn`).
  - Press `2` to change execution strategy (`FRONTEND_FIRST`, `FIGMA_TO_FULLSTACK`, `BOTH_FULLSTACK`, `BACKEND_FIRST`).
  - Press `3` to switch **Backend Stack** (`EXPRESS_MONGOOSE`, `EXPRESS_PRISMA_POSTGRES`, `NESTJS_PRISMA_POSTGRES`, `FASTAPI_PYTHON`, `CUSTOM_ANY`).
  - Press `4` to scan and parse all client inputs (`PDF`, `Telegram HTML/TXT`, `Figma Links`, `Screenshots`) into `inputs/INTAKE_SUMMARY.md`.
  - Press `5` to view client modification instructions.
  - Press `6` to inspect live project status & memory.
  - Press `7` to sync this framework to another project.

---

## 3. Execution Strategy / Mode Selection

| Strategy | Mode Key | When to Use | Typical Task Order |
|---|---|---|---|
| **Frontend-First** *(Client Demo Mode)* | `FRONTEND_FIRST` | When the client wants to see and approve the UI/screens quickly before backend work starts. | Tokens/Navbar → Page Views (Mock Data) → Backend ERD/APIs → Wiring |
| **Figma-to-Fullstack** *(Figma MCP & URL Engine)* | `FIGMA_TO_FULLSTACK` | When the client provides a Figma link/file and wants a pixel-accurate UI + auto-inferred Database & Backend APIs. | Figma Inspection (`docs/03`, `04`) → 6-State UI → Inferred DB ERD (`docs/07`) → Backend APIs (`docs/08`) → Wiring |
| **Both / Full-Stack** *(Concurrent)* | `BOTH_FULLSTACK` | Standard full-stack workflow with live database models, APIs, and synchronized frontend views. | DB Schemas → Backend Endpoints → Frontend UI → Full Integration |
| **Backend-First** *(API-First)* | `BACKEND_FIRST` | When complex business logic, auth, or integrations are the primary uncertainty. | ERD & Schemas → APIs & Guards → Testing → Frontend Implementation |

---

## 4. Universal Backend Stack Specification (Supports ANY Backend)

| Backend Profile Key | Runtime & Framework | ORM / Database | Directory & Blueprint |
|---|---|---|---|
| **`EXPRESS_MONGOOSE`** *(Default)* | Node.js + Express 4 + TypeScript | Mongoose 8 ODM + MongoDB | `backend/src/modules/` (`docs/06`, `docs/07`) |
| **`EXPRESS_PRISMA_POSTGRES`** | Node.js + Express 4 + TypeScript | Prisma ORM + PostgreSQL / MySQL | `backend/prisma/` + `backend/src/modules/` |
| **`NESTJS_PRISMA_POSTGRES`** | NestJS (Modular DI Architecture) | Prisma / TypeORM + PostgreSQL + Redis | `backend/src/modules/` (`*.module.ts`, `*.controller.ts`, `*.service.ts`) |
| **`FASTAPI_PYTHON`** | Python 3.11+ + FastAPI + Pydantic | SQLAlchemy / Tortoise / Motor | `backend/app/` adhering to `docs/08-api-contract.md` |
| **`CUSTOM_ANY`** | Go (Fiber/Gin), Laravel, Supabase, etc. | Any SQL / NoSQL Engine | `backend/` adhering to `docs/08-api-contract.md` |

---

## 5. Frontend & Shared Architecture Specification

| Layer | Technology | Configuration | Directory |
|---|---|---|---|
| **Frontend Framework** | Next.js 14 (App Router) | TypeScript Strict Mode | `frontend/src/app/` |
| **Styling & Tokens** | Tailwind CSS + CSS Variables | `frontend/DESIGN_GUIDELINES.md` & `docs/04-design-system.md` | `frontend/src/app/globals.css` |
| **6-State UI Primitives** | 11 Built-in Components | `Button`, `Card`, `Input`, `Textarea`, `Badge`, `Alert`, `Skeleton`, `EmptyState`, `SpecTable`, `Tabs`, `Dialog` | `frontend/src/components/ui/` |
| **Executable Skills** | 9 Agent Playbooks | Planning, Figma-to-Fullstack, Design, Frontend, Backend, Contracts, Execution, Modifications, Testing | `.agents/skills/` |
| **Technical Blueprints** | Modular System Contracts | `01` to `13` + `context-map.md` + `PRD_AND_PLAN.md` | `docs/` |

---

## 6. Network & Environment Configuration

| Service | Local URL | Port | Environment File | Key Variables |
|---|---|---|---|---|
| **Backend API** | `http://localhost:5000` | `5000` | `backend/.env` | `PORT=5000`<br>`BACKEND_STACK=EXPRESS_MONGOOSE`<br>`DB_URL=mongodb://127.0.0.1:27017/easytemplate`<br>`DATABASE_URL=...` |
| **Frontend Web** | `http://localhost:3000` | `3000` | `frontend/.env.local` | `NEXT_PUBLIC_API_URL=http://localhost:5000` |
| **API Base Path** | `http://localhost:5000/api` | - | `docs/08-api-contract.md` | `/api` & `/api/health` |

---

## 7. Standardized API Response Contract (`docs/08-api-contract.md`)

Every backend endpoint (regardless of stack) must return responses adhering to this envelope:

### Success Response (200 / 201)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Resource fetched or created successfully",
  "data": {}
}
```

### Error Response (400 / 401 / 403 / 404 / 500)
```json
{
  "success": false,
  "message": "Detailed error explanation",
  "errorSources": [
    {
      "path": "field_name",
      "message": "Validation rule failed"
    }
  ]
}
```
