---
name: task-execution
description: Standard workflow for executing a single isolated task from planning/tasks/TASK-XXX.md with 90% token reduction, continuous build gates, and automated MEMORY.md state logging.
---

# Task Execution & Memory Sync Workflow

## Purpose
Standard operating procedure when implementing an assigned task from `planning/task.md` and `PROJECT_STATUS.md`.

## Execution Steps

### 1. Context-Isolated Task Intake (90% Token Savings)
- Identify the next unfinished `TASK-ID` in `PROJECT_STATUS.md` / `planning/task.md`.
- Read **only** `planning/tasks/${TASK-ID}.md` and its direct contract references (`docs/08-api-contract.md`, `docs/04-design-system.md`, or target source files).
- Do not scan unrelated directories or lockfiles.

### 2. Surgical Implementation
- Implement the deliverables in `backend/` or `frontend/`.
- Enforce the 6 Mandatory UI States on frontend screens and the `sendResponse` contract on backend routes.

### 3. Continuous Build Verification Gate
- Run `npm run build` in `backend/` (0 TypeScript errors) and `npm test --prefix backend` when backend code changes.
- Run `npm run build` in `frontend/` (0 Next.js / TypeScript errors).

### 4. Automated Memory & Status Synchronization
- Mark the task `DONE` in `planning/task.md`, `planning/updateplanning.md`, and `PROJECT_STATUS.md` (`[x]`).
- Log the prompt summary, modified files, build verification, and live system snapshot in `planning/MEMORY.md`.
- Output the **Task Completion Report & Next-Day Session Suggestion Card** in the developer's active language (`en` or `bn` from `settings.json`):

#### If Language is `EN` (English):
```markdown
---
### 🏁 Task Completion Report: [TASK-XXX]
- **Status**: DONE
- **Backend Stack**: [ACTIVE_STACK]
- **Verification**: Backend & Frontend `npm run build` passed (0 errors)
- **Checklist Updated**: `PROJECT_STATUS.md` marked [x] with next task queued
- **Memory Synced**: `planning/MEMORY.md` updated with prompt summary & system state
- **Next Ready Task**: [TASK-YYY]

💡 **Token-Saving & Next-Day Session Suggestion**:
Task completed successfully and saved to memory. To prevent token waste, resume later, or keep AI performance at peak speed, open a **New Chat Window** and paste this exact command (stamped with current checkpoint date & time):

```text
Read PROJECT_STATUS.md and planning/MEMORY.md (Checkpoint: [YYYY-MM-DD HH:MM]) to restore session state and execute the next task [TASK-YYY].
```
*(Or to continue working in this chat, simply type: **"Continue"**)*
---
```

#### If Language is `BN` (বাংলা):
```markdown
---
### 🏁 Task Completion Report: [TASK-XXX]
- **Status**: DONE
- **Backend Stack**: [ACTIVE_STACK]
- **Verification**: Backend & Frontend `npm run build` passed (0 errors)
- **Checklist Updated**: `PROJECT_STATUS.md` ফাইলে চেকমার্ক [x] ও পরবর্তী টাস্ক আপডেট করা হয়েছে
- **Memory Synced**: `planning/MEMORY.md` updated with prompt summary & system state
- **Next Ready Task**: [TASK-YYY]

💡 **Token-Saving & Next-Day Session Suggestion (টোকেন সাশ্রয় ও ধারাবাহিকতা বজায় রাখার পরামর্শ)**:
টাস্ক সফলভাবে সম্পন্ন ও মেমোরিতে সেভ হয়েছে। অতিরিক্ত টোকেন খরচ বন্ধ করতে, পরে বা কালকে শুরু করতে এখনই একটি **New Chat Window** খুলুন এবং তারিখ ও সময়সহ নিচের কমান্ডটি পেস্ট করুন:

```text
PROJECT_STATUS.md এবং planning/MEMORY.md (চেকপয়েন্ট: [YYYY-MM-DD HH:MM]) দেখে সেশন স্টেট রিস্টোর করো এবং পরবর্তী টাস্কটি [TASK-YYY] এক্সিকিউট করো।
```
*(অথবা এই চ্যাটেই চালিয়ে যেতে চাইলে শুধু লিখুন: **"Continue"**)*
---
```
