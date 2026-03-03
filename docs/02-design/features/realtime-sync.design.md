# [Design] 실시간 동기화 기능 개선 (Real-time Synchronization Improvement)

## 1. 시스템 아키텍처 (System Architecture)
- **Frontend:** React + SupabaseContext
- **Backend:** Supabase (Database, Auth, Realtime)
- **Flow:**
  1. 기기 B 로그인/포커스/실시간 이벤트 발생
  2. `checkRemoteVersion` 트리거
  3. 클라우드 `updated_at`과 로컬 `lastSyncTime` 비교
  4. 상태(`isDirty`)에 따라 자동 다운로드 또는 충돌 모달 표시

## 2. 데이터 설계 (Data Design)
### `user_journal_data` 테이블 활용
- `user_id`: UUID (PK)
- `data`: JSONB (Encrypted payload, checksum 등 포함)
- `updated_at`: TIMESTAMPTZ (최신성 비교 기준)

## 3. 상세 설계 (Detailed Design)

### 3.1. `checkRemoteVersion` 로직 강화
```typescript
const checkRemoteVersion = useCallback(async (isInitial = false) => {
  if (!user || isSyncing || showConflict) return;

  try {
    const cloudResult = await supabaseService.fetchUserData(user.id);
    if (!cloudResult) return;

    const remoteTime = new Date(cloudResult.updated_at).getTime();
    const isRemoteNewer = remoteTime > lastSyncTime + 2000;

    if (isRemoteNewer) {
      if (isDirty) {
        // 로컬 변경사항이 있는 경우 충돌 모달 표시
        setRemoteTimeStr(new Date(cloudResult.updated_at).toLocaleString());
        setPendingRemoteData(cloudResult.data);
        setShowConflict(true);
      } else {
        // 로컬 변경사항이 없는 경우 자동 다운로드
        await downloadData(true); 
      }
    } else if (isInitial && !lastSyncTime) {
      // 초기 로그인 시 데이터가 있다면 무조건 다운로드 시도
      await downloadData(true);
    }
  } catch (e) {
    console.warn('Version check failed', e);
  }
}, [user, lastSyncTime, isSyncing, showConflict, isDirty]);
```

### 3.2. `downloadData` 함수 수정
- `isAuto` 파라미터를 활용하여 자동 동기화 시의 UX 처리 (토스트 메시지 차별화)
- 다운로드 성공 시 `lastSyncTime`을 원격의 `updated_at`으로 정확히 일치시킴

### 3.3. 로그인 시퀀스 최적화
- `useEffect`에서 `user`와 `securityKey`가 준비되었을 때 `checkRemoteVersion(true)` 호출

## 4. UI/UX 설계
- **자동 동기화 시:** "클라우드에서 최신 데이터를 가져왔습니다." (Success 토스트, 짧은 노출)
- **충돌 발생 시:** 기존 `SyncConflictModal` 노출 (병합/덮어쓰기/강제업로드 선택)

## 5. 보안 및 예외 처리
- **무결성 검증:** 다운로드 시 `checksum`을 확인하여 데이터 손상 방지
- **암호화:** 모든 데이터는 클라우드 저장 전 `AES-256-GCM`으로 암호화됨 (기존 로직 유지)

## 6. 테스트 케이스 (Test Cases)
1. **기기 A에서 데이터 수정 후 기기 B 로그인:** 기기 B에 기기 A의 데이터가 자동으로 로드되는가?
2. **기기 B에서 수정 중일 때 기기 A가 업로드:** 기기 B에 충돌 모달이 뜨는가?
3. **병합 테스트:** 기기 A와 B의 서로 다른 날짜 일지가 정상적으로 합쳐지는가?
