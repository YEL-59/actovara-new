# TASK-004: Frontend Design Tokens, Navbar & Layout (100% Figma/Screenshot-Accurate)

- **Task ID**: `TASK-004`
- **Domain**: Frontend (Next.js App Router / Tailwind CSS)
- **Status**: `BACKLOG`
- **Priority**: `P0`
- **Assigned Role**: Full-Stack Developer
- **Dependencies**: `TASK-001`

---

## 1. Objective
Extract exact colors, typography hierarchy, spacing, and component structure from `inputs/figma/` and `inputs/screenshots/` (`docs/04-design-system.md` & `frontend/DESIGN_GUIDELINES.md`) and implement the 100% pixel-accurate global layout shell (Navbar with Mobile Drawer `< 640px`, Desktop Navigation `> 1024px`, and Footer).

---

## 2. Deliverables
1. Semantic CSS variables & dark/light tokens in `frontend/src/app/globals.css` and `frontend/tailwind.config.ts`.
2. Responsive Header / Navbar component (`frontend/src/components/layout/Navbar.tsx`) with mobile drawer menu (`< 640px`) and desktop navigation (`> 1024px`).
3. Global Footer component (`frontend/src/components/layout/Footer.tsx`).
4. Root Layout integration in `frontend/src/app/layout.tsx`.

---

## 3. Acceptance & Verification Criteria
- [ ] Navbar, Footer, and theme tokens visually match the client's Figma design or screenshots 100%.
- [ ] Responsive navigation verified (mobile drawer + desktop menu + keyboard focus rings).
- [ ] Next.js compilation (`npm run build --prefix frontend`) passes with 0 errors.
