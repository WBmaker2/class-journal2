# 간편 클라우드 동기화 (easy-sync) Plan Document

> Version: 1.0.0 | Created: 2026-02-18 | Status: In-Progress

## 1. Goal
사용자가 직접 Google OAuth Client ID를 발급받아야 했던 복잡한 기존 방식을 폐기하고, Supabase BaaS를 도입하여 **"구글 계정 로그인" 한 번으로 모든 데이터가 클라우드에 자동 동기화**되는 환경을 구축합니다.

## 2. Scope
- **인증 시스템**: Supabase Auth를 이용한 Google 소셜 로그인 구현.
- **데이터 스토리지**: PostgreSQL (Supabase) 기반의 사용자별 데이터 저장소 구축.
- **동기화 엔진**: 
  - 앱 시작 시 클라우드 데이터 확인 및 동기화.
  - 데이터 변경 시 배경에서 자동 저장 (Debounce 적용).
- **마이그레이션**: 기존 LocalStorage 데이터를 로그인한 사용자의 클라우드 계정으로 자동 업로드.
- **설정 UI**: 기존의 복잡한 Client ID 입력란을 제거하고 간결한 "구글 로그인" 버튼으로 교체.

## 3. Tech Stack
- **Backend**: Supabase (Auth, Database)
- **Frontend**: `@supabase/supabase-js`, `react-auth-kit` (선택적)
- **Existing**: Context API, LocalStorage (Offline-first 전략 유지)

## 4. Risks & Constraints
- **보안**: RLS(Row Level Security) 정책을 엄격히 적용하여 본인의 데이터만 접근 가능하도록 설정 필수.
- **오프라인 지원**: 클라우드 연결이 끊겨도 로컬에서 작업 가능하도록 Offline-first 로직 유지.
- **기존 데이터**: 동기화 시 로컬과 클라우드 데이터 간의 충돌 해결 전략(예: 최신 데이터 우선) 필요.

## 5. Timeline (Milestones)
1. **Supabase 프로젝트 설정**: DB 스키마 설계 및 Auth 설정.
2. **로그인 기능 구현**: `AuthContext` 신설 및 Google 로그인 연동.
3. **데이터 동기화 로직 구현**: `useSync` 훅 개발 (Upload/Download).
4. **설정 페이지 개편**: 구글 드라이브 설정 제거 및 새 동기화 UI 적용.
5. **검증 및 배포**: 데이터 정합성 테스트 후 v3.0 출시.
