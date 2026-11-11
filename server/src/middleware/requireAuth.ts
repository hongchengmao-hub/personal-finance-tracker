// Protects a route: only logged-in users get through.
//
// Usage: router.get('/me', requireAuth, controller.me);
//
// It reads the token from the cookie, checks its signature and expiry, and stores the
// user id on req.userId. No database lookup is needed: the signature already proves
// the server issued this token. Missing or invalid token -> 401.
import type { Request, RequestHandler } from 'express';
import { AUTH_COOKIE_NAME } from '../utils/authCookie.js';
import { verifyToken } from '../utils/jwt.js';
import { unauthorized } from '../utils/AppError.js';

export const requireAuth: RequestHandler = (req, _res, next) => {
  const token: unknown = req.cookies[AUTH_COOKIE_NAME];
  const userId = typeof token === 'string' ? verifyToken(token) : null;

  if (userId === null) {
    next(unauthorized());
    return;
  }

  req.userId = userId;
  next();
};

// For controllers behind requireAuth: returns the logged-in user's id.
// Throwing here means a route forgot requireAuth, which is a bug (500), not a user error.
export function getUserId(req: Request): number {
  if (req.userId === undefined) {
    throw new Error('getUserId() was called on a route without requireAuth');
  }
  return req.userId;
}
