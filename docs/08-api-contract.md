# 08 — API Contracts: Frontend & Any-Backend Bridge (`docs/08-api-contract.md`)

> **Validation Script**: `powershell -ExecutionPolicy Bypass -File scripts/validate-contracts.ps1` (`npm run validate-contracts`)  
> **Synchronized with**: `PRD_AND_PLAN.md` & `planning/BACKEND_PLAN.md`

---

## 1. Global Conventions
- **Base URL**: `http://localhost:5000/api` (or `/api/v1`)
- **Format**: JSON (`Content-Type: application/json`)
- **Authentication**: `Authorization: Bearer <token>` or HTTP-Only Cookie
- **Standard Success Envelope (`sendResponse`)**:
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Operation completed successfully",
    "meta": {
      "page": 1,
      "limit": 12,
      "total": 24
    },
    "data": {}
  }
  ```
- **Standard Error Envelope (`globalErrorHandler`)**:
  ```json
  {
    "success": false,
    "message": "Validation failed",
    "errorSources": [
      {
        "path": "field_name",
        "message": "Validation error detail"
      }
    ]
  }
  ```

---

## 2. Core Endpoints Specification

### 2.1 System, Health & Interactive Swagger Documentation
- `GET /api` — Root API status check & endpoint directory (`{ name, version, status, swaggerDocs, openApiJson }`).
- `GET /api/docs` — **Interactive Swagger UI Explorer** (OpenAPI 3.0.3 with JWT Bearer authorization support and offline explorer fallback).
- `GET /api/docs/json` (or `GET /api/docs.json`) — Raw OpenAPI 3.0.3 JSON specification for Postman/Insomnia/TypeScript SDK generation.
- `GET /api/health` — Detailed backend stack, database state, and uptime telemetry (`{ status, stack, database, uptime }`).

### 2.2 Authentication & Users
- `POST /api/auth/register` — Register new user account (`{ name, email, password }` -> `{ user, token }`). Always creates role `user`; sending `role` is rejected (400). Password min 8 chars, stored as salted scrypt.
- `POST /api/auth/login` — Authenticate user and issue JWT (`{ email, password }` -> `{ user, token }`).
- `GET /api/auth/me` — Retrieve current authenticated user profile (`{ user }`).

### 2.3 Categories CRUD
- `GET /api/categories` — List active categories (`?isActive=true` -> `[ Category... ]`).
- `GET /api/categories/:slug` — Retrieve single category by slug or ID (`Category`).
- `POST /api/categories` — Create new category (`{ name, slug, description, icon }` -> `Category`, Admin Protected).
- `PATCH /api/categories/:id` — Partial update of category (`Category`, Admin Protected).
- `DELETE /api/categories/:id` — Soft-delete category (`{ id, isDeleted: true }`, Admin Protected).

### 2.4 Primary Resource (`items`) CRUD
- `GET /api/items` — Paginated & filtered resource listing (`?page=1&limit=12&search=&category=&featured=&badge=&sortBy=&sortOrder=` -> `[ Item... ]` + `meta`).
- `GET /api/items/:slug` — Detailed single resource view with populated category and `specifications` matrix (`Item`).
- `POST /api/items` — Create new catalog item (Admin Protected).
- `PATCH /api/items/:id` — Partial update of catalog item (Admin Protected).
- `DELETE /api/items/:id` — Soft-delete catalog item (`{ id, isDeleted: true }`, Admin Protected).

### 2.5 Orders & Line Items (`orders`) CRUD
- `GET /api/orders` — List orders (`?userId=&status=` -> `[ Order... ]`, Auth Required). Users see only their own orders; `userId` filter is admin-only.
- `GET /api/orders/:id` — Retrieve order by `_id` or `orderNumber` (`Order`, Auth Required; non-owners get 404).
- `POST /api/orders` — Create order with calculated line-item subtotals (`{ items: [{ itemId, quantity }] }` -> `Order`, Auth Required). Owner is taken from the token; status is always `PENDING`.
- `PATCH /api/orders/:id/status` — Update order fulfillment status (`{ status }` -> `Order`, Admin Protected).
