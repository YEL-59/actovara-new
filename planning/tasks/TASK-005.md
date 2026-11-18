# TASK-005: Frontend Feature Views & API Integration

- **Task ID**: `TASK-005`
- **Domain**: Frontend / Integration
- **Status**: `BACKLOG`
- **Priority**: `P0`
- **Assigned Role**: Full-Stack Developer
- **Dependencies**: `TASK-003`, `TASK-004`

---

## 1. Objective
Build the client-requested feature pages and integrate them with the backend Express API using `frontend/src/services/api.ts` or custom hooks.

---

## 2. Deliverables
1. Page routes in `frontend/src/app/...`.
2. Semantic visual assets in `frontend/public/images/*`.
3. 6 Mandatory UI States implemented on interactive components:
   - (1) Default / Success
   - (2) Loading Skeleton (`<SkeletonProductCard />`, `<SkeletonTableRow />`)
   - (3) Empty State (`<EmptyState />`)
   - (4) Validation / Error Alert (`<Input error="..." />`, `<Alert variant="danger" />`)
   - (5) Responsive Breakpoints (`<640px`, `640px-1024px`, `>1024px`)
   - (6) Interactive / Hover / Focus states (`focus-visible:ring-2`)
4. Reactive form handling and API mutation feedback (`frontend/src/services/api.ts`).

---

## 3. Acceptance & Verification Criteria
- [ ] Forms submit correct JSON payloads to the backend API and surface HTTP `4xx/5xx` errors clearly.
- [ ] UI states (loading, empty, error) display correctly without blank screens.
- [ ] Project & Contract validation suites (`npm run validate` & `npm run validate-contracts`) pass with 0 errors.
