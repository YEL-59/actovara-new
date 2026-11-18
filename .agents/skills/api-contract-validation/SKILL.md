---
name: api-contract-validation
description: Workflow for validating and synchronizing REST API request/response contracts between the backend (any stack) and the Next.js frontend via docs/08-api-contract.md.
---

# API Contract Validation Workflow

## Purpose
Ensure that Next.js frontend API calls (`frontend/src/services/`) and backend endpoint definitions (`backend/src/modules/`) remain 100% synchronized through `docs/08-api-contract.md`.

## Contract Structure Standard
Every endpoint in `docs/08-api-contract.md` must specify:
1. **Method & Path**: e.g. `POST /api/v1/auth/login` or `GET /api/products`
2. **Auth & Roles**: `Public` or `Bearer JWT` (Roles: `admin`, `user`, etc.)
3. **Query Parameters**: `?page=1&limit=20&sortBy=createdAt&sortOrder=desc`
4. **Request Body Schema**: Strict JSON / TypeScript representation
5. **Standardized Success Response (2xx)**:
   ```json
   {
     "success": true,
     "statusCode": 200,
     "message": "Resource fetched successfully",
     "data": {}
   }
   ```
6. **Standardized Error Response (4xx / 5xx)**:
   ```json
   {
     "success": false,
     "message": "Validation failed",
     "errorSources": [
       { "path": "email", "message": "Invalid email address" }
     ]
   }
   ```

## Validation Procedure
Run `./scripts/validate-contracts.ps1` (Windows) or `./scripts/validate-contracts.sh` (Linux/Mac) or `npm run validate-contracts` to verify `docs/08-api-contract.md`.
