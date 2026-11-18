---
name: testing
description: Workflow for build verification, API contract validation, asset auditing, and full-stack quality assurance.
---

# Testing & Quality Verification Workflow

## Purpose
Verify that all frontend, backend, asset, and API contract deliverables pass strict automated checks before marking tasks `DONE` or handing over to the client.

## Verification Gates
1. **Backend Compilation Gate**:
   ```bash
   npm run build --prefix backend
   ```
2. **Frontend Compilation & Route Gate**:
   ```bash
   npm run build --prefix frontend
   ```
3. **API Contract Validation Gate**:
   ```powershell
   powershell -ExecutionPolicy Bypass -File scripts/validate-contracts.ps1
   ```
4. **Semantic Image Asset Audit**:
   ```powershell
   powershell -ExecutionPolicy Bypass -File scripts/audit-assets.ps1
   ```
5. **Full Project Validation Suite**:
   ```powershell
   powershell -ExecutionPolicy Bypass -File scripts/validate-project.ps1
   ```
