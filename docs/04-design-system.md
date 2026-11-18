# 04 — Design System & UI Specifications (`docs/04-design-system.md`)

> **Synchronized with**: `frontend/DESIGN_GUIDELINES.md`, `frontend/src/app/globals.css`, and `frontend/tailwind.config.ts`

---

## 1. Semantic Color Tokens (CSS Variables)

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
  --text-primary: #0f172a;      /* Slate-900 */
  --text-secondary: #475569;    /* Slate-600 */
  --text-muted: #94a3b8;        /* Slate-400 */

  /* Brand / Accents (Override from Figma / Screenshots) */
  --primary: #3b82f6;           /* Electric Blue */
  --primary-hover: #2563eb;
  --primary-foreground: #ffffff;

  --secondary: #10b981;         /* Emerald Accent */
  --secondary-hover: #059669;
  --secondary-foreground: #ffffff;

  /* Semantic Feedback */
  --success: #10b981;
  --warning: #f59e0b;
  --danger: #ef4444;
  --info: #0284c7;
}

.dark {
  --bg-primary: #090d16;
  --bg-secondary: #0f172a;
  --bg-card: #131d31;
  --bg-muted: #1e293b;
  --border-subtle: #1e293b;
  --border-strong: #334155;

  --text-primary: #f8fafc;
  --text-secondary: #cbd5e1;
  --text-muted: #64748b;
}
```

---

## 2. Typography Hierarchy
- **Primary Sans**: `Inter, "Plus Jakarta Sans", system-ui, sans-serif`
- **Technical Monospace**: `"JetBrains Mono", Menlo, Consolas, monospace`
- **Scale**:
  - **H1 (Hero / Page Header)**: `text-3xl sm:text-5xl font-extrabold tracking-tight`
  - **H2 (Section Header)**: `text-2xl sm:text-3xl font-bold tracking-tight`
  - **H3 (Card / Module Title)**: `text-lg font-bold`
  - **Body**: `text-sm sm:text-base text-slate-600 dark:text-slate-400`
  - **Badge / Pill**: `text-xs font-semibold px-2.5 py-0.5 rounded-full`

---

## 3. Mandatory 6 UI States Matrix

| State | Visual Requirement | UI Primitive / Pattern |
|---|---|---|
| **1. Default / Success** | Pixel-accurate layout matching Figma or screenshot | `<Card hoverable>`, `<Badge>`, `<SpecTable>` |
| **2. Loading Skeleton** | Shimmer skeleton preserving exact card/table geometry (`CLS = 0`) | `<Skeleton />`, `<SkeletonProductCard />`, `<SkeletonTableRow />` |
| **3. Empty State** | Centered icon, headline, description, and reset/action button | `<EmptyState title="..." description="..." onAction={...} />` |
| **4. Validation / Error** | Inline field error text + dismissible alert banner | `<Input error="..." />`, `<Alert variant="danger" />` |
| **5. Responsive** | Mobile (`<640px`), Tablet (`640-1024px`), Desktop (`>1024px`) | Tailwind responsive grid & mobile drawer |
| **6. Interactive / A11y** | Visible focus rings (`focus-visible:ring-2`), WCAG 2.2 AA contrast | `<Button isLoading={...} />`, `<Tabs />`, `<Dialog />` |
