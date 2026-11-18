---
name: client-modification
description: Senior Architect Full-Stack Ripple & Zero-Regression workflow (Phase 5 Protocol) for handling client revision notes, Telegram chat exports (messages.html / telegram_chat.txt), Figma updates, and component modification bundles across Database, Backend APIs, and Frontend UI.
---

# Client Modification & Senior Architect Full-Stack Ripple Workflow

## Purpose
When a full-stack application is already built (or mid-build) and the client sends modifications—ranging from small UI tweaks to deep business logic changes that affect the database, backend APIs, and frontend simultaneously—execute the changes like a **Senior Full-Stack Architect** with **100% logical consistency across all layers** and **zero regressions**.

## Supported Modification Inputs (`inputs/modifications/` & Chat)
1. **Component Feature Bundles**: `inputs/modifications/features/<component-name>/` (screenshot `*.png` + `notes.txt` in one folder).
2. **Written Change Requests**: `inputs/modifications/update_notes/updates.md` or `inputs/client_docs/updates.md`.
3. **Telegram & Chat Exports**: `inputs/modifications/telegram_chats/messages.html` or `telegram_chat.txt`.
4. **Categorized Screenshots**: `inputs/modifications/screenshots/ui_tweaks/`, `new_sections/`, `bug_fixes/`.
5. **Updated Figma Links**: `inputs/figma/figma_links.md`.
6. **Direct Client Message**: `inputs/client_comms/incoming_message.md` or pasted directly in chat.

---

## The 5-Layer Senior Developer Full-Stack Ripple Protocol

### Layer 1: Memory & Anti-Regression Audit (`planning/MEMORY.md`)
- Read `planning/MEMORY.md` and `PROJECT_STATUS.md` first.
- Identify all existing working routes, database models, validation schemas, and UI components so unrelated features are strictly protected from accidental deletion or regression.

### Layer 2: Logical Full-Stack Impact & Ripple Analysis
Before editing code, trace the logical ripple of the client's request across the entire stack:
- **Database / ERD Impact (`docs/07-database-design.md`)**: Does this change add, rename, or remove fields, enums, indexes, or relationships in Mongoose / Prisma / SQL?
- **Backend Service & API Contract Impact (`docs/08-api-contract.md`)**: Does this change calculation rules, filter query params, auth guards, request validation, or response DTOs in `backend/src/modules/<feature>/`?
- **Frontend State & 6-State UI Impact (`frontend/src/`)**: Which pages, forms, TypeScript interfaces, table columns, cards, and UI states (Default, Skeleton, Empty, Validation Error, Responsive, Focus) must be updated to reflect the new logic and screenshot/Figma design?
- Create or update an atomic modification task (`planning/tasks/TASK-MOD-XXX.md`) documenting the exact files across all affected layers.

### Layer 3: Synchronized Surgical Implementation (Any Backend + Next.js Frontend)
Execute the modifications in strict logical order:
1. **Database Schema & Models** (`backend/src/modules/<feature>/` for `EXPRESS_MONGOOSE`, `EXPRESS_PRISMA_POSTGRES`, `NESTJS_PRISMA_POSTGRES`, `FASTAPI_PYTHON`, or `CUSTOM_ANY`).
2. **Backend Services, Controllers & Validation** (maintaining standard `sendResponse` envelope and updating `docs/08-api-contract.md`).
3. **Frontend API Client, Types & 6-State UI Components** (matching exact Figma/screenshot visuals and semantic image paths under `frontend/public/images/*`).

### Layer 4: Continuous Dual Build & Contract Verification Gate
- Run `npm run build` in `backend/` (0 TypeScript / compiler errors).
- Run `npm run build` in `frontend/` (0 Next.js / TypeScript errors).
- Run `npm run validate-contracts` to ensure `docs/08-api-contract.md` stays in sync.

### Layer 5: Memory Sync & Ready-to-Send Client Confirmation Message
1. Update `planning/MEMORY.md` (Section 1 live state + Section 3 chronological log) and `PROJECT_STATUS.md`.
2. Automatically generate a **Client Revision Completion Message** (ready to copy-paste to Telegram/Fiverr/Upwork) summarizing every change completed!
