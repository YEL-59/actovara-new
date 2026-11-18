# 📚 Technical Blueprints & System Contracts (`docs/`)

This directory holds the modular technical blueprints (inspired by the `ai_framwork` contract architecture) alongside the root `PRD_AND_PLAN.md`. Each specialist task loads **only** the specific document it needs via `docs/context-map.md`, saving 85–90% of context tokens.

---

## 🗂️ Blueprint Index

| Document | Purpose & Scope | Primary Domain |
|---|---|---|
| [`ai-context-policy.md`](ai-context-policy.md) | Rules for minimal token loading and progressive context disclosure | All Tasks |
| [`context-map.md`](context-map.md) | Task-to-Context routing table | All Tasks |
| [`01-requirements-analysis.md`](01-requirements-analysis.md) | Synthesized requirements from PDF brief, Telegram chat, and Figma | Planning |
| [`02-system-architecture.md`](02-system-architecture.md) | High-level system architecture, user flowcharts, and sequence diagrams | Architecture |
| [`03-figma-analysis.md`](03-figma-analysis.md) | Figma URLs/frames, Auto-Layout breakdown, and Screenshot screen inventory | Figma & UI/UX |
| [`04-design-system.md`](04-design-system.md) | Semantic CSS variables, typography, WCAG 2.2 AA contrast, and 6 UI states | Design System |
| [`05-frontend-architecture.md`](05-frontend-architecture.md) | Next.js 14 App Router tree, UI primitives, state, and semantic image folders | Frontend |
| [`06-backend-architecture.md`](06-backend-architecture.md) | **Universal Backend Architecture** (Express+Mongoose, Express+Prisma, NestJS, FastAPI, etc.) | Backend |
| [`07-database-design.md`](07-database-design.md) | Visual Mermaid ERD + Mongoose ODM & Prisma SQL schema blueprints | Database |
| [`08-api-contract.md`](08-api-contract.md) | **Frontend-Backend Bridge**: REST endpoints, payloads, and `sendResponse` envelope | Full-Stack |
| [`09-error-handling-and-logging.md`](09-error-handling-and-logging.md) | Unified error envelopes, HTTP status semantics, and frontend error propagation | Full-Stack |
| [`10-security-plan.md`](10-security-plan.md) | Authentication, RBAC guards, input validation, and CORS hardening | Security |
| [`11-testing-strategy.md`](11-testing-strategy.md) | Build verification gates, contract validation, and asset auditing | QA |
| [`12-deployment-and-devops.md`](12-deployment-and-devops.md) | Production environment variables, cloud deployment, and CI/CD workflow | DevOps |
| [`13-acceptance-criteria.md`](13-acceptance-criteria.md) | Definition of Done (6 UI states, Figma/Screenshot fidelity, 0 build errors) | Handover |
