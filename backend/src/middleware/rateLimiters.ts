import rateLimit from 'express-rate-limit';

// Auth endpoints had no rate limiting at all, making /login a plain
// credential-stuffing/brute-force target and /register and
// /resend-verification open to spam. Limits are per-IP (see app.ts's
// `trust proxy` setting, required for this to key on the real client IP
// rather than nginx's internal address).

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again later.' },
});

export const registerRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many registration attempts. Please try again later.' },
});

export const resendVerificationRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
});
