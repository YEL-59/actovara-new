# Frontend & Design Agent Rules (`frontend/AGENTS.md`)

> **Domain**: Next.js 14 App Router, Figma-to-Code, Screenshot Exact Cloning, Design Tokens, & 6 UI States  
> **Design System Contract**: `frontend/DESIGN_GUIDELINES.md` & `docs/04-design-system.md`  
> **Figma & Screen Inventory**: `docs/03-figma-analysis.md` & `inputs/figma/`  
> **API Contract**: `docs/08-api-contract.md`

---

## 1. Stack & Architecture
- **Framework**: Next.js 14 (App Router) with strict TypeScript.
- **Styling**: Tailwind CSS + Semantic CSS Variables (`src/app/globals.css`) mapped in `tailwind.config.ts`.
- **UI Primitives**: `@/components/ui` (`Button`, `Card`, `Input`, `Textarea`, `Badge`, `Alert`, `Skeleton`, `EmptyState`, `SpecTable`, `Tabs`, `Dialog`).
- **Design Sources**:
  1. **Figma-to-Fullstack**: Live Figma MCP (`get_figma_data`, `download_figma_images`) or `inputs/figma/figma_links.md` + `inputs/figma/tokens/`.
  2. **Screenshot Exact Clone**: Pixel-accurate cloning from `inputs/screenshots/` and component bundles in `inputs/modifications/features/`.
- **API Access**: Strictly follow `docs/08-api-contract.md` through `src/services/api.ts`. Never invent undocumented backend routes.

---

## 2. Mandatory 6 UI States
Every page, table, and interactive component must handle:
1. **Default / Success**: Clean, crisp UI matching the Figma frame or client screenshot.
2. **Loading Skeleton**: Geometry-matched shimmer skeletons (`<Skeleton />`, `<SkeletonProductCard />`, `<SkeletonTableRow />`).
3. **Empty State**: Centered icon, helpful message, and primary reset/action CTA (`<EmptyState />`).
4. **Validation & Error**: Inline field errors (`<Input error="..." />`) and dismissible alert banners (`<Alert variant="danger" />`).
5. **Responsive**: Mobile-first (`<640px` drawer/sticky bar), Tablet (`640px-1024px`), Desktop (`>1024px`).
6. **Interactive & A11y**: WCAG 2.2 AA contrast (>= 4.5:1), visible focus rings (`focus-visible:ring-2`), and smooth hover transitions.

---

## 3. Semantic Image Folder Mandate (`frontend/public/images/`)
- Never use generic placeholder boxes or broken image URLs.
- Always store and reference images in semantic domain folders:
  - `public/images/hero/`, `products/`, `categories/`, `gallery/`, `features/`, `anatomy/`, `showroom/`, `slices/`.
- Verify compilation via `npm run build` in `frontend/` (0 errors).
