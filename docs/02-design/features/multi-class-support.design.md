# PDCA Design: Multi-Class Support (Subject Teacher Mode)

## 1. Architecture Overview
We will introduce a new `ClassContext` to manage the currently selected class and provide this context to all feature components. Data will be stored in `localStorage` with a `classId` key to ensure isolation between classes. The UI will be updated with new components for class management and selection.

## 2. Data Schema
This section details the necessary changes to the data structures.

### 2.1. New `Class` Entity
A new `Class` type will be defined in `src/types/index.ts`.
```typescript
// In src/types/index.ts

export interface Class {
  id: string;      // Unique identifier (e.g., UUID)
  name: string;    // User-defined name (e.g., "1-3 Science")
  order: number;   // For drag-and-drop reordering
}
```

### 2.2. Schema Updates (Adding `classId`)
The `localStorage` keys will be modified to include the `classId`. A new top-level context will manage the active class. The data structure within `localStorage` will be nested under a `classId`.

**New `localStorage` structure:**
Instead of storing records and students at the top level, we will store them under a structure that keys them by `classId`.

```typescript
// Example localStorage 'cj_data' key structure
{
  "classes": [
    { "id": "uuid-class-1", "name": "1-1", "order": 0 },
    { "id": "uuid-class-2", "name": "2-3", "order": 1 }
  ],
  "activeClassId": "uuid-class-1",
  "classData": {
    "uuid-class-1": {
      "students": [ /* students for class 1 */ ],
      "records": [ /* records for class 1 */ ],
      "todos": [ /* todos for class 1 */ ]
    },
    "uuid-class-2": {
      "students": [ /* students for class 2 */ ],
      "records": [ /* records for class 2 */ ],
      "todos": [ /* todos for class 2 */ ]
    }
  }
}
```

### 2.3. Data Migration Strategy
A one-time migration function will run on app startup.
1. Check for old data keys (`cj_daily_records`, `cj_students`).
2. If found, create a new "Default Class" (`id: 'default-class'`).
3. Move the old data into the new nested structure under the `default-class` ID.
4. Remove the old keys.

## 3. Component Design

### 3.1. Title Change (Hardcoded)
- **File:** `index.html`
- **Change:** `<title>우리 반 학급 일지</title>` will be changed to `<title>우리 반 학급 일지 (중등, 전담)</title>`.

### 3.2. `ClassManager.tsx` (New Component)
- **Location:** `src/features/ClassManager.tsx`
- **Purpose:** UI for creating, reading, updating, deleting, and reordering classes.
- **State:**
  - `classes: Class[]`
  - `newClassName: string`
- **Functions:**
  - `handleCreateClass()`
  - `handleUpdateClass(id, newName)`
  - `handleDeleteClass(id)`
  - `handleReorderClasses(newOrder)`
- **UI:** Will be placed within `SettingsManager.tsx`. It will feature an input field for new classes and a list of existing classes with drag-and-drop capabilities.

### 3.3. `ClassSelector.tsx` (New Component)
- **Location:** `src/components/ClassSelector.tsx`
- **Purpose:** A dropdown/select component to display the list of classes.
- **Props:**
  - `classes: Class[]`
  - `selectedClassId: string`
  - `onSelectClass: (id) => void`
- **UI:** A styled `<select>` element. It will be placed in the `App.tsx` sidebar layout.

### 3.4. `JournalContext.tsx` (Refactoring)
- **Purpose:** This context will be refactored to be class-aware. It will get the `activeClassId` from a new parent `ClassContext`.
- **Changes:**
  - All data-related functions (`saveRecord`, `manageStudents`, etc.) will now take `classId` as a parameter.
  - The context will expose data filtered by the `activeClassId`.

### 3.5. `ClassContext.tsx` (New Context)
- **Location:** `src/context/ClassContext.tsx`
- **Purpose:** To manage the list of classes and the currently active class. This will be the parent of `JournalContext`.
- **State:**
  - `classes: Class[]`
  - `activeClassId: string | null`
- **Exposed Value:**
  - `classes`, `activeClassId`, `setActiveClassId`, `addClass`, `updateClass`, `deleteClass`, `reorderClasses`.

## 4. Implementation Plan (File-by-File)

1.  **`src/types/index.ts`**:
    *   Add the `Class` interface.

2.  **`index.html`**:
    *   Update the `<title>` tag.

3.  **`src/context/ClassContext.tsx`**:
    *   Create the new context to manage classes and the active class ID. It will handle all CRUD operations for classes and store them in `localStorage`.

4.  **`src/features/ClassManager.tsx`**:
    *   Create the UI component for managing classes in the settings page. This component will use the `useClass` hook.

5.  **`src/features/SettingsManager.tsx`**:
    *   Integrate the new `ClassManager` component at the top of the settings page.

6.  **`src/services/localStorage.ts`**:
    *   Refactor all functions to be class-aware. For example, `saveRecord(classId, record)`, `getRecords(classId)`.
    *   Implement the one-time data migration logic.

7.  **`src/context/JournalContext.tsx`**:
    *   Refactor to use the `useClass` hook to get the `activeClassId`.
    *   All internal calls to `localStorageService` will now pass the `activeClassId`.
    *   The data exposed by the context (`students`, `records`) will be re-fetched whenever `activeClassId` changes.

8.  **`src/components/ClassSelector.tsx`**:
    *   Create the dropdown component.

9.  **`src/App.tsx`**:
    *   Wrap the main layout with `ClassProvider`.
    *   Add the `ClassSelector` component to the sidebar, below the date picker.
    *   The `JournalProvider` will be a child of `ClassProvider`.

10. **Feature Components (e.g., `Dashboard.tsx`, `AttendanceTracker.tsx`, etc.)**:
    *   No major changes are expected here, as they consume data from `JournalContext`, which will now transparently provide data for the active class. A key part of the refactor is to ensure these components re-render correctly when the class context changes.
