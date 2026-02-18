# 학급별 커스텀 시간표 템플릿 (custom-timetable) Gap Analysis

> Version: 1.0.0 | Created: 2026-02-18

## Match Rate: 90%

## Gap Summary
| Category | Design | Implementation | Status |
|----------|--------|----------------|--------|
| Data Model | `Timetable`, `TimetableCell`, `TimetableTemplate` 정의 | `types/index.ts`에 완벽히 구현됨 | ✅ Match |
| 학급별 격리 | `Class` 인터페이스에 `timetable` 필드 추가 | `ClassContext` 및 `localStorage` 연동 완료 | ✅ Match |
| 템플릿 기능 | 저장, 목록 조회, 삭제, 적용 기능 | `ClassContext` 및 `TimetableManager` 모달로 구현 완료 | ✅ Match |
| 일지 자동 연동 | 요일/교시 기반 과목 자동 채우기 | `LessonLogManager`에서 `activeClass.timetable` 참조 로직 구현 완료 | ✅ Match |
| 시간 설정 | 교시별 시작/종료 시간 설정 및 `TimeSettingModal` | 데이터 모델(startTime/endTime)은 존재하나 UI 미구현 | ⚠️ Gap |
| 전역 과목 관리 | (추가 요구사항) 모든 학급 공통 과목 관리 카드 | `SubjectManager` 및 `ClassContext` 확장으로 구현 완료 | ➕ Exceeded |

## Critical Gaps
1. **교시별 상세 시간 설정 UI 누락**: 설계 문서에는 `TimeSettingModal`을 통한 시작/종료 시간 설정이 계획되어 있었으나, 현재 `TimetableManager`에서는 과목 선택 기능만 구현되어 있습니다.

## Recommendations
1. **시간 설정 UI 추가**: `TimetableManager`의 각 교시 행(Row)에 시간을 입력할 수 있는 필드를 추가하거나, 일괄 설정 팝업을 구현하여 설계 사양을 충족시킬 것을 권장합니다. (현재 사용자가 크게 불편함을 느끼지 않는다면 다음 단계로 진행 가능)
