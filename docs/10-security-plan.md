# 10 — Security & Validation Plan (`docs/10-security-plan.md`)

## 1. Authentication & Authorization
- **JWT Verification**: Verify tokens via `requireAuth` guard (`backend/src/common/guards/auth.guard.ts`).
- **Role-Based Access Control (RBAC)**: Restrict administrative mutations (`POST`, `PATCH`, `DELETE`) to authorized roles (`admin`, `superadmin`, etc.).

## 2. Input Validation & Sanitization
- Validate all incoming payloads using `validateRequest` (`backend/src/common/pipes/validateRequest.ts`) with Zod/Joi or DTO `class-validator` before hitting services.
- Never expose raw database stack traces or sensitive fields (`password`, `passwordHash`) in API responses.

## 3. Environment & Secrets Safety
- Store credentials exclusively in `.env` and `.env.local` (never committed to Git).
- Require explicit human approval before running destructive database migrations.
