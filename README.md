# Class Journal 2

Class Journal 2 is a React + TypeScript + Vite web app for teacher class-journal workflows. The repo already documents work around multi-class management, cloud sync, realtime conflict handling, encryption, export warnings, timetable management, and responsive layouts.

## What lives here

- `src/`: application code and UI behavior.
- `docs/01-plan` -> `docs/04-report`: PDCA trail for feature work.
- `.pdca-status.json`: root project/session status snapshot.
- `docs/.pdca-status.json`: documentation pipeline snapshot.

## Tech Stack

- React 19
- TypeScript
- Vite
- Supabase
- Dexie / IndexedDB
- Tailwind CSS 4
- DnD Kit
- date-fns, Recharts, jspdf, xlsx, html2canvas, crypto-js

## Run Locally

```bash
npm install
npm run dev
npm run build
npm run lint
npm run preview
```

## Repository Conventions

- Keep implementation changes in `src/`.
- Update the PDCA trail when a feature moves through plan, design, analysis, and report.
- Keep README and status files conservative; do not claim a feature is complete unless the docs or commits support it.
- Release and version metadata can lag briefly between `package.json`, git tags, and documentation snapshots; verify before publishing.

## Current Documented Feature Areas

- Multi-class support and PDF export stabilization
- Realtime sync and conflict resolution
- End-to-end encryption and checksum validation
- Mobile responsive and landscape-optimized layouts
- Privacy warnings for PDF/Excel export
- Custom timetable templates

## Maintainer Notes

- Recent git history shows release work through `v3.9.11`.
- The report files under `docs/04-report/` are the most reliable completion record for finished features.
- This README is intentionally maintainer-facing; user-facing product docs should stay in the app or the PDCA trail.

## Real-Server Manual Verification

Use this checklist when validating sync prompts against the real Supabase backend:

1. In device A, sign in, change class data, and run a cloud backup.
2. In device B or an incognito window, make sure some local data already exists before signing in.
3. Sign in on device B with the same account and enter the security key.
4. Confirm that the app shows the server-update prompt instead of silently auto-restoring.
5. Choose `데이터 병합 (권장)` and verify that both existing local data and newer server data remain available.
6. Repeat once with true local unsaved edits to confirm the conflict-mode prompt still appears.
