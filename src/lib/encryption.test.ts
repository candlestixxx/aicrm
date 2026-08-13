import { describe, it, expect } from 'vitest';
import { encrypt, decrypt } from './encryption';

describe('encryption', () => {
  it('should encrypt and decrypt a string correctly', () => {
    const original = 'sk-test-api-key-1234567890';
    const encrypted = encrypt(original);

    // Encrypted value should be different from original
    expect(encrypted).not.toBe(original);

    // Should be a base64 string
    expect(() => Buffer.from(encrypted, 'base64')).not.toThrow();

    // Decrypt should return original
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(original);
  });

  it('should produce different ciphertexts for the same plaintext', () => {
    const plaintext = 'my-secret-key';
    const encrypted1 = encrypt(plaintext);
    const encrypted2 = encrypt(plaintext);

    // Each encryption should produce different output (different salt/IV)
    expect(encrypted1).not.toBe(encrypted2);

    // Both should decrypt to the same value
    expect(decrypt(encrypted1)).toBe(plaintext);
    expect(decrypt(encrypted2)).toBe(plaintext);
  });

  it('should handle empty string', () => {
    const encrypted = encrypt('');
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe('');
  });

  it('should handle special characters', () => {
    const special = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`\n\t"\'';
    const encrypted = encrypt(special);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(special);
  });

  it('should handle long strings', () => {
    const long = 'a'.repeat(10000);
    const encrypted = encrypt(long);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(long);
  });

  it('should handle unicode characters', () => {
    const unicode = 'こんにちは世界 🌍 — API key: sk-αβγδε';
    const encrypted = encrypt(unicode);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(unicode);
  });

  it('should throw on corrupted ciphertext', () => {
    expect(() => decrypt('not-valid-base64!!!')).toThrow('Decryption failed');
  });

  it('should throw on tampered ciphertext', () => {
    const encrypted = encrypt('secret');
    // Tamper with the middle of the ciphertext
    const buffer = Buffer.from(encrypted, 'base64');
    buffer[50] = buffer[50] ^ 0xff; // flip some bits
    const tampered = buffer.toString('base64');

    expect(() => decrypt(tampered)).toThrow('Decryption failed');
  });
});
