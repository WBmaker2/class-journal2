import { encryptionService } from './encryption';

export interface EncryptedCloudPayload {
  isEncrypted: true;
  payload: string;
  checksum: string;
  updatedAt: string;
}

export const isEncryptedCloudPayload = (value: unknown): value is EncryptedCloudPayload => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<EncryptedCloudPayload>;
  return candidate.isEncrypted === true && typeof candidate.payload === 'string';
};

export const createEncryptedCloudPayload = <T>(data: T, key: string): EncryptedCloudPayload => {
  return {
    isEncrypted: true,
    payload: encryptionService.encrypt(data, key),
    checksum: encryptionService.generateChecksum(data),
    updatedAt: new Date().toISOString(),
  };
};

export const decryptCloudPayload = <T>(payload: EncryptedCloudPayload, key: string): T => {
  const decrypted = encryptionService.decrypt(payload.payload, key) as T;
  const checksum = encryptionService.generateChecksum(decrypted);

  if (payload.checksum && checksum !== payload.checksum) {
    throw new Error('데이터 무결성 검증에 실패했습니다. 데이터가 손상되었을 수 있습니다.');
  }

  return decrypted;
};
