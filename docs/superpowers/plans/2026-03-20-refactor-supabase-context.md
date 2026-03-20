# SupabaseContext Refactoring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor `SupabaseContext` into three distinct contexts (`AuthContext`, `SecurityContext`, `SyncContext`) to improve separation of concerns, reduce re-renders, and clarify dependencies.

**Architecture:**
- `AuthContext`: Manages Supabase session and user state.
- `SecurityContext`: Manages the AES encryption key (`securityKey`) and depends on `AuthContext` to clear the key on logout.
- `SyncContext`: Manages the actual data sync with Supabase and depends on both `AuthContext` (for user ID) and `SecurityContext` (for the key).
- All three providers will wrap the application in `main.tsx` in a strict hierarchy.

**Tech Stack:** React (Context API), TypeScript, Supabase.

---

### Task 1: Create AuthContext

**Files:**
- Create: `src/context/AuthContext.tsx`

- [ ] **Step 1: Write `AuthContext` implementation**
  Create `src/context/AuthContext.tsx` focusing strictly on `user`, `session`, `isLoggedIn`, `signIn`, and `signOut`. Use the existing logic from `SupabaseContext`. Ensure `ToastContext` is imported to show toast notifications on login/logout errors.

- [ ] **Step 2: Check types**
  Run `npx tsc --noEmit` to verify the new file is typed correctly.

- [ ] **Step 3: Commit**
  ```bash
  git add src/context/AuthContext.tsx
  git commit -m "feat: create AuthContext for Supabase session management"
  ```

### Task 2: Create SecurityContext

**Files:**
- Create: `src/context/SecurityContext.tsx`

- [ ] **Step 1: Write `SecurityContext` implementation**
  Create `src/context/SecurityContext.tsx`. This context should hold `securityKey`, and `setSecurityKey`.
  It must import `useAuth` to watch the `isLoggedIn` state and automatically clear the key if the user logs out. Use `sessionStorage` logic from `SupabaseContext`.

- [ ] **Step 2: Check types**
  Run `npx tsc --noEmit`.

- [ ] **Step 3: Commit**
  ```bash
  git add src/context/SecurityContext.tsx
  git commit -m "feat: create SecurityContext for encryption key management"
  ```

### Task 3: Create SyncContext

**Files:**
- Create: `src/context/SyncContext.tsx`

- [ ] **Step 1: Write `SyncContext` implementation**
  Create `src/context/SyncContext.tsx`. This context will handle `uploadData`, `downloadData`, `markAsDirty`, and all conflict resolution state (`SyncConflictModal`).
  It must import `useAuth` and `useSecurity` to access `user` and `securityKey`.
  Copy over the auto-backup `useEffect` and real-time version checking `useEffect` from `SupabaseContext`.

- [ ] **Step 2: Check types**
  Run `npx tsc --noEmit`.

- [ ] **Step 3: Commit**
  ```bash
  git add src/context/SyncContext.tsx
  git commit -m "feat: create SyncContext for cloud data synchronization"
  ```

### Task 4: Update main.tsx Provider Hierarchy

**Files:**
- Modify: `src/main.tsx`

- [ ] **Step 1: Replace SupabaseProvider in `main.tsx`**
  Remove `SupabaseProvider`. Wrap the App with `AuthProvider`, `SecurityProvider`, and `SyncProvider` in that exact nested order.

- [ ] **Step 2: Commit**
  ```bash
  git add src/main.tsx
  git commit -m "refactor: update provider hierarchy in main.tsx"
  ```

### Task 5: Update Consumers and Remove Old Context

**Files:**
- Modify: `src/components/SyncStatusIndicator.tsx`
- Modify: `src/components/ui/SecurityKeyModal.tsx`
- Modify: `src/features/SettingsManager.tsx`
- Modify: `src/context/ClassContext.tsx`
- Modify: `src/context/JournalContext.tsx`
- Delete: `src/context/SupabaseContext.tsx`

- [ ] **Step 1: Update `SyncStatusIndicator.tsx`**
  Replace `useSupabase` with `useAuth` (for `isLoggedIn`) and `useSync` (for `isSyncing`, `lastSync`, `isDirty`).

- [ ] **Step 2: Update `SecurityKeyModal.tsx`**
  Replace `useSupabase` with `useAuth` (for `isLoggedIn`) and `useSecurity` (for `securityKey`, `setSecurityKey`).

- [ ] **Step 3: Update `SettingsManager.tsx`**
  Replace `useSupabase` with calls to `useAuth`, `useSecurity`, and `useSync` to grab all the required state and methods.

- [ ] **Step 4: Update `ClassContext.tsx` and `JournalContext.tsx`**
  Replace `useSupabase` with `useSync` (for `markAsDirty`).

- [ ] **Step 5: Delete `SupabaseContext.tsx`**
  Remove the old file now that it's no longer used.

- [ ] **Step 6: Verify Build**
  Run `npx tsc --noEmit` and `npm run lint` to ensure everything is perfect.

- [ ] **Step 7: Commit**
  ```bash
  git rm src/context/SupabaseContext.tsx
  git add src/components src/features src/context
  git commit -m "refactor: migrate all consumers to new divided contexts and remove SupabaseContext"
  ```
