// Puts the login token in a cookie, and removes it on logout.
//
// Why a cookie and not localStorage: an httpOnly cookie can't be read by JavaScript,
// so if an attacker ever manages to run a script on our page (XSS), it can't steal the token.
// The browser sends the cookie automatically with every request to our API.
import type { CookieOptions, Response } from 'express';
import { env } from '../config/env.js';
import { TOKEN_LIFETIME_SECONDS } from './jwt.js';

export const AUTH_COOKIE_NAME = 'token';

const cookieOptions: CookieOptions = {
  // JavaScript in the browser can't read it.
  httpOnly: true,
  // Only sent over HTTPS in production (local dev runs on plain http).
  secure: env.NODE_ENV === 'production',
  // Not sent on requests started by other sites (e.g. a hidden form posting to our API),
  // which blocks most CSRF attacks.
  sameSite: 'lax',
  path: '/',
};

export function setAuthCookie(res: Response, token: string) {
  res.cookie(AUTH_COOKIE_NAME, token, {
    ...cookieOptions,
    // Expire the cookie together with the token inside it (maxAge is in milliseconds).
    maxAge: TOKEN_LIFETIME_SECONDS * 1000,
  });
}

// The browser only deletes a cookie if the options match the ones it was set with.
export function clearAuthCookie(res: Response) {
  res.clearCookie(AUTH_COOKIE_NAME, cookieOptions);
}
