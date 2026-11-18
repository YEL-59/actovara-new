# 🛡️ Error Handling, Logging & Resilience Contract (`docs/09-error-handling-and-logging.md`)

> **Purpose**: Standardizes API error envelopes, HTTP status semantics, validation error formatting, and client-side error propagation across the backend and Next.js frontend.

---

## 1. Unified Error Envelope (`globalErrorHandler.ts`)

Every unhandled or operational error in `backend/src/` is intercepted by `globalErrorHandler` (`backend/src/middlewares/globalErrorHandler.ts`) and returned as:

```json
{
  "success": false,
  "message": "Validation failed",
  "errorSources": [
    {
      "path": "price",
      "message": "Price must be a valid non-negative number"
    }
  ]
}
```

*(In `development`, the `stack` trace is also attached for debugging; in `production`, `stack` is omitted.)*

---

## 2. Standard HTTP Status Codes

| Status Code | Error Class / Origin | Meaning & Frontend Action |
|---|---|---|
| `400 Bad Request` | `AppError(400)` / `validateRequest` | Malformed payload, invalid field values, or forbidden fields (e.g., sending `role: "admin"` during registration). Display field-level `<Input error="..." />` or `<Alert variant="danger" />`. |
| `401 Unauthorized` | `AppError(401)` / `requireAuth` | Missing, expired, or tampered JWT Bearer token, or invalid login credentials. Prompt user to sign in. |
| `403 Forbidden` | `AppError(403)` / `requireAuth('admin')` | Authenticated user lacks required role permissions. Show permission alert. |
| `404 Not Found` | `notFound` / `AppError(404)` | Resource or route does not exist (or belongs to another user). Render `<EmptyState />` or error banner. |
| `500 Internal Server Error` | Unhandled Exception | Unexpected runtime or database error. Log internally and show safe generic error message. |

---

## 3. Frontend Error Propagation Rule (`frontend/src/services/api.ts`)

- **Network Unreachable Only Fallback**: The synchronized client demo fallback (`FALLBACK_ITEMS`, `FALLBACK_CATEGORIES`, `FALLBACK_ORDERS`) ONLY activates when `axios.isAxiosError(error) && !error.response` (i.e., when the backend process is offline in `FRONTEND_FIRST` standalone mode).
- **Never Mask Real Backend Errors**: Whenever the backend responds with an HTTP `4xx` or `5xx` status code, `api.ts` rethrows `[HTTP <status>] <message>` so the UI displays the exact validation or authorization failure.
