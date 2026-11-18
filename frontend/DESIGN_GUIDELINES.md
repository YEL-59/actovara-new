# 🎨 Frontend UI/UX & Figma Design System Guidelines (`frontend/DESIGN_GUIDELINES.md`)

> **Standard**: WCAG 2.2 Level AA Compliant (Minimum 4.5:1 contrast for body text, 3.0:1 for UI controls)  
> **Design Sources**: Figma MCP / `inputs/figma/` / `inputs/screenshots/`  
> **UI Primitives**: `frontend/src/components/ui/`

---

## 1. Design Token Extraction Protocol (Figma & Screenshots)

When starting a project from **Figma** (`inputs/figma/figma_links.md` or Figma MCP) or **Screenshots** (`inputs/screenshots/`):
1. **Extract Semantic Colors**: Map primary, secondary, surface, card, border, and feedback colors in `src/app/globals.css` and `tailwind.config.ts`.
2. **Extract Typography Hierarchy**: Match font families (e.g., `Inter`, `Plus Jakarta Sans`, `JetBrains Mono`), weights, line heights, and letter spacing.
3. **Extract Layout & Auto-Layout Tokens**: Map Figma Auto-Layout padding, gap, alignment, corner radius (`rounded-lg`, `rounded-xl`, `rounded-2xl`), and elevation shadows.

```css
:root {
  /* Surfaces & Backgrounds */
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --bg-card: #ffffff;
  --bg-muted: #f1f5f9;
  --border-subtle: #e2e8f0;
  --border-strong: #cbd5e1;

  /* Typography */
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --text-muted: #94a3b8;

  /* Brand / Primary */
  --primary: #3b82f6;
  --primary-hover: #2563eb;
  --primary-foreground: #ffffff;

  /* Semantic Feedback */
  --success: #10b981;
  --warning: #f59e0b;
  --danger: #ef4444;
  --info: #0284c7;
}
```

---

## 2. Reusable UI Primitives (`@/components/ui`)

| Component | Import Path | Purpose & States Supported |
|---|---|---|
| `Button` | `@/components/ui/Button` | Variants (`primary`, `secondary`, `outline`, `ghost`, `danger`, `link`), sizes (`sm`, `md`, `lg`), `isLoading` spinner |
| `Card` | `@/components/ui/Card` | `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`, `hoverEffect` / `hoverable` |
| `Input` | `@/components/ui/Input` | `label`, `hintText`, `error`, `startIcon`, `endIcon`, accessible ARIA bindings |
| `Textarea` | `@/components/ui/Textarea` | Multi-line form control with `label`, `hintText`, `error` |
| `Badge` | `@/components/ui/Badge` | Status pills (`default`, `primary`, `secondary`, `success`, `warning`, `danger`, `outline`) |
| `Alert` | `@/components/ui/Alert` | Contextual banners (`info`, `success`, `warning`, `danger`) with optional `action` and `onDismiss` |
| `Skeleton` | `@/components/ui/Skeleton` | `Skeleton`, `SkeletonProductCard`, `SkeletonTableRow`, `SkeletonSlot` |
| `EmptyState` | `@/components/ui/EmptyState` | Centered empty state with icon, title, description, primary & secondary CTAs |
| `SpecTable` | `@/components/ui/SpecTable` | Grouped specification matrix with monospace values and highlight rows |
| `Tabs` | `@/components/ui/Tabs` | Interactive tab switcher for product details, specs, and dashboards |
| `Dialog` | `@/components/ui/Dialog` | Accessible modal dialog with backdrop blur |

---

## 3. The 6 Mandatory UI States Checklist

Before marking any frontend task `DONE`, verify all 6 states are implemented:
- [x] **1. Default / Success State**: Matches Figma frame / screenshot layout and tokens.
- [x] **2. Loading Skeleton State**: Uses `<Skeleton />` matching final layout dimensions (`CLS = 0`).
- [x] **3. Empty State**: Uses `<EmptyState />` with clear reset/create CTA when lists or filters return 0 items.
- [x] **4. Validation & Error State**: Uses inline `<Input error="..." />` and `<Alert variant="danger" />`.
- [x] **5. Responsive Breakpoints**: Mobile (`<640px`), Tablet (`640px-1024px`), Desktop (`>1024px`).
- [x] **6. Interactive & Focus State**: Visible `focus-visible:ring-2`, hover elevation, and `active:scale-[0.98]`.
