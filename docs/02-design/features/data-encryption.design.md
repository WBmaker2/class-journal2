# 종단간 암호화 저장 (data-encryption) Design Document

> Version: 1.1.0 (v3.1) | Created: 2026-02-18 | Status: Draft

## 1. Overview
사용자의 브라우저에서 데이터를 AES-256 알고리즘으로 암호화한 후 Supabase에 저장합니다. 암호화에 사용되는 '보안 키'는 사용자가 직접 관리하며 서버에 전송되거나 저장되지 않습니다.

## 2. Architecture
### Encryption Flow
1. **Encryption**: `Local Data (JSON)` + `Security Key` → `AES-256` → `Encrypted String` → `Supabase (data column)`
2. **Decryption**: `Supabase (Encrypted String)` + `Security Key` → `AES-256` → `Local Data (JSON)`

### Security Key Management
- 사용자가 설정한 비밀번호는 `PBKDF2` 또는 단순 솔팅(Salting) 과정을 거쳐 암호화 키로 사용됩니다.
- 비밀번호 자체는 서버로 절대 전송되지 않으며, 세션 동안만 메모리(`useState`)에 보관되거나 보안을 위해 선택적으로 브라우저 세션 스토리지에 암호화하여 임시 보관합니다.

## 3. Data Model Changes
### Database (Supabase)
테이블 구조는 변경되지 않으나, `data` 컬럼의 내용이 JSON 객체에서 **암호화된 문자열 객체**로 변경됩니다.
```json
{
  "isEncrypted": true,
  "payload": "U2FsdGVkX1+vS5o...",
  "checksum": "sha256-hash"
}
```

## 4. Components & Services
### `EncryptionService` (New)
- `encrypt(data: any, key: string)`: 객체를 암호화된 문자열로 변환.
- `decrypt(ciphertext: string, key: string)`: 암호문을 다시 객체로 복구.
- `generateKey(password: string)`: 사용자 비밀번호로부터 안전한 키 생성.

### `SecurityKeyModal` (New UI)
- 로그인 후 혹은 동기화 필요 시 보안 비밀번호를 입력받는 팝업.
- 최초 사용 시 비밀번호 설정 및 확인 프로세스.

## 5. UI/UX Flow
1. **로그인**: 사용자가 구글 계정으로 로그인합니다.
2. **키 입력**: 클라우드 데이터를 감지하면 "보안 비밀번호를 입력하세요"라는 모달이 뜹니다.
3. **복호화**: 입력된 키로 클라우드 데이터를 풀어 로컬에 적용합니다.
4. **자동 저장**: 이후 데이터 변경 시, 메모리에 저장된 키를 사용하여 배경에서 즉시 암호화 후 업로드합니다.

## 6. Safety Measures
- **키 검증**: 잘못된 비밀번호 입력 시 복호화 실패 메시지를 출력하고 재입력을 유도합니다.
- **데이터 백업 권장**: 비밀번호 분실 시 복구가 불가능하므로, 주기적으로 "PC 로컬 백업(JSON)"을 권장하는 안내 문구를 추가합니다.
