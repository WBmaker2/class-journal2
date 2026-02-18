# 간편 클라우드 동기화 (easy-sync) Design Document

> Version: 1.0.0 | Created: 2026-02-18 | Status: Draft

## 1. Overview
기존의 복잡한 Google OAuth Client ID 설정 방식을 Supabase Auth(Google 로그인) 및 PostgreSQL 기반의 자동 동기화 시스템으로 전환합니다. 사용자는 로그인 버튼 클릭 한 번으로 모든 데이터를 클라우드에 안전하게 백업하고 기기간 동기화할 수 있습니다.

## 2. Architecture
### System Components
- **Supabase Project**: Auth(Google) 및 Database 제공.
- **SupabaseContext**: 인증 상태(User), 세션 관리 및 Supabase 클라이언트 인스턴스 제공.
- **SyncService**: 
  - 로컬 데이터와 클라우드 데이터의 버전(timestamp) 비교.
  - 변경 감지 및 자동 업로드 (Debounced 5s).
- **Offline Strategy**: 모든 작업은 로컬에서 먼저 수행되며, 백그라운드에서 클라우드와 정합성을 맞춤.

## 3. Data Model
### Database Table (PostgreSQL)
`user_journal_data` 테이블:
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | 고유 식별자 |
| `user_id` | UUID (FK) | `auth.users` 참조 (RLS 적용) |
| `data` | JSONB | 전체 학급 데이터 (classes, classData, subjects 등) |
| `updated_at` | TIMESTAMPTZ | 데이터 최종 수정 시간 |

### RLS (Row Level Security) Policy
- **SELECT**: `auth.uid() = user_id`
- **INSERT/UPDATE**: `auth.uid() = user_id`
- 사용자는 오직 자신의 데이터만 읽고 쓸 수 있도록 강제함.

## 4. API Specification
### Supabase Client Methods
- `signInWithGoogle()`: 구글 소셜 로그인 트리거.
- `signOut()`: 로그아웃 및 로컬 세션 초기화.
- `fetchUserData()`: 클라우드에서 최신 JSON 데이터 로드.
- `upsertUserData(data)`: 로컬 데이터를 클라우드에 덮어쓰기.

## 5. UI Design
### Settings Manager (개편)
- **로그인 전**: 
  - 큰 "구글 계정으로 간편 시작하기" 버튼 표시.
  - "이제 복잡한 Client ID 설정이 필요 없습니다" 안내 문구.
- **로그인 후**:
  - 사용자 프로필(이름, 이메일) 표시.
  - "클라우드 동기화 활성화됨" 상태 표시.
  - 수동 업로드/다운로드 버튼 (선택적 제공).

## 6. Migration & Sync Flow
1. **최초 로그인 시**: 로컬에 데이터가 있다면 자동으로 클라우드에 업로드 제안.
2. **앱 진입 시**: 로컬의 `updated_at`과 클라우드의 `updated_at`을 비교하여 최신본 선택 (또는 병합).
3. **사용 중**: `JournalContext` 또는 `ClassContext`의 데이터가 변경될 때마다 5초 대기 후 클라우드로 `upsert` 수행.

## 7. Security
- **API Key**: Supabase `anon_key`는 클라이언트에 노출되어도 RLS에 의해 안전하게 보호됨.
- **Data Encryption**: 데이터 전송 시 TLS 1.2+ 적용.
