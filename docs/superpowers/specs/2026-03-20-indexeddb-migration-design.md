# [Spec] IndexedDB (Dexie.js) 마이그레이션 설계

> Version: 1.0.0 | Date: 2026-03-20 | Status: Approved

## 1. 개요 (Overview)
현재 애플리케이션은 모든 학급, 학생, 기록 데이터를 단일 JSON 객체 형태로 `localStorage`에 저장하고 있습니다. 이는 데이터가 누적됨에 따라 직렬화/역직렬화 병목을 일으키고, 확장성을 제한합니다. 이를 해결하기 위해 `Dexie.js`를 도입하여 데이터를 IndexedDB의 개별 테이블로 분리하고, 효율적인 비동기 쿼리를 가능하게 합니다.

## 2. 변경 목표 (Goals)
- **성능 향상**: 대규모 데이터셋 처리 시 메인 스레드 블로킹(블벅임 현상) 방지.
- **데이터 정규화**: 중첩된 JSON 구조를 해체하여 `classes`, `students`, `records`, `todos` 등 독립된 관계형 테이블 형태로 분리.
- **안전한 마이그레이션**: 기존 사용자의 `localStorage` 데이터를 유실 없이 IndexedDB로 안전하게 1회성 마이그레이션 처리.

## 3. 데이터베이스 스키마 (Schema)
`ClassJournalDB` 인스턴스를 생성하고 다음과 같은 테이블(Object Store)과 인덱스를 구성합니다.

- `classes`: 학급 기본 정보. (Key: `id`)
- `students`: 학생 명부. `classId`에 종속됨. (Key: `id`, Index: `classId`)
- `records`: 일별 학급일지 및 누가기록. (Key: `[classId+date]`, Index: `classId`, `date`)
  - 특정 학급의 특정 날짜 기록을 O(1) 속도로 찾기 위해 복합 키 사용.
- `todos`: 학급별 할 일 목록. (Key: `id`, Index: `classId`)
- `metadata`: `activeClassId`, `templates`, `subjects`, `migratedFromLocalStorage` 등 전역 설정 정보 보관용 키-값(K-V) 저장소. (Key: `key`)

## 4. 데이터 마이그레이션 흐름 (Migration Flow)
애플리케이션 초기화(Bootstrapping) 시점에 아래의 과정을 거칩니다.

1. **상태 확인**: `db.metadata.get('migratedFromLocalStorage')` 값이 존재하는지 확인.
2. **기존 데이터 로드**: 값이 없다면 마이그레이션 대상으로 간주하고 `localStorage.getItem('cj_data')` 호출.
3. **데이터 해체 및 분배**:
   - `classes` 배열은 `db.classes`로 `bulkPut`.
   - `classData` 객체를 순회하며, 각 학급의 `students`, `records`, `todos` 배열에 `classId` 필드를 추가한 뒤 각각의 테이블에 `bulkPut`.
   - `activeClassId`, `templates`, `subjects`는 `db.metadata`에 저장.
4. **마이그레이션 완료 마킹**: 모든 데이터 이동이 성공적으로 끝나면 `db.metadata.put({ key: 'migratedFromLocalStorage', value: true })` 실행.
5. (선택) 안전을 위해 일정 기간 동안 `localStorage` 원본 데이터는 삭제하지 않고 남겨둠.

## 5. 컴포넌트/컨텍스트 업데이트 전략
IndexedDB의 비동기(Promise) 특성에 맞게 애플리케이션 상태 관리 레이어를 수정합니다.

### 5.1 ClassContext & JournalContext
- `loadAllData`, `loadJournalData`와 같은 초기화 함수를 `async/await` 구조로 변경.
- 데이터 로딩 중 화면 깜빡임을 방지하기 위한 `isLoading` 상태 관리 철저.
- 기존에 `localStorageService`를 호출하던 모든 동기 함수(`saveCurrentRecord`, `updateClass` 등)를 `db` 객체를 다루는 비동기 함수로 교체.

### 5.2 SyncContext (클라우드 동기화)
- 기존 클라우드 동기화는 `cj_data` 단일 JSON 문자열을 암호화하여 업로드하는 방식이었습니다.
- IndexedDB 환경에서는 모든 테이블의 데이터를 비동기로 모아서 단일 JSON 객체(`AppData` 타입 형태)로 묶어주는 `exportDatabase()` 유틸리티 함수를 작성하여 기존 `uploadData` 로직에 붙입니다.
- 반대로 다운로드 시에는 복호화된 JSON을 받아 기존 마이그레이션 로직과 유사하게 각 테이블로 흩어 뿌리는 `importDatabase()` 유틸리티 함수를 작성합니다.

## 6. 성공 기준 (Success Criteria)
- [ ] 기존 로컬 스토리지 데이터가 앱 실행 시 IndexedDB로 완벽하게 마이그레이션됨.
- [ ] 학급 추가, 일지 작성, 학생 추가 등 모든 CRUD 작업이 IndexedDB를 통해 정상적으로 동작함.
- [ ] 클라우드 동기화(업로드/다운로드) 기능이 고장 없이 기존과 동일하게 동작함.
