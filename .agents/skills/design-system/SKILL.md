---
name: design-system
description: Workflow for establishing semantic design tokens, typography scale, color palettes, dark/light modes, WCAG 2.2 AA contrast, and reusable UI primitives.
---

# Design System Workflow

## Purpose
Construct a coherent, accessible, and pixel-accurate design system in `docs/04-design-system.md`, `frontend/DESIGN_GUIDELINES.md`, and `frontend/src/components/ui/` before or during page construction.

## Key Deliverables
1. **Design Tokens (`frontend/src/app/globals.css` & `frontend/tailwind.config.ts`)**:
   - Surface colors: `--bg-primary`, `--bg-secondary`, `--bg-card`, `--border-subtle`.
   - Typography colors: `--text-primary`, `--text-secondary`, `--text-muted`.
   - Brand colors: `--primary`, `--primary-hover`, `--primary-foreground`, `--secondary`.
   - Feedback colors: `--success`, `--warning`, `--danger`, `--info`.
2. **Typography Scale**:
   - Primary Sans (`Inter` / `Plus Jakarta Sans`) and Monospace (`JetBrains Mono`) for technical specs/codes.
3. **Core UI Primitives (`frontend/src/components/ui/`)**:
   - `Button`, `Card`, `Input`, `Textarea`, `Badge`, `Alert`, `Skeleton`, `EmptyState`, `SpecTable`, `Tabs`, `Dialog`.

## Step-by-Step Procedure
1. Inspect `inputs/figma/figma_links.md`, `inputs/screenshots/`, and `project.config.md` for brand colors and typography.
2. Update `docs/04-design-system.md` and `frontend/DESIGN_GUIDELINES.md`.
3. Apply CSS variables in `frontend/src/app/globals.css` and extend `frontend/tailwind.config.ts`.
4. Verify contrast ratios against WCAG 2.2 AA (minimum 4.5:1 for normal text).
