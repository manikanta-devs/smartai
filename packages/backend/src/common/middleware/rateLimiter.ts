/**
 * Rate Limiting Middleware - UPGRADED Build
 * Prevents brute force attacks and API abuse
 * Zero external dependencies (uses Map instead of Redis for MVP)
 */

interface RateLimitStore {
  [key: string]: { count: number; resetTime: number };
}

const store: RateLimitStore = {};

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach((key) => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, 5 * 60 * 1000);

/**
 * Create a rate limiter
 * @param maxRequests Maximum requests allowed
 * @param windowMs Time window in milliseconds
 */
export function createRateLimiter(maxRequests: number, windowMs: number) {
  return (req: any, res: any, next: any) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();

    if (!store[ip]) {
      store[ip] = { count: 1, resetTime: now + windowMs };
      return next();
    }

    if (store[ip].resetTime < now) {
      // Reset window
      store[ip] = { count: 1, resetTime: now + windowMs };
      return next();
    }

    store[ip].count++;

    if (store[ip].count > maxRequests) {
      const retryAfter = Math.ceil((store[ip].resetTime - now) / 1000);
      return res.status(429).json({
        success: false,
        error: 'Too many requests, please try again later',
        retryAfter,
      });
    }

    next();
  };
}

// Pre-built limiters for common scenarios
export const loginLimiter = createRateLimiter(5, 15 * 60 * 1000); // 5 attempts per 15 min
export const apiLimiter = createRateLimiter(100, 60 * 1000); // 100 requests per minute
export const uploadLimiter = createRateLimiter(10, 60 * 60 * 1000); // 10 uploads per hour
