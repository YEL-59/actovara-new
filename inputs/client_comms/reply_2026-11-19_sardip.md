# Reply draft: Sardip, 19 Nov 2026 (closing actions + Phase 2 inspections)

> Two versions below. Before sending, fill in the **[CONFIRM]** line about budget and timeline. Only Jannatul can commit to that.

---

## Option 1: Quick chat reply (Telegram)

Hi Sardip, thank you, glad the dashboard and RAG changes landed well. The logo stays easy to swap right up to launch.

On closing actions: you're right, it's MVP. Verification already existed on the action record, but only for the Org Admin role and not from the Actions tab. That's now fixed. Every row and board card has a ⋯ menu with **Verify & close**, **Request more evidence** and **Reopen**. Each one records the approver, date and reason. There's also an "awaiting your verification" banner for Org Admins. Steps to try it are below.

On mobile inspections: yes, the current architecture supports it as a Phase 2 module, starting with the mobile-responsive web app. I'll send a short outline separately.

[CONFIRM] Budget and timeline: these updates are within the agreed fixed budget and timeline.

---

## Option 2: Detailed update (formal)

Hi Sardip,

Thank you for the feedback. I'm glad the Know. Act. Prove. dashboard, RAG indicators, terminology and property photos are working well for you. Noted on the logo: it is a single asset in the app and can be swapped at any point before production launch.

**[CONFIRM] Budget and timeline:** I confirm these updates remain within our agreed fixed development budget and timeline.

### 1. Closing corrective actions (MVP, now available from the Actions tab)
The workflow is **Open → In progress → Awaiting verification → Closed**:
- [x] The action owner uploads completion evidence and selects **Request verification**. At least one evidence file is required.
- [x] An **Org Admin** reviews the evidence and either **Verifies & closes** (accepting specific evidence items and writing a closure summary) or **Requests more evidence** (reason required; the action goes back to In progress).
- [x] A closed action shows **"Verified by [name] · [date]"** on the Actions list, board and action record.
- [x] An Org Admin can **Reopen** a closed action with a recorded reason. It returns to In progress and shows a "Reopened" count.
- [x] Every step is stored in the action's activity timeline and the audit log, with who, when and why.
- [x] **New:** all of this works directly from the **Actions tab** (⋯ menu on each row or board card) as well as from the action record. Org Admins also see a banner: "N actions are awaiting your verification → Review now".

**How to try it in the demo:**
1. Use the role switcher in the top bar and choose **Org Admin**. Verification is restricted to Org Admins; the Manager role can request verification but cannot close.
2. Go to **Actions** and click **Review now** in the yellow banner, or filter by *Awaiting verification*.
3. Click **⋯** on an action, then **Verify & close**. Tick the accepted evidence, add a closure summary and confirm. The row moves to *Closed* with your name and the date.
4. Try **⋯ → Request more evidence** on another action and enter what's missing. It returns to *In progress*.
5. Filter by *Closed*, then click **⋯ → Reopen action** and enter a reason.
6. Open any action record to see the full timeline of these steps.

### 2. Future mobile site inspections (Phase 2 advice, no development requested)
Yes, the current architecture supports this well:
- **Data model:** inspections fit as a new module alongside Properties, Certificates and Actions: *Inspection templates* (checklists), *Inspections* (per property, inspector, date) and *Findings* (answer, notes, photos). Everything is saved against the property, so it appears in the property's history.
- **Photos:** reuses the same secure file upload service already used for evidence and property photographs.
- **Corrective actions from findings:** a finding can create an action through the existing Actions workflow (owner, priority, due date, verification), so Know. Act. Prove. stays one consistent process.
- **Delivery path:** step 1 is a mobile-optimised inspection screen in the existing web app (already responsive), optionally installable as a Progressive Web App. Step 2 is a dedicated iOS/Android app that uses the same backend API, so no rework is needed.
- **Offline use** on site with poor signal is the main extra consideration. We'd plan it as part of the Phase 2 scoping.

Happy to prepare a short Phase 2 scope and estimate whenever you're ready.

Kind regards,
Jannatul
