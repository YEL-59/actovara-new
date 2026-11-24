# Reply draft: Sardip, 24 Nov 2026 (closing actions by confirmation + custom document types)

> Two versions below. Before sending, fill in the **[CONFIRM]** line about budget. Only Jannatul can commit to that.
> Note for Jannatul: this update refreshes the demo data (new data version), so any test records Sardip added in the demo will be reset. That is mentioned in both versions.

---

## Option 1: Quick chat reply (Telegram)

Hi Sardip, thanks for reviewing it again. Both points are now in the demo.

1. **Closing actions without evidence.** "Submit for verification" now has two options: **With evidence** (photos/documents + completion note) or **By confirmation** (completion note only, e.g. "Rubbish has been cleared from the storage area on 22/11/2026"). Both still go to the Org Admin to verify and close, and the record shows who completed it, how, who verified it and when. Where evidence matters, tick **"Require evidence to close this action"** when creating it. An Org Admin can also switch this on later, or when sending an action back.

2. **Custom document types.** Yes. An Org Admin can add their own types under **Settings → Document Types** (tenancy agreements, deposit protection, insurance, maintenance contracts, anything else). For each one they choose a category (or type a new one), whether it has a fixed renewal cycle, an expiry date entered on upload, or no expiry, and whether it **counts towards the RAG status**. If it doesn't count, it's stored against the property and never turns it amber or red. A new type appears on all matching properties straight away.

[CONFIRM] Both fit within the existing MVP and the agreed budget: they extend the current Actions and Compliance Register modules rather than adding new ones.

The demo data has been refreshed with this update, so any test records you added will have reset.

---

## Option 2: Detailed update (formal)

Hi Sardip,

Thank you for taking another look, and for the clear examples. Both refinements are now in the demo.

**[CONFIRM] Scope and budget:** Both requirements fit within the existing MVP and the agreed budget. They extend the Corrective Actions and Compliance Register modules that are already built, and no new module is needed.

### 1. Closing corrective actions with or without evidence
When the work is done, the action owner selects **Submit for verification** and chooses how it was completed:
- [x] **With evidence**: upload photographs or documents, add a completion note and submit.
- [x] **By confirmation**: enter a completion note only, e.g. *"Rubbish has been cleared from the storage area on 22/11/2026"*, and submit. No upload needed.
- [x] Both routes keep **Org Admin verification**. The admin sees the completion note, who submitted it and when, then either **verifies and closes** the action or **sends it back** with a reason.
- [x] **Evidence where it matters:** tick *"Require evidence to close this action"* when creating an action. The confirmation option is then not available for it. An Org Admin can switch this on or off on the action record. When sending an action back, they can also require evidence for the resubmission.
- [x] **Audit trail:** the action record, timeline, audit log and compliance report all record *who completed it, how (evidence or written confirmation), who verified it and when*.

**To try it:**
1. Open **Actions → ACT-0032 "Replace missing fire action notice in reception"**. It was submitted by written confirmation and is waiting for verification.
2. Switch to **Org Admin** in the top bar and click **Review & close**. The completion note and submitter are shown at the top. No evidence is needed to close it.
3. **ACT-0031 "Remove rubbish from storage area"** shows a closed example with the full trail.
4. Create a new action and try the **"Require evidence to close this action"** tick box.

### 2. Custom document types
Yes. This is now under **Settings → Document Types** (previously "Compliance Types"). An **Organisation Admin** can add and manage their own document types alongside the statutory certificates:
- [x] **Any document:** tenancy or rental agreements, deposit protection certificates, insurance, maintenance contracts or anything property-specific.
- [x] **Categories:** choose an existing category or type a new one.
- [x] **Expiry options:** a *fixed renewal cycle* (expiry calculated from the issue date), an *expiry date entered on upload* (for documents with their own end date, e.g. an insurance policy), or *no expiry* (stored only, no reminders).
- [x] **Counts towards RAG status:** on or off for each type. When off, the document is stored and tracked against the property, but it never changes the property's RAG status, dashboard counts or compliance gauge. Reports mark it as "not counted in RAG".
- [x] A new type is added to **all existing properties** of the chosen property types straight away. Properties where it doesn't apply can be marked "Not applicable" as usual.

**To try it:**
1. Go to **Settings → Document Types**. Two organisation examples are included: *Buildings Insurance Policy* (expiry date entered on upload, not counted in RAG) and *Tenancy Deposit Protection Certificate* (stored only, not counted in RAG).
2. Open **Elm House**. Its insurance policy has expired, but the property stays **green** because insurance is set not to count towards RAG.
3. Click **Add document type** and try, for example, "Tenancy Agreement".

The demo data has been refreshed with this update, so any test records you added earlier will have reset.

Kind regards,
Jannatul
