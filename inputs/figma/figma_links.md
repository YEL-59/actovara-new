# 🔗 Client Figma Links & Frame Inventory

> **Instructions**: Paste the client's main Figma file URL and specific screen/frame links below. The AI will inspect these links (via Figma MCP or `inputs/figma/exports/`) to generate the Design System (`docs/04-design-system.md`), Screen Inventory (`docs/03-figma-analysis.md`), Next.js UI, Database ERD (`docs/07-database-design.md`), and Backend APIs (`docs/08-api-contract.md`).

---

## 1. 🌐 Main Figma File
- **Figma File URL**: 
  <!-- Example: https://www.figma.com/design/AbCdEfGhIjKlMnOp/Client-Project-UI?node-id=0-1 -->
- **Figma Prototype URL (Optional)**: 
- **Theme Mode**: `Light` | `Dark` | `Both (Light & Dark)`

---

## 2. 🖼️ Key Frames & Node Mapping (Optional — Add specific frames if desired)

| Screen / Page | Target Next.js Route | Figma Frame URL / Node ID | Backend Data / API Needed |
|---|---|---|---|
| **Design System / Tokens** | `globals.css` | `node-id=...` | Colors, Fonts, Spacing, Buttons, Cards |
| **Landing / Home Page** | `/` | `node-id=...` | Hero content, featured items, categories |
| **Catalog / Listing Page** | `/products` or `/items` | `node-id=...` | Search, faceted filters, pagination |
| **Detail Page** | `/products/[slug]` | `node-id=...` | Full item details, specs, reviews |
| **Auth (Login / Register)** | `/login`, `/register` | `node-id=...` | JWT / OAuth / OTP authentication |
| **Dashboard / Admin** | `/dashboard`, `/admin` | `node-id=...` | CRUD mutations, analytics, status updates |

---

## 3. 📝 Special Figma Notes from Client
- (Add any notes about interactive animations, hover states, or specific frames to ignore)
