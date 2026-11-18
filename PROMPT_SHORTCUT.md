# ⚡ 1-Click AI Prompt Shortcuts Cheat Sheet (v2.0 — Figma, Any-Backend & Full-Stack)

> **💡 Quick Language, Strategy & Backend Stack Settings**:
> Run `npm run settings` in your terminal anytime:
> - Press `1` -> Change Language (`English` or `বাংলা`).
> - Press `2` -> Change Execution Strategy (`FRONTEND_FIRST`, `FIGMA_TO_FULLSTACK`, `BOTH_FULLSTACK`, `BACKEND_FIRST`).
> - Press `3` -> Change Backend Stack (`EXPRESS_MONGOOSE`, `EXPRESS_PRISMA_POSTGRES`, `NESTJS_PRISMA_POSTGRES`, `FASTAPI_PYTHON`, `CUSTOM_ANY`).
> - Press `4` -> Scan & Parse Client Inputs (`PDF`, `Telegram HTML/TXT`, `Figma Links`, `Screenshots` -> `inputs/INTAKE_SUMMARY.md`).

---

## 1. 🚀 Master Intake Kickoff Prompts (Start of Project)

### Option A: 🎨 Figma-to-Fullstack (Figma URL / MCP -> Design Tokens -> 6-State UI -> Any Backend)
*Use this when the client provides a Figma link (`inputs/figma/figma_links.md`) or exported Figma frames/tokens and you want a complete pixel-accurate frontend + inferred backend database & APIs:*

**In English:**
```markdown
I have placed the client's Figma design and project materials in `inputs/`:
- Figma Links & Node IDs: `inputs/figma/figma_links.md` (and `inputs/figma/tokens/`, `inputs/figma/exports/`)
- Telegram chat / messages: `inputs/client_docs/telegram_chat.txt` (or `messages.html`)
- Requirements brief / PDF: `inputs/client_docs/requirements.md`

Language Preference: English
Execution Strategy: FIGMA_TO_FULLSTACK
Backend Stack: [EXPRESS_MONGOOSE | EXPRESS_PRISMA_POSTGRES | NESTJS_PRISMA_POSTGRES | FASTAPI_PYTHON | CUSTOM_ANY]
Follow `AGENTS.md` and `.agents/skills/figma-to-fullstack/SKILL.md`:
1. Run `node scripts/parse-inputs.js` and inspect the Figma links (use Figma MCP `get_figma_data` / `download_figma_images` if a live URL is provided, or inspect `inputs/figma/`).
2. Extract exact CSS design tokens (colors, typography, spacing, radius, shadows) into `docs/04-design-system.md` and `frontend/DESIGN_GUIDELINES.md`.
3. Map every Figma frame/screen to Next.js routes and 6-state UI components in `docs/03-figma-analysis.md`.
4. Infer all required backend database entities, relationships, filters, and form payloads directly from the Figma screens to generate the Mermaid ERD in `docs/07-database-design.md`, API Contract in `docs/08-api-contract.md`, and master plan in `PRD_AND_PLAN.md`.
5. Populate atomic tasks in `planning/tasks/` and STOP to present the plan to me. Do not write application code until I approve with "OK".
```

**বাংলায়:**
```markdown
আমি ক্লায়েন্টের Figma ডিজাইন এবং প্রজেক্টের ফাইলগুলো `inputs/` ফোল্ডারে রেখেছি:
- Figma লিংক ও ফ্রেম: `inputs/figma/figma_links.md`
- টেলিগ্রাম চ্যাট: `inputs/client_docs/telegram_chat.txt` (বা `messages.html`)
- রিকোয়ারমেন্টস / PDF: `inputs/client_docs/requirements.md`

Language Preference: Bangla
Execution Strategy: FIGMA_TO_FULLSTACK
Backend Stack: [EXPRESS_MONGOOSE | EXPRESS_PRISMA_POSTGRES | NESTJS_PRISMA_POSTGRES | FASTAPI_PYTHON]
`AGENTS.md` এবং `.agents/skills/figma-to-fullstack/SKILL.md` অনুসরণ করো:
1. `node scripts/parse-inputs.js` চালিয়ে Figma ডিজাইন, চ্যাট ও PDF বিশ্লেষণ করো।
2. Figma থেকে কালার টোকেন, ফন্ট, স্পেসিং ও শ্যাডো বের করে `docs/04-design-system.md` এবং `docs/03-figma-analysis.md` তৈরি করো।
3. Figma-র ফর্ম, টেবিল ও কার্ড দেখে সম্পূর্ণ ডাটাবেজ ERD (`docs/07-database-design.md`), API কন্ট্রাক্ট (`docs/08-api-contract.md`) এবং `PRD_AND_PLAN.md` তৈরি করো।
4. `planning/tasks/`-এ টাস্ক সাজিয়ে প্ল্যানটি চ্যাটে উপস্থাপন করো। আমি "OK" না বলা পর্যন্ত কোড লিখবে না।
```

---

### Option B: Frontend-First (Client Demo Priority - UI & Screenshots/Figma First)
*Use this when you want to show the client a clickable UI clone at `http://localhost:3000` before building backend APIs:*

```markdown
I have placed the client's materials in the `inputs/` directory:
- Telegram chat / messages: `inputs/client_docs/telegram_chat.txt` (or `messages.html`)
- Requirements brief / PDF: `inputs/client_docs/requirements.md`
- Figma / UI Screenshots: `inputs/figma/figma_links.md` & `inputs/screenshots/`
- Reference websites: `inputs/references.md`

Language Preference: English
Execution Strategy: FRONTEND_FIRST
Follow `AGENTS.md` and `.agents/skills/project-planning/SKILL.md`:
1. Run `node scripts/parse-inputs.js` and analyze all inputs (Telegram messages override older PDF briefs).
2. Generate `PRD_AND_PLAN.md` and `docs/` (`01` to `08`) with visual architecture & user flowcharts (Mermaid), database ERD diagram, UI breakdown, design tokens, and mock data models.
3. Order tasks in `planning/tasks/` to build the Next.js layout, pages, and 6 mandatory UI states first for client approval, followed by backend endpoints and integration.
4. STOP and present the plan to me. Do not write any code until I review and approve with "OK".
```

---

### Option C: Both / Full-Stack (With Any Backend Stack)
*Use this for concurrent full-stack development with your chosen backend stack (`EXPRESS_MONGOOSE`, `EXPRESS_PRISMA_POSTGRES`, `NESTJS_PRISMA_POSTGRES`, `FASTAPI_PYTHON`, etc.):*

```markdown
I have placed the client's materials in the `inputs/` directory:
- Telegram chat: `inputs/client_docs/telegram_chat.txt` (or `messages.html`)
- Requirements brief / PDF: `inputs/client_docs/requirements.md`
- Figma / UI Screenshots: `inputs/figma/figma_links.md` & `inputs/screenshots/`

Language Preference: English
Execution Strategy: BOTH_FULLSTACK
Backend Stack: EXPRESS_MONGOOSE (or change to EXPRESS_PRISMA_POSTGRES / NESTJS_PRISMA_POSTGRES / FASTAPI_PYTHON)
Follow `AGENTS.md`:
1. Check `settings.json` and run `node scripts/parse-inputs.js`.
2. Generate `PRD_AND_PLAN.md` and update `docs/06-backend-architecture.md`, `docs/07-database-design.md` (Mermaid ERD + schemas), and `docs/08-api-contract.md`.
3. Order tasks in `planning/tasks/` to build Database Models -> Modular Backend Controllers/Services/Routes -> Next.js 6-State Frontend -> API Integration.
4. STOP and present the plan to me. Do not write any code until I review and approve with "OK".
```

---

### Option D: 🎯 Exact Screenshot Clone & Zero-Placeholder UI First
*Use this when the client gave you specific screenshots in `inputs/screenshots/` and you want 100% pixel-accurate visual fidelity:*

```markdown
I have placed client UI screenshots in the `inputs/screenshots/` directory:
- UI Screenshots: `inputs/screenshots/`
- Reference websites / notes: `inputs/references.md`
- Client brief / notes: `inputs/client_docs/requirements.md`

Language Preference: English
Execution Strategy: FRONTEND_FIRST (Exact Screenshot Clone Protocol)
Follow `AGENTS.md`:
1. Deconstruct every visual element in the screenshots: extract exact hex colors, typography styles, card aspect ratios, border radius, and drop shadows into `docs/04-design-system.md`.
2. ZERO-PLACEHOLDER MANDATE: Identify every hero image, product photo, material finish, or banner in the screenshots. Proactively generate high-definition, photorealistic matching assets and place them in semantic folders under `frontend/public/images/`.
3. Include visual system/user flow diagrams, complete database plan, and Mermaid ERD diagram in `PRD_AND_PLAN.md` and `docs/07-database-design.md`.
4. Build the responsive Next.js pages using `@/components/ui` to be a pixel-accurate clone of the screenshots with all 6 UI states.
5. Run `npm run build` to verify 0 errors and provide the local preview link: http://localhost:3000.
```

---

## 2. ✅ Plan Approval & Execution Prompt
*Paste this after reviewing the generated `PRD_AND_PLAN.md` and `docs/`:*

**In English:**
```markdown
The plan is OK. Proceed to execute the tasks sequentially 1 by 1 according to `AGENTS.md` and `.agents/skills/task-execution/SKILL.md`. Run `npm run build` after each task, ensure zero TypeScript errors, and update `PROJECT_STATUS.md`, `planning/task.md`, `planning/MEMORY.md`, and `planning/updateplanning.md`.
```

**বাংলায়:**
```markdown
প্ল্যানটি ঠিক আছে। AGENTS.md অনুযায়ী ধারাবাহিকভাবে ১টি করে টাস্ক এক্সিকিউট করো। প্রতিটি টাস্কের পর npm run build চালিয়ে ০ এরর নিশ্চিত করো এবং PROJECT_STATUS.md, planning/task.md, planning/MEMORY.md ও planning/updateplanning.md আপডেট করো।
```

---

## 3. 🧠 Backend Pre-Execution Gate & Stack Selector Prompt (DB ERD & Flowchart First)
*Paste this when transitioning to Backend development (supports ANY backend stack!):*

**In English:**
```markdown
We are preparing to build the backend using Backend Stack: [EXPRESS_MONGOOSE | EXPRESS_PRISMA_POSTGRES | NESTJS_PRISMA_POSTGRES | FASTAPI_PYTHON].
Follow Mandate 7 in `AGENTS.md` and `.agents/skills/backend-development/SKILL.md`:
1. Analyze `SRS.md`, `docs/03-figma-analysis.md`, and inspect all existing frontend pages/components (`frontend/src/app/`, `frontend/src/components/`) to extract all required data models, form fields, filter parameters, and calculations.
2. Generate an End-to-End System & API Flowchart (`mermaid flowchart TD`).
3. Generate a visual Database ERD Diagram (`mermaid erDiagram`) in `docs/07-database-design.md` showing all collections/tables, field types, primary/foreign keys, and relationships (1:1, 1:N, N:M).
4. Provide the REST API endpoint specification matrix in `docs/08-api-contract.md` adhering to standard `sendResponse`.
5. STOP and present this complete visual plan in chat and save to `planning/BACKEND_PLAN.md`. Do not write any backend code until I review and approve with "OK".
```

**বাংলায়:**
```markdown
আমরা ব্যাকএন্ড তৈরির প্রস্তুতি নিচ্ছি (Backend Stack: [EXPRESS_MONGOOSE | EXPRESS_PRISMA_POSTGRES | NESTJS_PRISMA_POSTGRES | FASTAPI_PYTHON])। AGENTS.md এর Mandate 7 এবং `.agents/skills/backend-development/SKILL.md` অনুযায়ী কাজ শুরু করো:
1. SRS, Figma (`docs/03-figma-analysis.md`) এবং বর্তমান ফ্রন্টএন্ডের সকল পেজ ও কম্পোনেন্ট অ্যানালাইসিস করে ডাটা মডেল, ফিল্ড ও কুয়েরি বের করো।
2. এন্ড-টু-এন্ড এপিআই রিকোয়েস্ট ফ্লোচার্ট (`mermaid flowchart TD`) তৈরি করো।
3. সম্পূর্ণ ডাটাবেজ ইআরডি ডায়াগ্রাম (`mermaid erDiagram`) `docs/07-database-design.md`-এ তৈরি করো।
4. রেস্ট এপিআই এন্ডপয়েন্ট ম্যাট্রিক্স `docs/08-api-contract.md`-এ প্রদর্শন করো।
5. ব্যাকএন্ডের কোড লেখার আগে পুরো প্ল্যান ও ডায়াগ্রাম চ্যাটে উপস্থাপন করো এবং `planning/BACKEND_PLAN.md` ফাইলে সেভ করো। আমি "OK" না বলা পর্যন্ত কোনো কোড লিখবে না।
```

---

## 4. 🔄 Client Modifications & Senior Full-Stack Ripple Prompts (Phase 5 Zero-Regression Protocol)

### Method 1: Full-Stack Logical Modification (`inputs/modifications/`)
*Use this when the full-stack project is built and the client requests changes that impact the Database, Backend APIs, and Frontend UI simultaneously:*

**In English:**
```markdown
Client requested updates/modifications. I have organized the revision materials into `inputs/modifications/`:
- Written Updates Brief: `inputs/modifications/update_notes/updates.md`
- Telegram Chat Export: `inputs/modifications/telegram_chats/` (messages.html / telegram_chat.txt)
- Revision Screenshots / Figma: `inputs/modifications/screenshots/` & `inputs/figma/figma_links.md`

Execution Mode: CLIENT_MODIFICATION (Senior Full-Stack Ripple & Zero-Regression)
Follow Section 5 of `AGENTS.md` and `.agents/skills/client-modification/SKILL.md`:
1. Layer 1 (Anti-Regression): Read `planning/MEMORY.md` and `PROJECT_STATUS.md` first to protect all existing working features and routes.
2. Layer 2 (Full-Stack Ripple Analysis): Run `node scripts/parse-inputs.js`, trace how the client's changes impact Database Schemas (`docs/07-database-design.md`) -> Backend Services/Routes/Validation (`docs/08-api-contract.md`) -> Frontend Types & 6-State UI, and create atomic tasks (`TASK-MOD-XXX.md`) in `planning/tasks/`.
3. Layer 3 (Synchronized Implementation): Apply surgical changes across the database, backend stack, and frontend components in lockstep.
4. Layer 4 (Verification): Verify with `npm run build` on both frontend and backend (0 errors) and `npm run validate-contracts`.
5. Layer 5 (Memory & Client Reply): Always update `PROJECT_STATUS.md` and `planning/MEMORY.md`, and draft a ready-to-send Client Update Confirmation message.
```

**বাংলায়:**
```markdown
ক্লায়েন্টের নতুন পরিবর্তন ও রিভিশনের তথ্য `inputs/modifications/` ফোল্ডারে সাজিয়ে রেখেছি:
- লিখিত আপডেট নোট: `inputs/modifications/update_notes/updates.md`
- টেলিগ্রাম চ্যাট এক্সপোর্ট: `inputs/modifications/telegram_chats/`
- রিভিশন স্ক্রিনশট / Figma: `inputs/modifications/screenshots/` ও `inputs/figma/figma_links.md`

AGENTS.md এর Section 5 এবং `.agents/skills/client-modification/SKILL.md` (Senior Full-Stack Ripple Protocol) অনুসরণ করো:
1. প্রথমে `planning/MEMORY.md` এবং `PROJECT_STATUS.md` দেখে বর্তমান কাজের স্টেট প্রটেক্ট করো।
2. `node scripts/parse-inputs.js` চালিয়ে ক্লায়েন্টের পরিবর্তনটি ডাটাবেজ (`docs/07-database-design.md`), ব্যাকএন্ড API (`docs/08-api-contract.md`) এবং ফ্রন্টএন্ড UI-এর কোথায় প্রভাব ফেলবে তা বের করে ফুল-স্ট্যাক আপডেট সম্পন্ন করো।
3. ফ্রন্টএন্ড ও ব্যাকএন্ডে `npm run build` চালিয়ে ০ এরর নিশ্চিত করো।
4. সবশেষে `PROJECT_STATUS.md` ও `planning/MEMORY.md` আপডেট করো এবং ক্লায়েন্টকে পাঠানোর জন্য একটি রেডি মেসেজ লিখে দাও।
```

---

### Method 2: Component Bundle (Image + Notes in ONE folder - e.g. `inputs/modifications/features/navbar/`)
**In English:**
```markdown
I have created a component modification bundle in `inputs/modifications/features/navbar/`:
- Screenshot(s): `inputs/modifications/features/navbar/` (reference image)
- Instructions: `inputs/modifications/features/navbar/notes.txt`

Follow Section 5 of `AGENTS.md`:
1. Read `notes.txt` and inspect the attached screenshot(s) to understand the requested design/logic changes.
2. Locate the corresponding component in `frontend/src/components/` (and backend endpoint if data changes).
3. Apply surgical modifications to match the screenshot and requirements with zero regressions.
4. Run `npm run build` on both frontend and backend to verify 0 errors.
5. Always update `PROJECT_STATUS.md` and `planning/MEMORY.md`.
```

---

## 5. 💬 Client Message & Context-Aware Conversation Reply Prompt (`npm run reply`)
*Use this whenever a client sends you a message/question on Telegram, WhatsApp, Fiverr, or Upwork (paste it in `inputs/client_comms/incoming_message.md` or directly below):*

**In English:**
```markdown
Read the client's latest message in `inputs/client_comms/incoming_message.md` (or below) along with `planning/MEMORY.md`, `PROJECT_STATUS.md`, and our conversation history (`inputs/client_docs/telegram_chat.txt` / `inputs/client_comms/reply_history.md`).
Follow `.agents/skills/client-communication/SKILL.md`:
1. Analyze what the client is asking based on our actual codebase and conversation history.
2. Draft ready-to-send Senior Developer replies:
   - Option 1: Quick Chat Reply (Telegram / WhatsApp / Slack)
   - Option 2: Detailed Professional Reply (Fiverr / Upwork / Email)
3. If the client's message requests any code or UI modification, execute it across the full stack following `.agents/skills/client-modification/SKILL.md`.
4. Log the reply in `inputs/client_comms/reply_history.md` and ALWAYS update `planning/MEMORY.md`.
```

**বাংলায়:**
```markdown
`inputs/client_comms/incoming_message.md` ফাইলে (অথবা নিচে) দেওয়া ক্লায়েন্টের মেসেজটি পড়ো। সাথে `planning/MEMORY.md`, `PROJECT_STATUS.md` এবং আমাদের আগের কনভার্সেশন হিস্ট্রি মিলিয়ে `.agents/skills/client-communication/SKILL.md` অনুসরণ করো:
1. প্রজেক্টের বর্তমান অগ্রগতি ও কথোপকথনের ওপর ভিত্তি করে ক্লায়েন্টকে পাঠানোর জন্য প্রফেশনাল Senior Developer রিপ্লাই ড্রাফট করো (Telegram/WhatsApp এবং Fiverr/Upwork ভার্সন)।
2. ক্লায়েন্ট যদি কোনো কোড বা ডিজাইন পরিবর্তনের কথা বলে থাকে, তবে `.agents/skills/client-modification/SKILL.md` অনুযায়ী ফুল-স্ট্যাক পরিবর্তন সম্পন্ন করো।
3. রিপ্লাইটি `inputs/client_comms/reply_history.md`-এ সেভ করো এবং অবশ্যই `planning/MEMORY.md` আপডেট করো।
```

---

## 6. 🌅 Next-Day & Fresh Session Resume Prompt (Save 95% Tokens)

**In English:**
```markdown
Read PROJECT_STATUS.md and planning/MEMORY.md (Checkpoint: [YYYY-MM-DD HH:MM]) to restore session state and execute the next task [TASK-XXX].
```

**বাংলায়:**
```markdown
PROJECT_STATUS.md এবং planning/MEMORY.md (চেকপয়েন্ট: [YYYY-MM-DD HH:MM]) দেখে সেশন স্টেট রিস্টোর করো এবং পরবর্তী টাস্কটি [TASK-XXX] এক্সিকিউট করো।
```

---

## 6. 📦 Final Handover & Audit Prompt

**In English:**
```markdown
All tasks are marked DONE. Run the final validation suites (`npm run validate` and `npm run validate-contracts`), verify that both backend and frontend build with 0 errors, and provide a clean client delivery summary.
```
