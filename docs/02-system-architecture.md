# 02 — System Architecture & Visual Flowcharts

> **Synchronized with**: `PRD_AND_PLAN.md` & `project.config.md`

---

## 1. Universal Full-Stack System Architecture

```mermaid
graph TD
    subgraph DesignAndInputs ["1. Design & Client Input Layer"]
        FigmaMCP["Figma File / MCP & Tokens (inputs/figma/)"]
        Screenshots["UI Screenshots (inputs/screenshots/)"]
        ClientDocs["PDF Brief & Telegram Chat (inputs/client_docs/)"]
    end

    subgraph ClientLayer ["2. Client Layer (Next.js 14 App Router - Port 3000)"]
        NextPages["Next.js App Router Pages"]
        UIPrimitives["6-State UI Primitives (@/components/ui)"]
        ApiClient["Axios / Fetch Service Layer"]
        FigmaMCP --> NextPages
        Screenshots --> NextPages
        NextPages --> UIPrimitives
        NextPages --> ApiClient
    end

    subgraph ServerLayer ["3. Universal Backend Layer (Port 5000)"]
        Gateway["API Gateway (Express / NestJS / FastAPI)"]
        Guards["Auth & RBAC Guards"]
        Pipes["DTO / Schema Validation Pipes"]
        Modules["Modular Domain Services (src/modules/*)"]
        ApiClient -->|"REST JSON (docs/08-api-contract.md)"| Gateway
        Gateway --> Guards --> Pipes --> Modules
    end

    subgraph DataLayer ["4. Persistence Layer (Any Database)"]
        MongooseODM["MongoDB (Mongoose ODM)"]
        PrismaSQL["PostgreSQL / MySQL (Prisma / TypeORM)"]
        Modules --> MongooseODM
        Modules --> PrismaSQL
    end
```

---

## 2. End-to-End API Request-Response Sequence

```mermaid
sequenceDiagram
    autonumber
    actor User as User Browser
    participant Next as Next.js 14 Frontend
    participant API as Backend Gateway (Port 5000)
    participant Svc as Domain Service
    participant DB as Database (MongoDB / PostgreSQL)

    User->>Next: Interacts with UI / Submits Form
    Next->>Next: Client Validation & Optimistic / Skeleton State
    Next->>API: HTTP Request (/api/...)
    API->>API: Auth Guard & Request Validation Pipe
    alt Validation or Auth Fails
        API-->>Next: { success: false, statusCode: 400/401, errorSources }
        Next-->>User: Render Inline Error / Alert State
    else Valid Request
        API->>Svc: Execute Domain Logic
        Svc->>DB: Query / Transaction
        DB-->>Svc: Persisted Entity
        Svc-->>API: Result Payload
        API-->>Next: { success: true, statusCode: 200, data }
        Next-->>User: Render Default/Success State
    end
```
