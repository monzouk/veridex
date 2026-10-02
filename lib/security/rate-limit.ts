/**
 * In-Memory Sliding Window Rate Limiter
 *
 * Protects authentication endpoints against brute force attempts.
 */
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

export function checkRateLimit(
  key: string,
  maxAttempts: number = 5,
  windowMs: number = 60 * 1000
): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  // Clean up expired entries periodically
  if (entry && now > entry.resetAt) {
    rateLimitMap.delete(key);
  }

  const current = rateLimitMap.get(key);

  if (!current) {
    rateLimitMap.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (current.count >= maxAttempts) {
    const retryAfterSeconds = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
    return { allowed: false, retryAfterSeconds };
  }

  current.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}
