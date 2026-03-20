# [Design] 학생 개인정보 보호 알림 (privacy-warning)

## 1. 개요
- **기능명**: 학생 개인정보 보호 알림 모달 (Privacy Warning Modal)
- **목표**: 개인정보가 포함된 파일을 내보낼 때 경각심을 주는 UI 설계.
- **적용 컴포넌트**: `PrivacyWarningModal.tsx`, `ClassLogEditor.tsx`, `StudentCumulativeRecord.tsx`

## 2. UI/UX 디자인
### 2.1 Privacy Warning Modal
- **Title**: 학생 개인정보 보호 안내
- **Body**: 
  - 경고 아이콘과 함께 "경고: 민감한 개인정보 포함" 문구 (Red 색상).
  - 다운로드 파일 관리 지침 (암호 설정, 유출 금지, 영구 삭제 등) 표시.
  - 관련 법령 책임 안내.
- **Footer**:
  - 좌측: '오늘 하루 이 알림창 보지 않기' 체크박스.
  - 우측: [취소], [확인 (Red Button)].

### 2.2 사용 흐름 (Export Flow)
1. 사용자가 Excel 혹은 PDF 아이콘 클릭.
2. `localStorage`의 `hidePrivacyWarning_오늘날짜` 값을 확인.
3. 값이 `true`면 즉시 내보내기 시작.
4. `false`거나 값이 없으면 `PrivacyWarningModal` 노출.
5. 모달 내 '오늘 하루 보지 않기' 선택 여부에 따라 `localStorage` 업데이트 후 내보내기 진행.

## 3. 컴포넌트 설계
### 3.1 `PrivacyWarningModal`
- **Props**:
  - `isOpen: boolean`
  - `onClose: () => void`
  - `onConfirm: () => void`
- **State**:
  - `hideToday: boolean` (체크박스 제어용)
- **Method**:
  - `handleConfirm()`: `hideToday` 값에 따라 LocalStorage에 상태 저장 후 `onConfirm()` 실행.

### 3.2 기존 컴포넌트 수정
- **ClassLogEditor & StudentCumulativeRecord**:
  - `exportMode` 상태 외에 `showPrivacyWarning`, `pendingExportMode` 상태 추가.
  - 기존 바로 Export 하던 로직을 모달 노출 로직으로 변경.
  - `handleExportClick(mode)`로 클릭 이벤트를 래핑.
  - `handlePrivacyConfirm()` 핸들러에서 펜딩된 `exportMode`를 적용하여 실제 내보내기 시작.

## 4. 데이터 모델 연동
- **LocalStorage Key**: `hidePrivacyWarning_YYYY-MM-DD` (예: `hidePrivacyWarning_2026-03-20`).
- 데이터베이스나 클라우드 연동 없음.

## 5. 예외 처리
- 모달 외부 클릭 시나 X 버튼, 취소 버튼 클릭 시에는 내보내기가 취소되고 모달이 닫히도록 처리.
