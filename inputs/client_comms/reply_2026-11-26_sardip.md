# Reply draft: Sardip, 26 Nov 2026 (external action communication + attachments when raising)

> Two versions below. Fill in the **[CONFIRM]** line on budget before sending. Only Jannatul can commit to that.
> Note for Jannatul: the demo data was refreshed again (new data version), so Sardip's test records will reset. Both versions mention it.

---

## Option 1: Quick chat reply (Telegram)

Hi Sardip, thank you, great to hear you're happy with the frontend. No rush on replying while you're travelling.

Both points are now in the demo:

1. **Attachments when raising an action:** yes. The "New action" form now accepts photos and documents (e.g. inspection photos), separate from the completion evidence.
2. **Sending an action to an external contact:** yes. From any action, choose **Send to external contact** and enter their name, email and role (contractor, facilities manager, landlord, tenant, resident). They get an email with a secure link to that one action. Without an account they can view it (including attachments), add comments, upload photos or documents and confirm completion. Their confirmation comes back to Actovara as "awaiting verification" for the Org Admin to verify and close, and the whole conversation stays on the action's timeline and audit log. Links expire and can be withdrawn at any time.

What sits where:
- **MVP frontend (done):** both features above, working in the demo.
- **Backend development:** sending the real emails, secure tokens, file storage and scanning, and link expiry/withdrawal. [CONFIRM] This fits within the agreed budget.
- **Suggested for Phase 2:** a saved contractor/contact directory, automatic reminders to external contacts before the due date, SMS/WhatsApp, and sending several actions from one inspection in a single email.

The demo data has been refreshed, so earlier test records will have reset.

---

## Option 2: Detailed update (formal)

Hi Sardip,

Thank you, I'm glad you're happy with the frontend. There's no rush on your reply while you're travelling.

### 1. Attaching photos and documents when raising an action
Yes. This is now in the demo.
- [x] The **New action** form accepts photos and documents (PDF, JPG, PNG or HEIC), e.g. the inspection photo of the landing.
- [x] They show on the action record under **Attachments**, kept separate from completion evidence, and more can be added later.
- [x] They are included when the action is sent to an external contact.

### 2. Sending actions to external contacts (no Actovara account)
Yes. This follows your example step by step:
- [x] Raise the action ("Replace missing light bulbs on the second-floor landing"), attach a photo, and set the priority and due date.
- [x] Choose **Send to external contact** and enter their name, email, role (contractor, facilities manager, landlord, tenant or resident), optional company and a message. Choose how long the link works and whether they may upload photos or documents.
- [x] They receive an email with a **secure link to that action only**. Without an account they can view the details and attachments, **add comments**, **upload photographic or documentary evidence** and **confirm completion**. Internal notes, owners and other actions are never shown to them.
- [x] Their confirmation returns to Actovara as **Awaiting verification**. The Organisation Admin reviews it and **verifies and closes** the action, or sends it back with a reason, which the contact sees on the same link.
- [x] The full **communication and completion history** stays on the action's timeline and in the audit log, labelled as coming from the external contact. The compliance report shows who completed it and how.
- [x] Security: links expire (7–60 days), can be **withdrawn** at any time, show when they were last opened, and use the same protection as the landlord share links.

**To try it:**
1. Open **Actions → ACT-0012 "Replace emergency lighting batteries in Building 2"**. It has attachments and was sent to an example contractor, who has already commented.
2. On any open action, click **Send to external contact** and enter your own details. The demo doesn't send real emails, so use **"open the page the contact sees"** on the confirmation screen.
3. On that page, add a comment, upload a photo and confirm completion. Then go back to the action, switch to **Org Admin** and verify it.

### 3. What is in the MVP, the backend stage and Phase 2
- **MVP, frontend complete:** attachments when raising actions; sending actions to external contacts with secure links for viewing, commenting, uploading evidence and confirming completion; Org Admin verification; full history.
- **Built during backend development:** real email delivery (a transactional email service with your sending domain), secure token storage, file storage with virus scanning, link expiry and withdrawal, and email bounce tracking. **[CONFIRM] This is covered by the agreed budget.**
- **Suggested for Phase 2:**
  - a saved directory of contractors and contacts, to pick from instead of typing details
  - automatic reminders to external contacts before or after the due date
  - SMS or WhatsApp delivery
  - sending all actions from one inspection to a contractor in a single email
  - contractor accounts or a portal for regular contractors

Subject to your confirmation, we're ready to move to backend development. The demo data has been refreshed with this update, so earlier test records will have reset.

Kind regards,
Jannatul
