# 03 — Figma-to-Fullstack & Screen Inventory (`docs/03-figma-analysis.md`)

> **Sources**: `inputs/figma/figma_links.md`, Figma MCP (`get_figma_data`), `inputs/figma/exports/`, and `inputs/screenshots/`  
> **Playbook**: `.agents/skills/figma-to-fullstack/SKILL.md`

---

## 1. Figma & Visual Reference Metadata
- **Main Figma File URL**: *(See `inputs/figma/figma_links.md`)*
- **Figma Inspection Method**: Live Figma MCP (`get_figma_data` + `download_figma_images`) / Local Exports (`inputs/figma/exports/`) / Screenshots (`inputs/screenshots/`)
- **Target Aesthetic**: Pixel-accurate reproduction of Figma Auto-Layout, spacing, colors, typography, and component states.

---

## 2. Screen, Figma Node & Full-Stack Data Inventory

| Screen ID | Next.js Route | Figma Frame / Node ID or Screenshot | UI Components (`@/components/ui`) | Inferred Backend Model & API Endpoint | Required 6 UI States |
|---|---|---|---|---|---|
| `SCR-001` | `/` | `node-id=...` / `01-home.png` | `Navbar`, `Hero`, `Card`, `Badge`, `Button`, `Footer` | `GET /api/health`, `GET /api/items?featured=true` | Default, Skeleton, Error, Responsive |
| `SCR-002` | `/items` | `node-id=...` / `02-catalog.png` | `Input`, `Tabs`, `Card`, `SkeletonProductCard`, `EmptyState` | `GET /api/items?search=&category=&page=1` | Default, Skeleton, Empty, Responsive Drawer |
| `SCR-003` | `/items/[slug]` | `node-id=...` / `03-details.png` | `SpecTable`, `Tabs`, `Badge`, `Button`, `Alert` | `GET /api/items/:slug` | Default, Skeleton, Error, Interactive Tabs |
| `SCR-004` | `/dashboard` | `node-id=...` / `04-dashboard.png` | `Card`, `SpecTable`, `Dialog`, `Input`, `Textarea`, `Button` | `POST /api/items`, `PATCH /api/items/:id` | Default, Skeleton, Empty, Validation Error |

---

## 3. Figma Auto-Layout to Tailwind CSS Mapping Rules

| Figma Property | Tailwind CSS Equivalent |
|---|---|
| `layoutMode: HORIZONTAL` | `flex flex-row` |
| `layoutMode: VERTICAL` | `flex flex-col` |
| `layoutWrap: WRAP` / Grid | `flex-wrap` or `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` |
| `primaryAxisAlignItems: SPACE_BETWEEN` | `justify-between` |
| `counterAxisAlignItems: CENTER` | `items-center` |
| `itemSpacing: 16` | `gap-4` |
| `paddingLeft/Right: 24, Top/Bottom: 16` | `px-6 py-4` |
| `cornerRadius: 12` | `rounded-xl` |

---

## 4. Responsive Breakpoints
- **Mobile (`< 640px`)**: Single-column stack, slide-out navigation/filter drawer, sticky bottom action bar.
- **Tablet (`640px - 1024px`)**: 2-column card grid, collapsible sidebar, horizontal scrolling tables.
- **Desktop (`> 1024px`)**: Full multi-column grid (3–4 columns), persistent filter sidebar, full-width specification matrices.
