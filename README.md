# 🚀 EasyTemplate v2.0: Universal AI Full-Stack & Figma-to-Code Framework

> **Version**: 2.0 (Unified `ai_framwork` Structure + Universal Any-Backend + Figma-to-Fullstack + Zero-State-Loss Memory)  
> **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS + 11 Built-In 6-State UI Primitives  
> **Backend**: **Universal / Any Backend** (`EXPRESS_MONGOOSE`, `EXPRESS_PRISMA_POSTGRES`, `NESTJS_PRISMA_POSTGRES`, `FASTAPI_PYTHON`, or `CUSTOM_ANY`)  
> **Design & Intake**: Live Figma MCP + `inputs/figma/` + Screenshot Exact Cloning + Automated PDF & Telegram (`messages.html` / `.txt`) Reader  

---

## 📚 Quick Navigation & Guides
- 📖 **English Onboarding Guide**: [HOW_TO_USE_EN.md](HOW_TO_USE_EN.md)
- 🇧🇩 **বাংলা ব্যবহার নির্দেশিকা (Bangla Guide)**: [HOW_TO_USE_BN.md](HOW_TO_USE_BN.md)
- 🗂️ **A to Z Folder & Architecture Guide**: [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)
- ⚡ **1-Click AI Prompt Shortcuts**: [PROMPT_SHORTCUT.md](PROMPT_SHORTCUT.md)
- 🤖 **Global Agent Rules**: [AGENTS.md](AGENTS.md) | [backend/AGENTS.md](backend/AGENTS.md) | [frontend/AGENTS.md](frontend/AGENTS.md)
- 🎯 **Executable Agent Skills**: [.agents/skills/](.agents/skills/) | **System Blueprints**: [docs/](docs/)

---

## ✨ What Makes EasyTemplate v2.0 the Ultimate Framework?

1. **⚙️ Supports ANY Backend Stack (`npm run settings` -> Option `3`)**:
   - Use **Express + Mongoose (MongoDB)** by default, or switch to **Express + Prisma (PostgreSQL/MySQL)**, **NestJS + Prisma + Redis**, **Python FastAPI**, or **any custom backend** while keeping the exact same modular architecture (`backend/src/modules/`, `backend/src/common/`, `backend/src/database/`) and `docs/08-api-contract.md` bridge!
2. **🎨 Full Figma-to-Design Full-Stack Support (`inputs/figma/` & `.agents/skills/figma-to-fullstack/`)**:
   - Paste Figma URLs and frame node IDs into `inputs/figma/figma_links.md` (or drop tokens/exports).
   - The AI inspects Figma (via live **Figma MCP** or exports), extracts CSS variables (`docs/04-design-system.md`), builds 6-state Next.js pages (`docs/03-figma-analysis.md`), AND automatically infers the **Database ERD (`docs/07-database-design.md`)** and **REST APIs (`docs/08-api-contract.md`)** directly from the Figma screens!
3. **🔍 Automated PDF, Telegram Chat (`messages.html`) & Asset Reader (`npm run inputs`)**:
   - Drop raw client PDFs (`.pdf`), Telegram Desktop HTML exports (`messages.html`), `.txt`/`.json` chats, Figma links, and screenshots into `inputs/`.
   - Run `npm run inputs` (`node scripts/parse-inputs.js`) to automatically parse and preview all client requirements and chat messages in `inputs/INTAKE_SUMMARY.md`.
4. **🧩 `ai_framwork` Structure Built-In (`.agents/skills/`, `docs/`, 11 UI Primitives)**:
   - Includes 9 specialized agent skills in `.agents/skills/`, modular technical contracts in `docs/` (`01` to `13` + `context-map.md`), and all 11 6-state UI primitives in `frontend/src/components/ui/` (`Alert`, `Badge`, `Button`, `Card`, `Dialog`, `EmptyState`, `Input`, `Skeleton`, `SpecTable`, `Tabs`, `Textarea`).
5. **🧠 Persistent Session Memory & Bilingual CLI (`EN` / `BN`)**:
   - Every prompt and task is logged to `planning/MEMORY.md` and `PROJECT_STATUS.md`, saving 95% of tokens across days with zero regressions.

---

## 🛠️ Quick Commands

```bash
# 1. Interactive Settings (Language EN/BN, Strategy, Backend Stack, Input Scanner, Project Sync)
npm run settings

# 2. Scan & Parse Client Inputs (PDFs, Telegram messages.html, Figma URLs, Screenshots)
npm run inputs

# 3. Start Full-Stack Development Server (Backend Port 5000 + Frontend Port 3000)
npm run dev

# 4. Build Both Backend & Frontend (0 Errors Gate)
npm run build

# 5. Validate Project Structure & API Contracts
npm run validate
npm run validate-contracts
```
