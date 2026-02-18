# [Design] 클라우드 동기화 자동화 (v3.5)

## 1. 아키텍처 개요
데이터의 정합성을 유지하면서도 서버 부하를 최소화하기 위해 **Debounce(자동 백업)** 및 **Polling + Focus(버전 체크)** 전략을 사용합니다.

## 2. 상세 설계

### 2.1 자동 백업 (Auto-upload)
- **로직**: 데이터가 변경될 때마다 타이머를 초기화하고, 마지막 변경 후 5초가 지나면 클라우드 백업을 실행합니다.
- **구현 방식**:
    - `SupabaseContext`에 `markAsDirty()` 함수 추가.
    - 각 컨텍스트(`JournalContext`, `ClassContext` 등)에서 데이터 변경 API 호출 시 `markAsDirty()`를 함께 호출.
    - `SupabaseProvider` 내의 `useEffect`에서 `isDirty` 상태를 감지하여 `lodash.debounce`와 유사한 방식으로 `uploadData` 수행.
- **예외 처리**:
    - `securityKey`가 없는 경우 실행하지 않음.
    - 이미 동기화(`isSyncing`) 중인 경우 대기.

### 2.2 지능형 버전 체크 (Version-polling)
- **로직**: 서버의 `updated_at` 타임스탬프만 가볍게 조회하여 로컬의 `lastSync`와 비교합니다.
- **구현 방식**:
    - `SupabaseContext`에 `checkRemoteVersion()` 함수 구현.
    - `window.addEventListener('focus', ...)`를 통해 사용자가 탭을 다시 열 때 즉시 확인.
    - `setInterval`을 통해 2분마다 주기적으로 확인.
- **UI/UX**:
    - 로컬보다 최신 버전 발견 시, `ToastContext`를 사용하여 "새로운 데이터가 있습니다. 지금 업데이트할까요?"라는 버튼이 포함된 커스텀 토스트 또는 배너 노출.

### 2.3 데이터 흐름도
1.  [사용자] 일지 수정
2.  [JournalContext] 상태 변경 + `markAsDirty()` 호출
3.  [SupabaseContext] 5초 대기 (Debounce)
4.  [SupabaseContext] `uploadData()` 실행
5.  [다른 기기] 2분 뒤 또는 탭 포커스 시 `checkRemoteVersion()` 실행
6.  [다른 기기] 알림 배너 노출 -> 사용자 클릭 -> `downloadData()` 실행

## 3. 컴포넌트 및 서비스 변경 사항

### 3.1 `src/context/SupabaseContext.tsx`
- `lastSync` 상태를 `string`에서 `Date` 객체 또는 타임스탬프로 정밀하게 관리.
- `checkRemoteVersion` 메서드 추가.
- `isDirty` 상태 및 자동 백업 타이머 로직 추가.

### 3.2 `src/context/JournalContext.tsx` & `ClassContext.tsx`
- 데이터 수정 액션(`addLog`, `updateClass` 등) 끝에 `supabase.markAsDirty()` 호출 추가.

## 4. UI 변경 사항
- **SyncStatusIndicator**: 자동 백업 중일 때 '자동 저장 중...' 메시지 표시.
- **알림 배너**: 상단에 고정되거나 토스트 형태로 나타나는 '업데이트 권장' 알림 UI.

## 5. 보안 및 성능 고려사항
- **암호화**: 자동 백업 시에도 기존 AES-256 E2EE 로직을 그대로 사용.
- **트래픽**: 버전 체크는 전체 데이터를 받지 않고 오직 `updated_at` 컬럼만 조회하도록 쿼리 최적화.
