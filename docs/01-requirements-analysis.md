# 01 — Requirements Analysis & Conflict Resolution

> **Sources**: `inputs/client_docs/requirements.md` (PDF/Doc Brief), `inputs/client_docs/telegram_chat.txt` (`messages.html`), `inputs/figma/figma_links.md`, `inputs/screenshots/`  
> **Conflict Hierarchy**: Active Prompt > Telegram Chat (`messages.html` / `.txt`) > Figma Designs > Initial PDF Brief

---

## 1. Project Overview
- **Project Name**: [Populated during TASK-001 Client Intake]
- **Business Domain**: Full-Stack Web Application
- **Active Execution Strategy**: `FRONTEND_FIRST` | `BOTH_FULLSTACK` | `BACKEND_FIRST` | `FIGMA_TO_FULLSTACK`
- **Selected Backend Stack**: `EXPRESS_MONGOOSE` | `EXPRESS_PRISMA_POSTGRES` | `NESTJS_PRISMA_POSTGRES` | `FASTAPI_PYTHON` | `CUSTOM_ANY`

---

## 2. Functional Requirements Matrix (`REQ-F-XXX`)

| Req ID | Feature Module | Description & Acceptance Rule | Source (`Brief` / `Telegram` / `Figma`) | Priority |
|---|---|---|---|---|
| `REQ-F-001` | Authentication & RBAC | User registration, login, JWT session, and role guards | Brief / Figma | P0 |
| `REQ-F-002` | Core Catalog / Listing | Dynamic search, multi-criteria filtering, sorting, and pagination | Figma / Screenshots | P0 |
| `REQ-F-003` | Detail & Interactive View | Full specification matrix, media gallery, and interactive actions | Figma / Screenshots | P0 |
| `REQ-F-004` | Primary Transaction / Form | Validated creation/booking/checkout flow with backend persistence | Telegram / Brief | P0 |
| `REQ-F-005` | Dashboard & Admin CRUD | Protected management table, status transitions, and analytics | Brief / Figma | P1 |

---

## 3. Non-Functional Requirements
- **Visual Fidelity**: 100% adherence to Figma frames (`inputs/figma/`) or client UI screenshots (`inputs/screenshots/`) with zero generic placeholders.
- **UI States**: All 6 mandatory UI states implemented on every page (Default, Skeleton, Empty, Validation/Error, Responsive, Interactive/Focus).
- **Type Safety**: 0 TypeScript compilation errors across `frontend/` and `backend/`.
