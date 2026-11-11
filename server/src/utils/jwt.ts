// Creates and checks the login token (a JWT).
//
// A JWT is three base64 parts: header.payload.signature. The payload is readable by
// anyone (it is NOT encrypted); the signature proves the server created it and that
// nobody changed it. We store only the user id in it, as the standard "sub" (subject) claim.
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

// One day. There are no refresh tokens, so the user logs in again after this.
export const TOKEN_LIFETIME_SECONDS = 24 * 60 * 60;

export function signToken(userId: number): string {
  return jwt.sign({}, env.JWT_SECRET, {
    subject: String(userId),
    expiresIn: TOKEN_LIFETIME_SECONDS,
    algorithm: 'HS256',
  });
}

// Returns the user id if the token is genuine and not expired, otherwise null.
export function verifyToken(token: string): number | null {
  try {
    // Pinning the algorithm stops a forged token from choosing a weaker one.
    const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
    if (typeof payload === 'string') {
      return null;
    }

    const userId = Number(payload.sub);
    if (!Number.isInteger(userId) || userId <= 0) {
      return null;
    }
    return userId;
  } catch {
    // Bad signature, expired, or malformed: all mean "not logged in".
    return null;
  }
}
