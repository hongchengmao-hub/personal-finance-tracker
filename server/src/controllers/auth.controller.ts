// HTTP layer for auth: reads the request, calls the service, sends the response.
// The cookie is an HTTP detail, so it is set here and not in the service.
import type { Request, Response } from 'express';
import * as authService from '../services/auth.service.js';
import type { LoginInput, RegisterInput } from '../schemas/auth.schemas.js';
import { getUserId } from '../middleware/requireAuth.js';
import { clearAuthCookie, setAuthCookie } from '../utils/authCookie.js';
import { signToken } from '../utils/jwt.js';

// POST /api/auth/register -> 201 and logged in right away.
export async function register(req: Request, res: Response) {
  // validate() already checked req.body against registerSchema.
  const user = await authService.register(req.body as RegisterInput);
  setAuthCookie(res, signToken(user.id));
  res.status(201).json({ user });
}

// POST /api/auth/login
export async function login(req: Request, res: Response) {
  const user = await authService.login(req.body as LoginInput);
  setAuthCookie(res, signToken(user.id));
  res.json({ user });
}

// POST /api/auth/logout -> 204 No Content.
// The token itself stays valid until it expires (JWTs are stateless); deleting the
// cookie just means the browser stops sending it.
export function logout(_req: Request, res: Response) {
  clearAuthCookie(res);
  res.status(204).end();
}

// GET /api/auth/me -> who is logged in. The frontend calls this on page load.
export async function me(req: Request, res: Response) {
  const user = await authService.getCurrentUser(getUserId(req));
  res.json({ user });
}
