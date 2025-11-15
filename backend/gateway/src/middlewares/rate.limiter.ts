import { Request, Response, NextFunction } from "express";

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  max: number; // Maximum number of requests per window
  message?: string; // Custom error message
  keyGenerator?: (req: Request) => string; // Custom key generator
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store (for production, use Redis or similar)
const store = new Map<string, RateLimitEntry>();

export const rateLimiter = (config: RateLimitConfig) => {
  const {
    windowMs,
    max,
    message = "Too many requests, please try again later.",
    keyGenerator = (req: Request) => {
      // Use user ID if available, otherwise fall back to IP
      const authenticatedReq = req as any;
      return authenticatedReq.user?.id || req.ip || "anonymous";
    },
  } = config;

  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator(req);
    const now = Date.now();

    // Clean up expired entries periodically
    if (Math.random() < 0.01) {
      // 1% chance to clean up
      cleanupExpiredEntries();
    }

    const entry = store.get(key);

    if (!entry) {
      // First request for this key
      store.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });

      setRateLimitHeaders(res, 1, max, windowMs);
      return next();
    }

    if (now > entry.resetTime) {
      // Window has expired, reset
      store.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });

      setRateLimitHeaders(res, 1, max, windowMs);
      return next();
    }

    if (entry.count >= max) {
      // Rate limit exceeded
      setRateLimitHeaders(res, entry.count, max, entry.resetTime - now);

      return res.status(429).json({
        success: false,
        message,
        retryAfter: Math.ceil((entry.resetTime - now) / 1000),
      });
    }

    // Increment count
    entry.count++;
    store.set(key, entry);

    setRateLimitHeaders(res, entry.count, max, entry.resetTime - now);
    next();
  };
};

function setRateLimitHeaders(
  res: Response,
  current: number,
  max: number,
  resetTimeMs: number
) {
  res.set({
    "X-RateLimit-Limit": max.toString(),
    "X-RateLimit-Remaining": Math.max(0, max - current).toString(),
    "X-RateLimit-Reset": Math.ceil(resetTimeMs / 1000).toString(),
  });
}

function cleanupExpiredEntries() {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetTime) {
      store.delete(key);
    }
  }
}

// Preset rate limiters for different use cases
export const rateLimiters = {
  // Very restrictive for sensitive operations
  strict: rateLimiter({
    windowMs: 60 * 1000, // 1 minute for test
    max: 100,
    message: "Too many attempts, please try again in 1 minutes.",
  }),

  // Moderate for general API usage
  moderate: rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: "Rate limit exceeded. Please try again in a few minutes.",
  }),

  // Lenient for read operations
  lenient: rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000,
    message: "Too many requests. Please slow down.",
  }),

  // For message sending
  messaging: rateLimiter({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30, // 30 messages per minute
    message: "Too many messages sent. Please slow down.",
  }),

  // For file uploads
  upload: rateLimiter({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 20, // 20 uploads per 10 minutes
    message: "Upload limit exceeded. Please try again later.",
  }),
};

// Advanced rate limiter with different limits for different user types
export const tieredRateLimiter = (config: {
  free: RateLimitConfig;
  premium: RateLimitConfig;
  admin: RateLimitConfig;
}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const authenticatedReq = req as any;
    const userType = authenticatedReq.user?.type || "free";

    let selectedConfig: RateLimitConfig;

    switch (userType) {
      case "admin":
        selectedConfig = config.admin;
        break;
      case "premium":
        selectedConfig = config.premium;
        break;
      default:
        selectedConfig = config.free;
        break;
    }

    return rateLimiter(selectedConfig)(req, res, next);
  };
};
