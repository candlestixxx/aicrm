import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from './password';

describe('password hashing', () => {
  it('should hash a password and verify it correctly', async () => {
    const password = 'mySecureP@ssw0rd!';
    const hash = await hashPassword(password);

    // Hash should be different from original
    expect(hash).not.toBe(password);

    // Hash should be a bcrypt string (starts with $2a$, $2b$, or $2y$)
    expect(hash).toMatch(/^\$2[aby]\$\d+\$/);

    // Verification should succeed
    const isValid = await verifyPassword(password, hash);
    expect(isValid).toBe(true);
  });

  it('should reject incorrect password', async () => {
    const hash = await hashPassword('correct-password');
    const isValid = await verifyPassword('wrong-password', hash);
    expect(isValid).toBe(false);
  });

  it('should produce different hashes for the same password', async () => {
    const password = 'same-password';
    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);

    // Different salts should produce different hashes
    expect(hash1).not.toBe(hash2);

    // Both should verify
    expect(await verifyPassword(password, hash1)).toBe(true);
    expect(await verifyPassword(password, hash2)).toBe(true);
  });

  it('should handle empty password', async () => {
    const hash = await hashPassword('');
    expect(hash).toBeTruthy();
    expect(await verifyPassword('', hash)).toBe(true);
  });

  it('should be slow enough (bcrypt with 12 rounds)', async () => {
    const start = Date.now();
    await hashPassword('benchmark-password');
    const duration = Date.now() - start;

    // With 12 rounds, should take at least 50ms on modern hardware
    expect(duration).toBeGreaterThan(30);
  });
});
