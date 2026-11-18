---
name: frontend-development
description: Workflow for building Next.js 14 App Router screens, Figma/Screenshot-accurate components, 6 UI states, forms, and API integrations.
---

# Frontend Development Workflow

## Purpose
Implement performant, accessible, and visually faithful web interfaces in `frontend/` using Next.js 14 App Router, TypeScript, Tailwind CSS, and Lucide Icons.

## Step-by-Step Procedure

### 1. Design & Contract Verification
- Check `docs/03-figma-analysis.md`, `docs/04-design-system.md`, and `inputs/screenshots/` or `inputs/figma/` for visual layout.
- Check `docs/08-api-contract.md` for exact API routes, query params, and response envelopes.

### 2. Mandatory 6 UI States Implementation
Every screen, table, and interactive data component must implement:
1. **Default / Success State**: Pixel-accurate layout with realistic local assets in `frontend/public/images/<domain>/`.
2. **Loading Skeleton State**: Geometry-matched shimmer skeletons (`<SkeletonProductCard />`, `<SkeletonTableRow />`) with zero layout shift (`CLS = 0`).
3. **Empty State**: `<EmptyState />` with icon, headline, description, and reset/action CTA.
4. **Validation & Error State**: Inline `<Input error="..." />` messages and `<Alert variant="danger" />` banners.
5. **Responsive State**: Mobile (`<640px` drawer/sticky bottom bar), Tablet (`640px-1024px`), Desktop (`>1024px`).
6. **Interactive & Focus State**: Visible `focus-visible:ring-2`, smooth hover transitions, and keyboard accessibility.

### 3. Build & Asset Verification
- Ensure all images reside in semantic folders under `frontend/public/images/`.
- Run `npm run build` in `frontend/` and verify `0` TypeScript or Next.js build errors.
