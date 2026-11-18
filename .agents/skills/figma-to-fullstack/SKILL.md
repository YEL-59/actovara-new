---
name: figma-to-fullstack
description: End-to-end workflow for converting Figma designs (via Figma MCP live inspection, Figma URLs in inputs/figma/figma_links.md, or exported tokens/frames) into a complete Design System, 6-State Next.js Frontend, inferred Database ERD, and Any-Backend Full-Stack application.
---

# Figma-to-Fullstack Execution Workflow

## Purpose
Transform client Figma designs into a 100% pixel-accurate Next.js 14 frontend AND automatically infer/build the complete backend database schema, ERD, and REST API endpoints for **any configured backend stack**.

## Step-by-Step Procedure

### Stage 1: Figma Inspection & Asset/Token Extraction
1. Inspect `inputs/figma/figma_links.md` for Figma File URLs and Frame Node IDs (`?node-id=X-Y`), as well as `inputs/figma/tokens/` and `inputs/figma/exports/`.
2. **If Figma MCP is available**:
   - Call `get_figma_data` for the target file key and node IDs to inspect the exact node tree, Auto-Layout rules (`layoutMode`, `itemSpacing`, `padding`), fills, strokes, typography, and component variants.
   - Call `download_figma_images` to download SVG icons, logos, illustrations, and hero/product images directly into semantic folders under `frontend/public/images/` (`hero/`, `products/`, `categories/`, `gallery/`, `features/`, `anatomy/`, `showroom/`, `slices/`).
3. **If working from Local Figma Exports (`inputs/figma/exports/` or `inputs/screenshots/`)**:
   - Extract exact hex colors, font weights, border radii, shadows, and aspect ratios.
   - Generate or map realistic high-resolution assets in `frontend/public/images/` (Zero Placeholders).
4. Document all extracted tokens in `docs/04-design-system.md` and `frontend/DESIGN_GUIDELINES.md`, and apply them to `frontend/src/app/globals.css` and `frontend/tailwind.config.ts`.

### Stage 2: Figma Screen-to-Route & Component Breakdown (`docs/03-figma-analysis.md`)
1. Map every Figma Page/Frame to a Next.js App Router route (`/`, `/products`, `/products/[slug]`, `/dashboard`, `/admin`, etc.) in `docs/03-figma-analysis.md`.
2. Identify shared UI primitives (`Button`, `Card`, `Input`, `Badge`, `Tabs`, `Dialog`, `SpecTable`, `Skeleton`, `EmptyState`, `Alert` in `frontend/src/components/ui/`) and domain components.
3. Translate Figma Auto-Layout directly into responsive Tailwind CSS (`flex`, `grid`, `gap-*`, `p-*`) across Mobile (`<640px`), Tablet (`640px-1024px`), and Desktop (`>1024px`).

### Stage 3: Figma-to-Backend Data & API Contract Inference (Mandatory Backend Gate)
Inspect every data-bound element in the Figma screens to infer the backend architecture:
1. **Cards, Tables & Detail Views** -> Extract entity fields, data types, badges/enums, and relationships (`1:1`, `1:N`, `N:M`).
2. **Search Bars, Sidebars & Sort Dropdowns** -> Extract query parameters (`?search=`, `?category=`, `?minPrice=`, `?sort=`, `?page=`, `?limit=`).
3. **Forms, Modals & Checkout Flows** -> Extract `POST`/`PUT`/`PATCH` request payloads and validation rules.
4. Generate the **Visual Database ERD (`mermaid erDiagram`)** in `docs/07-database-design.md` and `planning/BACKEND_PLAN.md`, and the **API Contract** in `docs/08-api-contract.md`.

### Stage 4: Full-Stack Implementation & Verification
1. Build the Next.js pages and components implementing all **6 Mandatory UI States** (Default, Skeleton, Empty, Error, Responsive, Interactive/Focus).
2. Implement the backend modules in `backend/` using the active `backendStack` (`EXPRESS_MONGOOSE`, `EXPRESS_PRISMA_POSTGRES`, `NESTJS_PRISMA_POSTGRES`, `FASTAPI_PYTHON`, or `CUSTOM_ANY`).
3. Wire frontend services (`frontend/src/services/api.ts`) to live backend endpoints and verify with `npm run build` (0 errors).
