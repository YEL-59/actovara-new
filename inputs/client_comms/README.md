# 💬 Client Communication & Instant Context-Aware Reply Hub (`inputs/client_comms/`)

> **Purpose**: Whenever a client messages you on Telegram, WhatsApp, Fiverr, Upwork, Slack, or Email—whether asking a technical question, requesting a progress update, or asking for a scope change—drop their message into `incoming_message.md` (or paste it directly in chat). The AI reads the conversation history (`inputs/client_docs/telegram_chat.txt` / `messages.html`), live codebase progress (`PROJECT_STATUS.md`), and persistent memory (`planning/MEMORY.md`) to craft a **Senior Developer Reply** for you to send back!

---

## 🚀 How to Use (2 Ways)

### Way 1: Paste into `inputs/client_comms/incoming_message.md`
1. Paste the client's raw message into [`inputs/client_comms/incoming_message.md`](incoming_message.md).
2. Run `npm run reply` in your terminal (or paste the **Client Reply Shortcut** from `PROMPT_SHORTCUT.md`).
3. The AI generates:
   - **Quick Chat Reply** (for Telegram / WhatsApp / Slack)
   - **Formal Platform Reply** (for Fiverr / Upwork / Email)
   - **Internal Developer Analysis & Action Plan** (in your configured language `en` or `bn` — telling you if this requires a code modification, scope clarification, or is already built!)
4. All drafted replies are automatically saved to [`inputs/client_comms/reply_history.md`](reply_history.md) and logged in [`planning/MEMORY.md`](../../planning/MEMORY.md).

### Way 2: Paste Directly in AI Chat
Simply type in AI chat:
```text
Client sent this message: "[PASTE MESSAGE]". Read planning/MEMORY.md, PROJECT_STATUS.md, and our conversation history, then generate a Senior Developer reply for the client (and execute any requested code change if needed).
```
