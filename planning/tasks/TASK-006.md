# TASK-006: Full Platform Verification & Build Audit

- **Task ID**: `TASK-006`
- **Domain**: QA & Verification
- **Status**: `BACKLOG`
- **Priority**: `P0`
- **Assigned Role**: QA Verifier
- **Dependencies**: `TASK-005`

---

## 1. Objective
Perform end-to-end audit, TypeScript compilation validation for both backend and frontend, run automated tests, and prepare clean client handover report.

---

## 2. Deliverables
1. Run backend build and API test suite in `backend/`.
2. Run frontend build and lint check in `frontend/`.
3. Execute `scripts/validate-project.ps1`, `scripts/validate-contracts.ps1`, and `scripts/audit-assets.ps1`.
4. Update `planning/updateplanning.md`, `planning/task.md`, `PROJECT_STATUS.md`, and `planning/MEMORY.md` marking all tasks completed.
5. Generate client handover summary with endpoint table, UI fidelity checklist, and git commit command.

---

## 3. Acceptance & Verification Criteria
- [ ] Backend build and API smoke tests pass with exit code 0.
- [ ] Frontend build passes with exit code 0.
- [ ] Zero unhandled errors in console (`validate-project`, `validate-contracts`, and `audit-assets` pass with 0 issues).
- [ ] Handover report delivered to human developer.
