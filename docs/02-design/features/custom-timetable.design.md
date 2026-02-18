# 학급별 커스텀 시간표 템플릿 (custom-timetable) Design Document

> Version: 1.0.0 | Created: 2026-02-18 | Status: Draft

## 1. Overview
학급별로 상이한 시간표(과목, 교시, 시간)를 관리하고, 이를 템플릿으로 저장하여 다른 학급이나 미래의 학기 설정 시 재사용할 수 있는 시스템을 설계합니다.

## 2. Architecture
### System Diagram
- `ClassContext`: 학급별 시간표 데이터(`timetable`) 및 전역 템플릿 목록 관리
- `TimetableManager`: 시간표 편집 UI 및 템플릿 적용 로직
- `JournalContext`: 현재 선택된 학급의 오늘 요일 시간표를 참조하여 일지(LessonLog) 기본값 자동 채우기

### Components
- `TimetableEditor`: 요일별/교시별 과목 및 시간을 편집하는 표 형태의 인터페이스
- `TemplateSelector`: 저장된 템플릿 목록을 보여주고 선택 시 현재 학급에 적용하는 모달/드롭다운
- `TimeSettingModal`: 각 교시별 시작/종료 시간을 일괄 또는 개별 설정하는 팝업

## 3. Data Model
### Entities
```typescript
// src/types/index.ts 에 추가될 구조

export interface TimetableCell {
  subject: string;
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
}

export interface Timetable {
  // 요일(0-4: 월-금) -> 교시(1-7) -> 데이터
  days: Record<number, Record<number, TimetableCell>>;
}

// Class 인터페이스 확장
export interface Class {
  id: string;
  name: string;
  order: number;
  timetable?: Timetable; // 학급별 커스텀 시간표
}

// 전역 템플릿
export interface TimetableTemplate {
  id: string;
  name: string;
  data: Timetable;
}
```

## 4. API Specification (Local Storage Service)
| Method | Description |
|--------|-------------|
| `updateClassTimetable(classId: string, timetable: Timetable)` | 특정 학급의 시간표 저장 |
| `saveTimetableTemplate(name: string, data: Timetable)` | 현재 시간표를 새로운 템플릿으로 저장 |
| `getTimetableTemplates()` | 저장된 모든 템플릿 목록 조회 |

## 5. UI Design
- **편집 모드**: 클릭 시 과목명 수정 및 시간 설정 가능
- **템플릿 적용**: "템플릿에서 불러오기" 버튼 클릭 시 목록 팝업 -> 선택 시 현재 학급 시간표 덮어쓰기 (사용자 확인 필요)
- **일지 연동**: 일지 작성 시 현재 학급의 해당 요일/교시 과목명이 자동으로 Input에 Placeholder 또는 기본값으로 입력됨

## 6. Test Plan
| Test Case | Expected Result |
|-----------|-----------------|
| 학급 A의 시간표를 수정한 후 학급 B로 전환 | 학급 B는 기존 시간표 유지, 다시 A로 오면 수정사항 보존 |
| 현재 시간표를 '전담용' 템플릿으로 저장 | 템플릿 목록에 '전담용'이 추가됨 |
| 저장된 템플릿을 새로운 학급에 적용 | 해당 학급의 시간표가 템플릿 데이터로 즉시 변경됨 |
| 교시별 시간 수정 | 시작/종료 시간이 모든 요일에 일괄 또는 선택적으로 반영됨 |
