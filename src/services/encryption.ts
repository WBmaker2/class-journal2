import CryptoJS from 'crypto-js';

export const encryptionService = {
  /**
   * Encrypts a JSON object into an AES-256 encrypted string
   */
  encrypt: (data: any, key: string): string => {
    try {
      const jsonStr = JSON.stringify(data);
      return CryptoJS.AES.encrypt(jsonStr, key).toString();
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('데이터 암호화 중 오류가 발생했습니다.');
    }
  },

  /**
   * Decrypts an AES-256 encrypted string back into a JSON object
   */
  decrypt: (ciphertext: string, key: string): any => {
    try {
      const bytes = CryptoJS.AES.decrypt(ciphertext, key);
      const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
      
      if (!decryptedData) {
        throw new Error('비밀번호가 틀렸거나 데이터가 손상되었습니다.');
      }
      
      return JSON.parse(decryptedData);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('데이터 복호화 중 오류가 발생했습니다. 보안 비밀번호를 확인해 주세요.');
    }
  },

  /**
   * Simple hash to verify if the key is correct without storing the key itself
   */
  hashKey: (key: string): string => {
    return CryptoJS.SHA256(key).toString();
  }
};
