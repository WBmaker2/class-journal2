# IndexedDB (Dexie.js) Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate data storage from a synchronous, single-blob `localStorage` architecture to an asynchronous, multi-table IndexedDB architecture using `dexie.js`.

**Architecture:** Create a `ClassJournalDB` extending `Dexie` with distinct tables for `classes`, `students`, `records`, `todos`, and `metadata`. Implement a one-time migration flow from `localStorage` on boot. Refactor React Contexts (`ClassContext`, `JournalContext`, `SyncContext`) to support asynchronous data loading and persistence.

**Tech Stack:** React, TypeScript, Dexie.js, Supabase (for cloud sync).

---

### Task 1: Install Dexie and Define Database Schema

**Files:**
- Modify: `package.json`
- Create: `src/services/db.ts`

- [ ] **Step 1: Install dependencies**
  ```bash
  npm install dexie dexie-react-hooks
  ```

- [ ] **Step 2: Create `src/services/db.ts`**
  ```typescript
  import Dexie, { Table } from 'dexie';
  import type { Class, Student, DailyRecord, TodoItem, TimetableTemplate, Subject } from '../types';

  export interface StudentEntity extends Student {
    classId: string;
  }

  export interface RecordEntity extends DailyRecord {
    classId: string;
    compoundKey?: string; // e.g., `${classId}_${date}`
  }

  export interface TodoEntity extends TodoItem {
    classId: string;
  }

  export interface MetadataEntity {
    key: string;
    value: any;
  }

  export class ClassJournalDB extends Dexie {
    classes!: Table<Class, string>;
    students!: Table<StudentEntity, string>;
    records!: Table<RecordEntity, string>;
    todos!: Table<TodoEntity, string>;
    metadata!: Table<MetadataEntity, string>;

    constructor() {
      super('ClassJournalDB');
      this.version(1).stores({
        classes: 'id',
        students: 'id, classId',
        records: 'compoundKey, classId, date',
        todos: 'id, classId',
        metadata: 'key'
      });
    }
  }

  export const db = new ClassJournalDB();
  ```

- [ ] **Step 3: Verify TypeScript**
  ```bash
  npx tsc --noEmit
  ```

- [ ] **Step 4: Commit**
  ```bash
  git add package.json package-lock.json src/services/db.ts
  git commit -m "feat: install dexie and define ClassJournalDB schema"
  ```

### Task 2: Implement One-Time LocalStorage Migration

**Files:**
- Modify: `src/services/db.ts`
- Read: `src/services/localStorage.ts`

- [ ] **Step 1: Add migration utility to `db.ts`**
  Append a function to check if migration has run. If not, read `cj_data` from `localStorage`, restructure it, and use `db.transaction('rw', ...)` to bulk insert into all tables. Mark `migratedFromLocalStorage: true` in `metadata`.

- [ ] **Step 2: Create utility functions for async data access**
  In `db.ts`, create helper functions (e.g., `loadAllData()`) that return the combined state needed by the app context, assembling it from the various Dexie tables.

- [ ] **Step 3: Verify TypeScript**
  ```bash
  npx tsc --noEmit
  ```

- [ ] **Step 4: Commit**
  ```bash
  git add src/services/db.ts
  git commit -m "feat: implement one-time migration from localStorage to dexie"
  ```

### Task 3: Refactor ClassContext to use Async DB

**Files:**
- Modify: `src/context/ClassContext.tsx`
- Modify: `src/services/localStorage.ts` (Deprecate usage)

- [ ] **Step 1: Update `ClassContext` to handle async loading**
  Change the initialization `useEffect` to an async function. It should first trigger the migration (if needed), then await `db.classes.toArray()`, `db.metadata.get('templates')`, etc. Update all methods (`addClass`, `updateClass`, etc.) to perform async `db.classes.put()` or `db.metadata.put()` instead of synchronous `localStorageService` calls. Set `isLoading` to false only when fully loaded.

- [ ] **Step 2: Handle promise rejections**
  Ensure any DB operations that fail are caught and optionally shown to the user via `ToastContext`.

- [ ] **Step 3: Verify build**
  ```bash
  npx tsc --noEmit
  ```

- [ ] **Step 4: Commit**
  ```bash
  git add src/context/ClassContext.tsx
  git commit -m "refactor: migrate ClassContext to use async Dexie operations"
  ```

### Task 4: Refactor JournalContext to use Async DB

**Files:**
- Modify: `src/context/JournalContext.tsx`

- [ ] **Step 1: Update `JournalContext` data loading**
  Update `loadJournalData` to be an async function. When `activeClassId` is set, await `db.students.where('classId').equals(activeClassId).toArray()`, do the same for `records` and `todos`. Set `isDataLoaded` to true after fetching.

- [ ] **Step 2: Update mutation methods**
  Update `saveCurrentRecord`, `updateTodos`, and `manageStudents` to use `db.records.put()`, `db.todos.bulkPut()`, and `db.students.bulkPut()`.

- [ ] **Step 3: Verify build**
  ```bash
  npx tsc --noEmit
  ```

- [ ] **Step 4: Commit**
  ```bash
  git add src/context/JournalContext.tsx
  git commit -m "refactor: migrate JournalContext to use async Dexie operations"
  ```

### Task 5: Refactor SyncContext for Cloud Synchronization

**Files:**
- Modify: `src/context/SyncContext.tsx`
- Modify: `src/services/db.ts`

- [ ] **Step 1: Create Database Export/Import utilities**
  In `db.ts`, create `exportDatabase(): Promise<AppData>` that reads all tables and reconstructs the single `AppData` JSON structure used for encryption. Create `importDatabase(data: AppData): Promise<void>` that clears existing tables and bulk inserts the downloaded data.

- [ ] **Step 2: Update `SyncContext`**
  In `SyncContext.tsx`, update `uploadData` to `await exportDatabase()` instead of `localStorageService.getAllData()`. Update `downloadData` to use `await importDatabase(decrypted)`. Update the conflict resolution merge logic to use the new DB structure.

- [ ] **Step 3: Fix consumer type issues**
  Scan the rest of the application (e.g., `SettingsManager.tsx` export/import buttons) and replace any remaining `localStorageService.getAllData()` calls with `exportDatabase()`/`importDatabase()`.

- [ ] **Step 4: Final verification and cleanup**
  ```bash
  npx tsc --noEmit
  npm run lint
  ```
  Ensure `localStorageService.ts` is mostly obsolete but keep it around temporarily if needed, or remove it entirely if confident.

- [ ] **Step 5: Commit**
  ```bash
  git add src/context/SyncContext.tsx src/services/db.ts src/features/SettingsManager.tsx
  git commit -m "refactor: update SyncContext and Settings to export/import via IndexedDB"
  ```
