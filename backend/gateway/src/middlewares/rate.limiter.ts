import rateLimiter from "express-rate-limit";

export const ratelimiter = rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});
