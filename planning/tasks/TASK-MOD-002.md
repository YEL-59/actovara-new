# TASK-MOD-002 — External action links + attachments when raising an action

- **Source**: Sardip (client), 26 Nov 2026 (pasted message). Frontend approved subject to this clarification.
- **Status**: `DONE` (frontend + mock API; `tsc --noEmit` 0 errors). The backend is next.

| Layer | Change |
|---|---|
| Types | `ActionAttachment`, `Action.attachments`, `Action.completion.externalContact`, `ActionLink`, `ExternalContactRole`, `PublicActionView`. `ActionUpdate.external` plus types `attachment_added`, `sent_to_contact`, `external_link_revoked`, `external_comment`. `Evidence.external`; `NotificationType` `action_external`; `AuditEvent.actorRole` can be `'external'` |
| Mock DB / seed (v7) | `actionLinks`, `actionLinkSecrets` (hash only). ACT-0012 has 2 attachments and a seeded contractor link (token `demo-contractor-link-Hk82Qa`, open `/action-link/demo-contractor-link-Hk82Qa`) with one external comment |
| Services | `actionsService.addAttachment`, `.fileUrl`; exported `logActionUpdate` / `transitionAction` / `mockFileUrl`. New `services/action-links.service.ts`: `actionLinksService` (list, send, revoke) and `publicActionService` (view, comment, uploadEvidence, complete, fileUrl). `writeAudit` accepts an external actor |
| UI | New action form: attachments dropzone. Action record: Attachments card, External contacts card (send / withdraw / status / opened count), evidence "View" and external labels, new timeline entries. Quick menu: "Send to external contact". Public page `/action-link/[token]` (`components/sharing/PublicActionPage.tsx`): view, attachments, comments, evidence upload, confirm completion, returned/awaiting/closed states, invalid/expired states. Audit log shows "External contact". Notification log has the new type |
| Contract | `docs/08-api-contract.md` §2.8 |
| Phase split (reply) | MVP frontend done. Backend: real email, tokens, storage/scan, bounce. Phase 2 suggestions: contact directory, auto reminders to externals, SMS/WhatsApp, multi-action email, contractor portal |
