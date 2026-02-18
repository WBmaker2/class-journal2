# PDCA Plan: Multi-Class Support (Subject Teacher Mode)

## 1. Overview
Current elementary school homeroom teacher app will be transformed into a subject teacher (middle/high school) class journal app. This involves enabling management of multiple classes, where each class has its own independent data context (attendance, logs, student records).

## 2. Goals
- **Support Multiple Classes:** Allow users to create, edit, delete, and reorder multiple classes.
- **Context Switching:** Easily switch between classes via a dropdown menu in the sidebar.
- **Data Isolation:** Ensure all data (students, attendance, logs) is scoped to the selected class.
- **UI Adaptation:** Update the application title and layout to reflect the new "Subject Teacher" focus.

## 3. Requirements

### 3.1. General
- Change App Title: `우리 반 학급 일지` -> `우리 반 학급 일지 (중등, 전담)`
- Add "Class Selector" dropdown below the "Date Picker" in the sidebar.

### 3.2. Settings (Class Management)
- **Class CRUD:**
  - Create: Input class name (e.g., "1-1", "2-3 Math").
  - Read: List all registered classes.
  - Update: Rename classes.
  - Delete: Remove a class (and potentially its associated data - *Policy decision needed*).
- **Reordering:**
  - Drag-and-drop or Up/Down buttons to reorder classes (similar to Todo list priority).
  - The order in the settings determines the order in the "Class Selector" dropdown.

### 3.3. Data Architecture
- **Schema Update:** All major data entities must include a `classId` field to associate them with a specific class.
  - `Student` -> `classId`
  - `AttendanceEntry` -> `classId` (via date/record association)
  - `DailyRecord` -> `classId`
  - `TodoItem` -> `classId` (optional, or global?) -> *Assumption: Todos might be global or class-specific. Let's make them global for now, or add a tag. User said "Dashboard... filtered by class", implies class-specific todos.* -> **Decision: Class-specific Todos.**

### 3.4. User Interface
- **Sidebar:**
  - Add `ClassSelector` component.
- **Dashboard:**
  - Show stats only for the selected class.
- **Features:**
  - `AttendanceTracker`, `ClassLogEditor`, `StudentCumulativeRecord`, `TimetableManager` must all filter data based on the currently selected `classId`.

## 4. Agent Team (Roles)
- **Product Manager (PM):** Define requirements and scope (Current Phase).
- **Schema Architect:** Design the `Class` entity and relationships.
- **UI/UX Designer:** Design the Class Selector and Management UI.
- **Frontend Developer:** Implement React components and state management.
- **Data Engineer:** Migrate existing local storage data to support `classId` (migration strategy needed for existing data).

## 5. Risks & Mitigation
- **Data Migration:** Existing data has no `classId`. 
  - *Mitigation:* Create a "Default Class" on first run and assign all existing data to it.
- **Complexity:** State management might get complex with `classId` context.
  - *Mitigation:* Use a `ClassContext` to wrap feature components.

## 6. Success Metrics
- User can create multiple classes.
- Switching classes updates the dashboard and all feature views immediately.
- Data created in "Class A" does not appear in "Class B".
