---
name: client-communication
description: Context-aware Client Message & Reply Engine. Reads incoming client messages (inputs/client_comms/incoming_message.md or chat), Telegram conversation history, PROJECT_STATUS.md, and planning/MEMORY.md to draft accurate Senior Developer replies and identify required code actions.
---

# Client Communication & Context-Aware Reply Workflow

## Purpose
When the developer receives a message from a client (via Telegram, WhatsApp, Fiverr, Upwork, Slack, or Email), analyze the message against the **entire conversation history** and **live project state** (`planning/MEMORY.md` & `PROJECT_STATUS.md`) to generate ready-to-send, technically accurate **Senior Full-Stack Developer replies** and determine if any code modification is triggered.

## Context Sources to Read First
1. `settings.json` (Check developer's preferred explanation language: `en` or `bn`).
2. `planning/MEMORY.md` & `PROJECT_STATUS.md` (Know what modules, routes, models, and UI screens are already completed vs. in progress).
3. `inputs/client_comms/incoming_message.md` & `inputs/client_comms/reply_history.md` (Latest client message and prior replies).
4. `inputs/client_docs/telegram_chat.txt` / `messages.html` & `PRD_AND_PLAN.md` (Historical requirements and agreed scope).

## Execution Steps

### 1. Intent & Scope Classification
Classify the client's message into one or more categories:
- **Type A — Progress / Status Inquiry**: Client asks what is done, requests a preview link, or checks timeline.
- **Type B — Technical / Architecture Question**: Client asks how a feature works (auth, database, hosting, payment, API).
- **Type C — In-Scope Revision / UI Tweak**: Client wants a color, layout, text, or logic adjustment within current scope.
- **Type D — New Feature / Scope Expansion**: Client requests a feature not in original `PRD_AND_PLAN.md`.
- **Type E — Bug Report / Edge Case**: Client reports an issue on a screen or endpoint.

### 2. Draft Multi-Format Client Replies
Always provide the developer with **copy-paste-ready replies in English** (or the client's language if the client message is in another language):
1. **Option 1 — Quick Chat Reply (Telegram / WhatsApp / Slack)**:
   - Short, natural, confident, and human-sounding (2–5 sentences).
   - Directly answers the client's question referencing real project facts from `PROJECT_STATUS.md` and `planning/MEMORY.md`.
2. **Option 2 — Detailed Professional Update (Fiverr / Upwork / Email)**:
   - Structured bullet points showing completed items (`[x]`), current active work, and clear next steps or questions.
3. **Developer Strategy & Action Note (in `en` or `bn` per `settings.json`)**:
   - Explain to the developer what the client is asking, whether a code change is needed, and if so, either execute it via `.agents/skills/client-modification/SKILL.md` or provide the 1-click command.

### 3. Persistent Logging (Mandatory)
- Append the incoming message summary and drafted reply into `inputs/client_comms/reply_history.md`.
- Log the interaction in Section 3 of `planning/MEMORY.md` and update Section 1 so future sessions remember what was promised to the client.
