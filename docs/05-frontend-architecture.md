# 05 — Frontend Architecture (`docs/05-frontend-architecture.md`)

> **Directory**: `frontend/`  
> **Rules**: `frontend/AGENTS.md` & `frontend/DESIGN_GUIDELINES.md`

---

## 1. Directory Structure (`frontend/`)

```text
frontend/
├── public/
│   └── images/                        # Semantic Image Folder Architecture (Zero Placeholders)
│       ├── hero/                      # Hero banners, landing covers
│       ├── products/                  # Product/item cards & details
│       ├── categories/                # Category tiles & style cards
│       ├── gallery/                   # Portfolio & showcase photos
│       ├── features/                  # Technical diagrams, swatches
│       ├── anatomy/                   # Interactive cutaways & visualizers
│       ├── showroom/                  # Facility, team, showroom photos
│       └── slices/                    # Reference crops from Figma / Screenshots
├── src/
│   ├── app/                           # Next.js 14 App Router
│   │   ├── globals.css                # Tailwind & CSS Variable tokens
│   │   ├── layout.tsx                 # Root shell (Navbar + Main + Footer)
│   │   └── page.tsx                   # Home / Landing page
│   ├── components/
│   │   ├── ui/                        # 11 Reusable 6-State UI Primitives
│   │   │   ├── Alert.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Dialog.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   ├── SpecTable.tsx
│   │   │   ├── Tabs.tsx
│   │   │   ├── Textarea.tsx
│   │   │   └── index.ts
│   │   └── shared/                    # Navbar, Footer, Mobile Drawers
│   ├── lib/
│   │   └── utils.ts                   # cn() class merger & formatters
│   └── services/
│       └── api.ts                     # Centralized Axios client -> docs/08-api-contract.md
├── DESIGN_GUIDELINES.md
└── AGENTS.md
```
