# ⚡ AI Context Policy & Progressive Disclosure

## Goal
Complete every assigned task with 100% accuracy and the **smallest sufficient context** (<300 tokens on session resume). Token efficiency must never compromise client intent, Figma/screenshot fidelity, or build verification.

## Context-Loading Protocol
1. Read `planning/MEMORY.md` and `PROJECT_STATUS.md` first when starting or resuming a session.
2. Read `settings.json` to confirm `language` (`en` or `bn`), `executionStrategy`, and `backendStack`.
3. Identify the active `TASK-ID` and read **only** its isolated spec file in `planning/tasks/TASK-XXX.md`.
4. Use [`docs/context-map.md`](context-map.md) to load only the required blueprint document (`docs/03-figma-analysis.md`, `docs/08-api-contract.md`, etc.).
5. Inspect only the direct source files being created or modified.

## Do Not Load By Default
- Never load all files in `docs/` or all files in `planning/tasks/` at once.
- Never load `package-lock.json`, `node_modules/`, `.next/`, `dist/`, or `.git/`.
- When executing a pure frontend styling task, do not load backend database schemas; when executing a backend database task, do not load CSS or image folders.
