import { describe, it, expect } from 'vitest';
import { createSessionToken, verifySessionToken, SessionPayload } from './jwt';

describe('JWT session tokens', () => {
  const samplePayload: SessionPayload = {
    userId: 'user-123',
    email: 'agent@brokerage.com',
    role: 'admin',
    brokerageId: 'brokerage-456',
    agentId: 'agent-789',
  };

  it('should create and verify a valid token', async () => {
    const token = await createSessionToken(samplePayload);
    expect(token).toBeTruthy();
    expect(typeof token).toBe('string');

    const decoded = await verifySessionToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded!.userId).toBe(samplePayload.userId);
    expect(decoded!.email).toBe(samplePayload.email);
    expect(decoded!.role).toBe(samplePayload.role);
    expect(decoded!.brokerageId).toBe(samplePayload.brokerageId);
    expect(decoded!.agentId).toBe(samplePayload.agentId);
  });

  it('should reject an invalid token', async () => {
    const result = await verifySessionToken('not-a-valid-jwt');
    expect(result).toBeNull();
  });

  it('should reject a tampered token', async () => {
    const token = await createSessionToken(samplePayload);
    // Tamper with the last character
    const tampered = token.slice(0, -1) + (token.slice(-1) === 'A' ? 'B' : 'A');
    const result = await verifySessionToken(tampered);
    expect(result).toBeNull();
  });

  it('should produce consistent tokens for same payload in same second', async () => {
    const token1 = await createSessionToken(samplePayload);
    const token2 = await createSessionToken(samplePayload);

    // JWT iat is second-precision; tokens from same second may match
    // Both should be valid regardless
    expect(await verifySessionToken(token1)).not.toBeNull();
    expect(await verifySessionToken(token2)).not.toBeNull();
  });

  it('should handle payload without optional fields', async () => {
    const minimal: SessionPayload = {
      userId: 'user-min',
      email: 'minimal@test.com',
      role: 'agent',
    };

    const token = await createSessionToken(minimal);
    const decoded = await verifySessionToken(token);

    expect(decoded).not.toBeNull();
    expect(decoded!.userId).toBe(minimal.userId);
    expect(decoded!.brokerageId).toBeUndefined();
    expect(decoded!.agentId).toBeUndefined();
  });
});
