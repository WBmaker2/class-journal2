# Project Overview

This document is a high-signal orientation note for future threads working on `class-journal2`. Read this first if you need to understand what the repo does, how the app is structured, where important logic lives, and what repo state caveats currently matter.

## Snapshot

- Product: teacher-facing class journal web app
- Repository: `class-journal2`
- GitHub: `https://github.com/WBmaker2/class-journal2`
- Current app version in `package.json`: `3.9.11`
- Frontend stack: React 19 + TypeScript + Vite
- Data stack: Dexie/IndexedDB for local source of truth, Supabase for auth + cloud sync

## What The App Does

The app is built for teachers managing a classroom journal. It combines daily attendance, lesson logging, class-wide notes, student cumulative records, dashboards, timetable management, and sync/backup tools in a single tab-based interface.

## Main User-Facing Areas

- `출결 관리`: attendance and daily classroom atmosphere
- `오늘의 수업`: lesson log management
- `학급 일지`: class-wide daily log
- `학생별 누가기록`: per-student cumulative notes
- `대시보드`: summary/statistics views
- `학급 시간표 관리`: timetable management
- `설정`: cloud sync, local backup/restore, class/subject management
- `사용 안내`: in-app guidance

Main app shell lives in [App.tsx](/Users/kimhongnyeon/Dev/gemini/class-journal2/src/App.tsx). Bootstrapping and provider composition start in [main.tsx](/Users/kimhongnyeon/Dev/gemini/class-journal2/src/main.tsx).

## Feature Entry Files

If you need to jump straight into the runtime feature code, start here:

- [AttendanceTracker.tsx](/Users/kimhongnyeon/Dev/gemini/class-journal2/src/features/AttendanceTracker.tsx): attendance + daily weather/atmosphere
- [LessonLogManager.tsx](/Users/kimhongnyeon/Dev/gemini/class-journal2/src/features/LessonLogManager.tsx): lesson logs / today’s classes
- [ClassLogEditor.tsx](/Users/kimhongnyeon/Dev/gemini/class-journal2/src/features/ClassLogEditor.tsx): class-wide daily journal
- [StudentCumulativeRecord.tsx](/Users/kimhongnyeon/Dev/gemini/class-journal2/src/features/StudentCumulativeRecord.tsx): per-student accumulated notes
- [Dashboard.tsx](/Users/kimhongnyeon/Dev/gemini/class-journal2/src/features/Dashboard.tsx): summary/statistics UI
- [TimetableManager.tsx](/Users/kimhongnyeon/Dev/gemini/class-journal2/src/features/TimetableManager.tsx): class timetable management
- [SettingsManager.tsx](/Users/kimhongnyeon/Dev/gemini/class-journal2/src/features/SettingsManager.tsx): sync, backup/restore, class/subject management
- [GuideManager.tsx](/Users/kimhongnyeon/Dev/gemini/class-journal2/src/features/GuideManager.tsx): in-app usage guide

## Architecture At A Glance

### UI Shell

- The app uses a tab-based layout rather than route-based navigation.
- Desktop uses a sidebar; mobile uses a bottom navigation.
- Global date and class selection affect multiple features.

### Context Layer

Core contexts live in [src/context](/Users/kimhongnyeon/Dev/gemini/class-journal2/src/context):

- [AuthContext.tsx](/Users/kimhongnyeon/Dev/gemini/class-journal2/src/context/AuthContext.tsx): Supabase login/session state
- [SecurityContext.tsx](/Users/kimhongnyeon/Dev/gemini/class-journal2/src/context/SecurityContext.tsx): session-scoped security key
- [ClassContext.tsx](/Users/kimhongnyeon/Dev/gemini/class-journal2/src/context/ClassContext.tsx): classes, subjects, templates
- [JournalContext.tsx](/Users/kimhongnyeon/Dev/gemini/class-journal2/src/context/JournalContext.tsx): date-scoped journal and student data
- [SyncContext.tsx](/Users/kimhongnyeon/Dev/gemini/class-journal2/src/context/SyncContext.tsx): cloud sync execution, version checks, prompts, realtime hooks
- [ToastContext.tsx](/Users/kimhongnyeon/Dev/gemini/class-journal2/src/context/ToastContext.tsx): app-wide toast messages

### Data / Services Layer

Important services live in [src/services](/Users/kimhongnyeon/Dev/gemini/class-journal2/src/services):

- [db.ts](/Users/kimhongnyeon/Dev/gemini/class-journal2/src/services/db.ts): Dexie database, export/import helpers, IndexedDB migration
- [supabase.ts](/Users/kimhongnyeon/Dev/gemini/class-journal2/src/services/supabase.ts): Supabase integration
- [encryption.ts](/Users/kimhongnyeon/Dev/gemini/class-journal2/src/services/encryption.ts): client-side encryption/checksum utilities
- [syncDecision.ts](/Users/kimhongnyeon/Dev/gemini/class-journal2/src/services/syncDecision.ts): remote-version decision policy
- [syncPayload.ts](/Users/kimhongnyeon/Dev/gemini/class-journal2/src/services/syncPayload.ts): encrypted cloud payload format
- [appDataMerge.ts](/Users/kimhongnyeon/Dev/gemini/class-journal2/src/services/appDataMerge.ts): conservative local/remote merge rules
- [syncPreview.ts](/Users/kimhongnyeon/Dev/gemini/class-journal2/src/services/syncPreview.ts): dev-only modal preview state
- [dailyRecord.ts](/Users/kimhongnyeon/Dev/gemini/class-journal2/src/services/dailyRecord.ts): shared daily-record creation logic
- [syncStatus.ts](/Users/kimhongnyeon/Dev/gemini/class-journal2/src/services/syncStatus.ts): UI-facing sync readiness summary helper

## Local Storage And Cloud Sync

### Local Source Of Truth

- IndexedDB via Dexie is the main persisted local data store.
- Export/import helpers convert between IndexedDB tables and an app snapshot object.
- Legacy `localStorage` migration exists in `db.ts`.

### Cloud Sync Model

- Supabase auth handles login.
- Cloud payloads are encrypted client-side with a user-provided security key.
- The security key is stored only in session storage, not the backend.
- Sync behavior is state-based:
  - initial login + meaningful local data + newer remote data -> `server-update` prompt
  - local dirty data + newer remote data -> `conflict` prompt
  - no meaningful local data + newer remote data -> auto-download

### Important Safety Constraint

When modifying sync behavior, preserve the cloud payload shape and merge/download policy unless the user explicitly requests a behavioral change. This repo already has careful work around data-loss prevention.

## Settings / Sync Area: Current Source Of Truth

This is the area most likely to be in flux for follow-up work.

Authoritative runtime files right now:

- [SettingsManager.tsx](/Users/kimhongnyeon/Dev/gemini/class-journal2/src/features/SettingsManager.tsx): settings screen structure and copy
- [SyncContext.tsx](/Users/kimhongnyeon/Dev/gemini/class-journal2/src/context/SyncContext.tsx): actual sync execution and prompt policy
- [SyncConflictModal.tsx](/Users/kimhongnyeon/Dev/gemini/class-journal2/src/components/ui/SyncConflictModal.tsx): server-update / conflict modal UI
- [syncStatus.ts](/Users/kimhongnyeon/Dev/gemini/class-journal2/src/services/syncStatus.ts): settings-screen sync readiness summary

Planning / contract files for ongoing UX cleanup:

- [_workspace/01_design_brief.md](/Users/kimhongnyeon/Dev/gemini/class-journal2/_workspace/01_design_brief.md)
- [_workspace/01_user_flows.md](/Users/kimhongnyeon/Dev/gemini/class-journal2/_workspace/01_user_flows.md)
- [_workspace/02_ui_contract.md](/Users/kimhongnyeon/Dev/gemini/class-journal2/_workspace/02_ui_contract.md)
- [_workspace/02_api_contract.md](/Users/kimhongnyeon/Dev/gemini/class-journal2/_workspace/02_api_contract.md)

If a future thread continues settings/sync work, read the runtime files and `_workspace/` contracts together. Runtime files define actual behavior; `_workspace/` explains the current intended direction and handoff context.

## Tests And Validation

- Test runner: `vitest`
- Main command: `npm test`
- Build command: `npm run build`
- Browser smoke checks have been used for settings/sync UX verification
- Playwright is installed as a dev dependency, but most current verification is still a mix of unit tests and manual smoke checks

Tests currently cover service-level helpers such as:

- sync decision policy
- sync payload encryption/decryption
- app data merge behavior
- sync preview helper
- sync status helper

## Documentation Layout

- [README.md](/Users/kimhongnyeon/Dev/gemini/class-journal2/README.md): maintainer-facing summary
- [docs/01-plan](/Users/kimhongnyeon/Dev/gemini/class-journal2/docs/01-plan): feature plans
- [docs/02-design](/Users/kimhongnyeon/Dev/gemini/class-journal2/docs/02-design): design docs
- [docs/03-analysis](/Users/kimhongnyeon/Dev/gemini/class-journal2/docs/03-analysis): analysis notes and reasoning trail
- [docs/04-report](/Users/kimhongnyeon/Dev/gemini/class-journal2/docs/04-report): completion reports
- [_workspace](/Users/kimhongnyeon/Dev/gemini/class-journal2/_workspace): current delivery contracts and handoff notes

## Codex Harness Files

This repo includes a Codex-native delivery harness:

- [agents](/Users/kimhongnyeon/Dev/gemini/class-journal2/agents): reusable role definitions
- [.agents/skills](/Users/kimhongnyeon/Dev/gemini/class-journal2/.agents/skills): local orchestration skills
- [_workspace](/Users/kimhongnyeon/Dev/gemini/class-journal2/_workspace): handoff artifacts for design, contracts, QA, and release checks

Useful starting points:

- [tech-lead.md](/Users/kimhongnyeon/Dev/gemini/class-journal2/agents/tech-lead.md)
- [orchestrate-fullstack-delivery/SKILL.md](/Users/kimhongnyeon/Dev/gemini/class-journal2/.agents/skills/orchestrate-fullstack-delivery/SKILL.md)
- [LEADER_PROMPT_TEMPLATE.md](/Users/kimhongnyeon/Dev/gemini/class-journal2/.agents/skills/orchestrate-fullstack-delivery/LEADER_PROMPT_TEMPLATE.md)

## Repo Sync Status As Of 2026-04-14

- `main` and `origin/main` point to the same commit: `2ed4622`
- There were no newer GitHub commits to pull into the local folder at the time of comparison
- The local working tree is not clean; it contains uncommitted project changes and doc snapshot churn
- Those local changes were intentionally preserved and not reset or discarded

## What To Read Next In A New Thread

After this document, read in this order:

1. [README.md](/Users/kimhongnyeon/Dev/gemini/class-journal2/README.md)
2. [main.tsx](/Users/kimhongnyeon/Dev/gemini/class-journal2/src/main.tsx)
3. [App.tsx](/Users/kimhongnyeon/Dev/gemini/class-journal2/src/App.tsx)
4. [db.ts](/Users/kimhongnyeon/Dev/gemini/class-journal2/src/services/db.ts)
5. [SyncContext.tsx](/Users/kimhongnyeon/Dev/gemini/class-journal2/src/context/SyncContext.tsx)
6. If the task is settings/sync-specific, then read [SettingsManager.tsx](/Users/kimhongnyeon/Dev/gemini/class-journal2/src/features/SettingsManager.tsx), [SyncConflictModal.tsx](/Users/kimhongnyeon/Dev/gemini/class-journal2/src/components/ui/SyncConflictModal.tsx), and [syncStatus.ts](/Users/kimhongnyeon/Dev/gemini/class-journal2/src/services/syncStatus.ts)
7. Otherwise open the specific feature file you are touching under [src/features](/Users/kimhongnyeon/Dev/gemini/class-journal2/src/features)
8. [_workspace/02_ui_contract.md](/Users/kimhongnyeon/Dev/gemini/class-journal2/_workspace/02_ui_contract.md) and [_workspace/02_api_contract.md](/Users/kimhongnyeon/Dev/gemini/class-journal2/_workspace/02_api_contract.md) if continuing settings/sync work

## Practical Notes

- Do not assume this is a green working tree.
- Be careful with cloud sync logic because the repo explicitly tries to avoid user data loss.
- If the task is about user-facing behavior, inspect both the runtime code and the PDCA docs before changing claims in documentation.
