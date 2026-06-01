import { generateKey, generateHash, verifyPassword } from '../../src/shared/crypto';

describe('crypto utilities', () => {
  describe('generateKey', () => {
    it('should generate a 28 character base64 string (from 21 bytes)', () => {
      const key = generateKey();
      expect(typeof key).toBe('string');
      // 21 bytes in base64 is 28 characters
      expect(key.length).toBe(28);
    });

    it('should generate unique keys', () => {
      const key1 = generateKey();
      const key2 = generateKey();
      expect(key1).not.toBe(key2);
    });
  });

  describe('generateHash and verifyPassword', () => {
    it('should hash a password and verify it successfully', async () => {
      const password = 'my-super-secret-password';
      const hash = await generateHash(password);
      
      expect(typeof hash).toBe('string');
      expect(hash).not.toBe(password);

      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const password = 'my-super-secret-password';
      const wrongPassword = 'wrong-password';
      const hash = await generateHash(password);
      
      const isValid = await verifyPassword(wrongPassword, hash);
      expect(isValid).toBe(false);
    });
  });
});
