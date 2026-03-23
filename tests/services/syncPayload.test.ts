import { describe, expect, it } from 'vitest';
import { createEncryptedCloudPayload, decryptCloudPayload } from '../../src/services/syncPayload';

describe('sync payload encryption', () => {
  it('round-trips encrypted payloads and includes checksum metadata', () => {
    const data = {
      classes: [{ id: 'default', name: '기본 학급', order: 0 }],
      activeClassId: 'default',
      classData: {},
    };

    const payload = createEncryptedCloudPayload(data, 'secret-key');

    expect(payload.isEncrypted).toBe(true);
    expect(typeof payload.payload).toBe('string');
    expect(payload.payload).not.toBe(JSON.stringify(data));
    expect(payload.checksum).toMatch(/^[a-f0-9]{64}$/);
    expect(new Date(payload.updatedAt).toISOString()).toBe(payload.updatedAt);
    expect(decryptCloudPayload(payload, 'secret-key')).toEqual(data);
  });

  it('rejects the wrong decryption key', () => {
    const payload = createEncryptedCloudPayload({ hello: 'world' }, 'secret-key');

    expect(() => decryptCloudPayload(payload, 'wrong-key')).toThrow();
  });
});
