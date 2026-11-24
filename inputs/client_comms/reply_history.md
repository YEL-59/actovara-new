# 📜 Client Conversation & Reply History Log (`inputs/client_comms/reply_history.md`)

> **Purpose**: Tracks every incoming client message and the drafted Senior Developer responses, synchronized with `planning/MEMORY.md` so the AI always remembers the full client conversation context across days and sessions.

---

## Chronological Reply Archive

| Date & Time | Client Message Summary | Project State at Time of Reply | Drafted Reply & Action Taken |
|---|---|---|---|
| `Template Ready` | Initialized `inputs/client_comms/` hub | `EasyTemplate v2.0 Ready` | Ready for first client message |
| `2026-11-19` | Sardip: happy with dashboard/RAG/photos; logo to finalise before launch; asks to confirm fixed budget/timeline. (1) Phase 2 mobile inspections: architecture question only. (2) Couldn't close an action from the Actions tab (MVP). | Frontend MVP awaiting sign-off; verify flow existed only on the action record for Org Admin | Built lifecycle ⋯ menu on the Actions list/board, an Org Admin verification banner and "Verified by · date" lines. Draft reply: `inputs/client_comms/reply_2026-11-19_sardip.md` (budget line marked [CONFIRM] for Jannatul) |
| `2026-11-24` | Sardip: (1) allow closing corrective actions by written confirmation without evidence, keeping verification and the audit trail, with evidence still enforceable where appropriate; (2) can Org Admins add custom document types (tenancy, deposit protection, insurance, contracts) with optional expiry and no RAG impact? Asks whether this fits the MVP budget. | Frontend MVP awaiting sign-off; custom types partly existed (store-only, but missing ones still turned RAG red and new types did not reach existing properties) | Built TASK-MOD-001: completion methods + evidence-required flag; document types with RAG opt-out, three expiry modes, free categories, attached to existing properties. Draft reply: `inputs/client_comms/reply_2026-11-24_sardip.md` (budget [CONFIRM] for Jannatul, Q-BUD-02) |
