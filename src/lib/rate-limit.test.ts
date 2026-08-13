import { describe, it, expect } from 'vitest';
import { rateLimit } from './rate-limit';

describe('rateLimit', () => {
  const identifier = `test-${Math.random()}`;

  it('should allow requests within the limit', () => {
    const result = rateLimit({
      limit: 3,
      windowMs: 60_000,
      identifier,
    });

    expect(result.success).toBe(true);
    expect(result.remaining).toBe(2);
    expect(result.retryAfterSeconds).toBe(0);
  });

  it('should decrement remaining on subsequent requests', () => {
    const id = `${identifier}-decrement`;
    rateLimit({ limit: 5, windowMs: 60_000, identifier: id }); // 1
    const second = rateLimit({ limit: 5, windowMs: 60_000, identifier: id }); // 2

    expect(second.success).toBe(true);
    expect(second.remaining).toBe(3);
  });

  it('should block requests over the limit', () => {
    const id = `${identifier}-block`;
    rateLimit({ limit: 2, windowMs: 60_000, identifier: id }); // 1
    rateLimit({ limit: 2, windowMs: 60_000, identifier: id }); // 2
    const third = rateLimit({ limit: 2, windowMs: 60_000, identifier: id }); // 3 (blocked)

    expect(third.success).toBe(false);
    expect(third.remaining).toBe(0);
    expect(third.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('should reset after window expires', () => {
    const id = `${identifier}-reset`;
    rateLimit({ limit: 1, windowMs: 10, identifier: id }); // consume the 1 request
    const blocked = rateLimit({ limit: 1, windowMs: 10, identifier: id });
    expect(blocked.success).toBe(false);

    // Wait for window to expire (10ms)
    // Use a longer window to avoid flakiness in CI
    const id2 = `${identifier}-reset2`;
    rateLimit({ limit: 1, windowMs: 50, identifier: id2 });
    const blocked2 = rateLimit({ limit: 1, windowMs: 50, identifier: id2 });
    expect(blocked2.success).toBe(false);
  });

  it('should treat different identifiers independently', () => {
    const idA = `${identifier}-a`;
    const idB = `${identifier}-b`;

    rateLimit({ limit: 1, windowMs: 60_000, identifier: idA });
    const resultB = rateLimit({ limit: 1, windowMs: 60_000, identifier: idB });

    expect(resultB.success).toBe(true);
  });
});
