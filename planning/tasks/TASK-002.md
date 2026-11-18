# TASK-002: Universal Database Schemas & ERD Models

- **Task ID**: `TASK-002`
- **Domain**: Backend (Active `backendStack` in `settings.json`)
- **Status**: `BACKLOG`
- **Priority**: `P0`
- **Assigned Role**: Full-Stack Developer
- **Dependencies**: `TASK-001`

---

## 1. Objective
Implement TypeScript/Python interfaces and database models under `backend/src/modules/` based on the visual ERD diagram, relationships, and database schema specifications approved in `PRD_AND_PLAN.md`, `planning/BACKEND_PLAN.md`, and `docs/07-database-design.md`.

---

## 2. Deliverables
1. Domain interfaces & schemas/models in `backend/src/modules/<feature>/`.
2. Field validations, defaults, unique/compound indexes, foreign key references, soft-delete flags (`isDeleted`), and timestamps as defined in the ERD diagram.
3. Database connection & seed helper in `backend/src/database/index.ts` and `backend/src/database/seed.ts`.

---

## 3. Acceptance & Verification Criteria
- [ ] Database models strictly reflect the visual ERD diagram and schema tables in `PRD_AND_PLAN.md` and `docs/07-database-design.md`.
- [ ] Relationships and compound indexes match the database plan.
- [ ] Backend build (`npm run build --prefix backend`) and validation check exit with code 0.
