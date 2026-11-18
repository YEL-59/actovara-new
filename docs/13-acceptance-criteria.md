# 13 — Acceptance Criteria & Definition of Done (`docs/13-acceptance-criteria.md`)

A task or project is ready for client handover only when all of the following are verified:

1. **Figma / Screenshot Visual Fidelity**:
   - Colors, typography, spacing, border radius, and layouts match `inputs/figma/` or `inputs/screenshots/`.
   - Zero placeholder gray boxes or broken image links; all assets are in semantic `frontend/public/images/*` folders.
2. **6 Mandatory UI States**:
   - Default/Success, Loading Skeleton, Empty State, Validation/Error, Responsive (`<640px`, `640-1024px`, `>1024px`), and Interactive/Focus states are implemented.
3. **Backend & API Contract Integrity**:
   - All endpoints adhere to `docs/08-api-contract.md` and the `sendResponse` envelope.
   - `npm run validate-contracts` passes with 0 issues.
4. **Zero Build Errors & Synced Memory**:
   - `npm run build` passes in both `backend/` and `frontend/`.
   - `PROJECT_STATUS.md` and `planning/MEMORY.md` are updated with the latest checkpoint.
