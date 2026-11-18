# 🛡️ Backend Pre-Execution Gate Plan (`planning/BACKEND_PLAN.md`)

> **Mandate 7 Compliance (`AGENTS.md`)**: This document satisfies the Mandatory Backend Pre-Execution Gate (End-to-End System Flowchart, Visual Database ERD, and Endpoint Specification Matrix) synchronized with `PRD_AND_PLAN.md`, `docs/07-database-design.md`, and `docs/08-api-contract.md`.
> **Active Backend Stack**: `EXPRESS_MONGOOSE` (Node.js + Express + TypeScript + Mongoose ODM)
> **Gate Status**: `APPROVED & EXECUTED IN TASK-002 (Mongoose Models, Prisma Schema & Database Seed Layer Complete)`

---

## 1. End-to-End System & API Request Flowchart (`mermaid flowchart TD`)

```mermaid
flowchart TD
    UserAction["User Action in Next.js 14 UI (Search, Filter, View, Create, Update)"] --> FrontendClient["Frontend API Service (src/services/api.ts)"]
    FrontendClient -->|"HTTP Request (/api/...)"| ExpressApp["Express Application Gateway (backend/src/server.ts)"]
    ExpressApp --> RouteIndex["Central Router (backend/src/routes/index.ts)"]
    
    RouteIndex -->|"GET /api/health"| HealthCtrl["Health Controller (modules/health)"]
    RouteIndex -->|"POST /api/auth/*"| AuthGuard["Request Validation & Auth Middleware"]
    RouteIndex -->|"GET/POST/PATCH/DELETE /api/categories"| CategoryMod["Category Module (modules/category)"]
    RouteIndex -->|"GET/POST/PATCH/DELETE /api/items"| ItemMod["Item Module (modules/item)"]

    AuthGuard --> AuthMod["Auth Module (modules/auth)"]
    
    HealthCtrl --> DbState["checkDatabaseHealth()"]
    AuthMod --> MongooseUser["User Model (Mongoose)"]
    CategoryMod --> MongooseCat["Category Model (Mongoose)"]
    ItemMod --> MongooseItem["Item Model (Mongoose + Category Populate)"]

    MongooseUser --> MongoDB[("MongoDB Instance")]
    MongooseCat --> MongoDB
    MongooseItem --> MongoDB

    DbState --> SendResp["sendResponse(res, { statusCode, success, message, meta, data })"]
    MongoDB --> SendResp
    SendResp -->|"JSON Envelope"| FrontendClient
```

---

## 2. Visual Database ERD Diagram (`mermaid erDiagram`)

```mermaid
erDiagram
    USER ||--o{ ORDER : "places"
    CATEGORY ||--o{ ITEM : "categorizes"
    ITEM ||--o{ ORDER_ITEM : "referenced_in"
    ORDER ||--|{ ORDER_ITEM : "contains"

    USER {
        ObjectId _id PK
        string name
        string email UK
        string passwordHash
        string role "admin | user"
        boolean isActive
        boolean isDeleted
        date createdAt
        date updatedAt
    }

    CATEGORY {
        ObjectId _id PK
        string name UK
        string slug UK
        string description
        string icon
        boolean isActive
        boolean isDeleted
        date createdAt
        date updatedAt
    }

    ITEM {
        ObjectId _id PK
        ObjectId categoryId FK
        string title
        string slug UK
        string summary
        number price
        number stock
        string badge "NEW | FEATURED | SALE | STANDARD"
        string[] images
        json specifications
        boolean isFeatured
        boolean isAvailable
        boolean isDeleted
        date createdAt
        date updatedAt
    }

    ORDER {
        ObjectId _id PK
        string orderNumber UK
        ObjectId userId FK
        number totalAmount
        string status "PENDING | PAID | SHIPPED | DELIVERED | CANCELLED"
        date createdAt
        date updatedAt
    }

    ORDER_ITEM {
        ObjectId _id PK
        ObjectId orderId FK
        ObjectId itemId FK
        number quantity
        number unitPrice
        number subtotal
    }
```

---

## 3. Endpoint Specification Matrix (`sendResponse` Envelope)

| Module | HTTP Method | Endpoint URL | Request Query / Body | Success Response (`sendResponse`) | Error Handling |
|---|---|---|---|---|---|
| `health` | `GET` | `/api` | None | `200 OK` `{ success: true, message, data: { version } }` | `globalErrorHandler` |
| `health` | `GET` | `/api/health` | None | `200 OK` `{ success: true, data: { status, stack, database } }` | `globalErrorHandler` |
| `auth` | `POST` | `/api/auth/register` | `{ name, email, password }` | `201 Created` `{ success: true, data: { user, token } }` | `400` Duplicate/Validation |
| `auth` | `POST` | `/api/auth/login` | `{ email, password }` | `200 OK` `{ success: true, data: { user, token } }` | `401` Invalid credentials |
| `auth` | `GET` | `/api/auth/me` | Header: `Authorization: Bearer` | `200 OK` `{ success: true, data: { user } }` | `401` Unauthorized |
| `category` | `GET` | `/api/categories` | `?isActive=true` | `200 OK` `{ success: true, data: [Category] }` | `globalErrorHandler` |
| `category` | `POST` | `/api/categories` | `{ name, slug, description, icon }` | `201 Created` `{ success: true, data: Category }` | `400` Validation Error |
| `item` | `GET` | `/api/items` | `?page=1&limit=12&search=&category=&featured=` | `200 OK` `{ success: true, meta: { page, limit, total }, data: [Item] }` | `globalErrorHandler` |
| `item` | `GET` | `/api/items/:slug` | Param: `:slug` | `200 OK` `{ success: true, data: Item }` | `404` Item not found |
| `item` | `POST` | `/api/items` | `{ title, slug, categoryId, price, stock, ... }` | `201 Created` `{ success: true, data: Item }` | `400` Validation Error |
| `item` | `PATCH` | `/api/items/:id` | Partial `Item` payload | `200 OK` `{ success: true, data: Item }` | `400 / 404` Error |
| `item` | `DELETE` | `/api/items/:id` | Param: `:id` | `200 OK` `{ success: true, data: { id, isDeleted: true } }` | `404` Item not found |
