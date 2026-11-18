# 🎨 Figma-to-Fullstack Dropzone (`inputs/figma/`)

This directory is the dedicated hub for **Figma-to-Design & Full-Stack Execution**. You can build a complete pixel-accurate frontend AND infer the entire backend database schema + REST APIs directly from your client's Figma design!

---

## 📁 Folder Structure

```text
inputs/figma/
├── README.md                # This guide
├── figma_links.md           # Paste Figma File URLs, Frame Links, and Node IDs here
├── tokens/                  # Drop exported Figma Variables / W3C Design Tokens (.json / .css)
└── exports/                 # Drop exported Figma frame PNGs, SVGs, or component slices
```

---

## 🚀 3 Ways to Use Figma in EasyTemplate

### Mode A: Live Figma MCP Inspection (Recommended)
1. Paste your Figma File URL or specific Frame URLs (`https://www.figma.com/design/<fileKey>/<fileName>?node-id=...`) into `inputs/figma/figma_links.md`.
2. The AI automatically uses **Figma MCP tools** (`get_figma_data`, `download_figma_images`) and `.agents/skills/figma-to-fullstack/SKILL.md` to:
   - Extract exact colors, typography, Auto-Layout spacing, border radius, and shadows into `docs/04-design-system.md` & `frontend/tailwind.config.ts`.
   - Download SVG/PNG icons and hero/product illustrations into `frontend/public/images/<semantic-folder>/`.
   - Map every Figma frame into Next.js routes & 6-state UI components in `docs/03-figma-analysis.md`.
   - **Auto-Derive Backend Data & APIs**: Inspect all Figma forms, tables, cards, filters, and modals to generate the Database ERD (`docs/07-database-design.md`) and API Contract (`docs/08-api-contract.md`) for **any backend stack**!

### Mode B: Exported Figma Tokens + Frame Images
1. Export your Figma Variables/Tokens JSON into `inputs/figma/tokens/`.
2. Export high-res frame PNGs/SVGs into `inputs/figma/exports/` (or `inputs/screenshots/`).
3. Run the **Figma-to-Fullstack Prompt** from `PROMPT_SHORTCUT.md`.

### Mode C: Hybrid (Figma + Telegram Chat + PDF Brief)
Combine `inputs/figma/figma_links.md` with `inputs/client_docs/telegram_chat.txt` (`messages.html`) and `inputs/client_docs/requirements.md`. Run `npm run inputs` anytime to preview all detected Figma links, PDF briefs, and Telegram chat messages!
