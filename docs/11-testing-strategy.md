# 11 — Testing & Verification Strategy (`docs/11-testing-strategy.md`)

## 1. Continuous Build Verification Gate (Mandatory per Task)
Every task must pass both build gates with **0 errors** before completion:
1. **Backend Build**: `npm run build --prefix backend`
2. **Frontend Build**: `npm run build --prefix frontend`

## 2. Automated Zero-Token Validation Scripts (`scripts/`)
- **Full Project Audit**: `npm run validate` (`scripts/validate-project.ps1`)
- **API Contract Validation**: `npm run validate-contracts` (`scripts/validate-contracts.ps1`)
- **Semantic Image Asset Audit**: `npm run audit-assets` (`scripts/audit-assets.ps1`)
- **Client Input Parser**: `npm run inputs` (`scripts/parse-inputs.js`)
