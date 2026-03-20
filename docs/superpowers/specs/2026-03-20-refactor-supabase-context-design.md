# [Spec] SupabaseContext 리팩토링 및 다중 Provider 분리 설계

> Version: 1.0.0 | Date: 2026-03-20 | Status: Approved

## 1. 개요 (Overview)
현재 하나의 거대한 컨텍스트(`SupabaseContext`)로 운영되는 인증, 보안 키 관리, 데이터 동기화 로직을 책임별로 분리하여 유지보수성, 확장성 및 렌더링 성능을 개선합니다.

## 2. 변경 목표 (Goals)
- **책임 분리 (Separation of Concerns)**: 인증(Auth), 암복호화 키(Security), 데이터 동기화(Sync)를 독립된 Provider로 분리.
- **의존성 명확화**: 하위 계층이 상위 계층의 상태를 참조하는 단방향 의존성 구조 확립.
- **유연성 확보**: 향후 IndexedDB 도입이나 델타 동기화 등 기능 확장을 위한 기반 마련.

## 3. 상세 설계 (Detailed Design)

### 3.1 계층 구조 (Hierarchy)
애플리케이션 루트에서 다음과 같은 순서로 Provider를 구성합니다:
1. `AuthProvider` (최상위)
2. `SecurityProvider`
3. `SyncProvider` (최하위)

### 3.2 컴포넌트 명세

#### AuthContext
- **Purpose**: Supabase Auth 세션 및 유저 정보 관리.
- **State**:
  - `user: User | null`
  - `session: any`
  - `isLoggedIn: boolean`
- **Methods**:
  - `signIn()`: Google 소셜 로그인 실행.
  - `signOut()`: 로그아웃 실행.

#### SecurityContext
- **Purpose**: 데이터 암복호화에 필요한 `securityKey` 관리.
- **Dependency**: `AuthContext` (로그아웃 시 키 초기화 로직 수행).
- **State**:
  - `securityKey: string | null`
- **Methods**:
  - `setSecurityKey(key: string | null)`: 키 설정 및 `sessionStorage` 저장.

#### SyncContext
- **Purpose**: 클라우드 데이터 업로드/다운로드 및 자동 백업, 충돌 해결 로달 관리.
- **Dependency**: `AuthContext` (유저 ID 참조), `SecurityContext` (암호화 키 참조).
- **State**:
  - `isSyncing: boolean`
  - `isDirty: boolean`
  - `lastSync: string | null`
- **Methods**:
  - `uploadData(isAuto?: boolean, force?: boolean)`
  - `downloadData(isAuto?: boolean)`
  - `markAsDirty()`: 데이터 변경 발생 시 호출하여 자동 백업 트리거.

### 3.3 데이터 흐름 (Data Flow)
1. **로그인**: `AuthProvider`에서 유저 정보 업데이트 → `SecurityProvider`에서 필요한 경우 키 입력 유도 → `SyncProvider`에서 클라우드 데이터 확인.
2. **데이터 변경**: 각 컴포넌트에서 `markAsDirty()` 호출 → `SyncProvider` 내부의 `useEffect`가 5초 데드라인(Debounce) 후 `uploadData()` 실행.
3. **충돌 발생**: `SyncProvider` 내에서 `SyncConflictModal`을 렌더링하고 사용자 선택에 따라 병합/덮어쓰기 수행.

## 4. 마이그레이션 전략 (Migration)
- `src/context/SupabaseContext.tsx` 파일을 3개의 파일로 쪼개거나, 하나의 파일 내에서 3개의 Provider를 내보내도록 수정.
- 기존 `useSupabase()` 훅을 사용하는 모든 컴포넌트(약 5~8개 파일)를 새롭게 정의된 `useAuth()`, `useSecurity()`, `useSync()` 훅으로 점진적 교체.

## 5. 성공 기준 (Success Criteria)
- [ ] 기존 기능(로그인, 자동 백업, 암복호화)이 동일하게 작동함.
- [ ] 린트(Lint) 및 타입 체크(TSC) 에러가 발생하지 않음.
- [ ] 각 Provider의 역할이 코드 레벨에서 명확히 분리됨.
