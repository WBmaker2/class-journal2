# [Design] 가로 모드 및 대화면 최적화 (v3.8)

## 1. 반응형 아키텍처
- **전략**: 'Mobile First' 기조를 유지하되, `xl` (1280px) 이상의 해상도에서 레이아웃 구조를 전면 전환하는 'Split-view' 아키텍처 적용.
- **주요 브레이크포인트**:
    - `lg` (1024px): 태블릿 세로 / 소형 노트북. 사이드바 노출 시작.
    - `xl` (1280px): 태블릿 가로 / 일반 노트북. 2분할 레이아웃(Side-by-side) 활성화.
    - `2xl` (1536px): 대화면 모니터. 콘텐츠 너비 제한(max-width) 및 다중 열 그리드.

## 2. 레이아웃 설계

### 2.1 사이드바 및 네비게이션 (`App.tsx`)
- **변경 사항**: 
    - `lg` 해상도 이상에서 사이드바(`aside`)를 상시 노출.
    - `xl` 이상에서는 사이드바 너비를 280px로 고정하고 메인 콘텐츠 영역과의 구분선(Border) 강화.
    - 하단 탭 바(`bottom-nav`)는 `md` 해상도 미만에서만 표시하도록 수정 (`hidden md:hidden` -> `md:hidden`).

### 2.2 2분할 참조 레이아웃 (Dual-pane)
- **대상 화면**: `ClassLogEditor`, `StudentCumulativeRecord`, `AttendanceTracker`.
- **설계**:
    - `xl` 해상도 이상에서 화면을 `7:3` 또는 `6:4` 비율로 분할.
    - **왼쪽 (Primary)**: 현재 작업 중인 메인 입력 폼 (일지 에디터 등).
    - **오른쪽 (Secondary)**: 참조용 미니 위젯 (오늘의 시간표, 출결 요약, 지난 메모 등).
    - 구현 방식: `grid grid-cols-1 xl:grid-cols-10 gap-6` 사용 (7열/3열 배분).

### 2.3 대시보드 위젯 확장 (`Dashboard.tsx`)
- **구조**:
    - `xl` 이상: `grid-cols-3` (출결 차트 / 요약 / 할 일 목록을 한 줄에 배치).
    - 콘텐츠 밀도: 넓은 화면에서 차트 크기를 키우고(`innerRadius` 조정), 요약 카드의 텍스트 가독성 상향.

### 2.4 시간표 레이아웃 (`TimetableManager.tsx`)
- **변경 사항**: 
    - `lg` 이상에서 수평 스크롤 제거 및 `w-full` 고정.
    - 셀 내부 여백(`p-2` -> `p-4`)을 늘려 시각적 시원함 제공.
    - 폰트 크기 `text-base`로 상향.

## 3. UI/UX 상세 요소

### 3.1 가로 모드 감지 (`CSS Media Queries`)
- `@media (orientation: landscape) and (min-width: 768px)` 조건을 활용하여 태블릿 가로 모드 시 특수 스타일 적용.
- 예: 모바일에서 세로로 나오던 버튼 그룹을 가로로 정렬.

### 3.2 타이포그래피 및 간격
- `xl` 이상에서 기본 컨테이너 패딩(`px-4` -> `px-12`) 확대.
- 헤더 타이틀 폰트 크기 상향 (`text-xl` -> `text-2xl`).

## 4. 구현 가이드
1. `App.tsx`의 `max-w-7xl` 제한을 `xl` 이상에서 `max-w-[1600px]` 또는 `max-w-full`로 확장 검토.
2. `SupabaseContext` 또는 별도 Hook을 통해 화면 크기 변화 감지 로직 보강.
3. 각 피처 컴포넌트(`ClassLogEditor` 등) 상단에 2분할 래퍼(Wrapper) 도입.
