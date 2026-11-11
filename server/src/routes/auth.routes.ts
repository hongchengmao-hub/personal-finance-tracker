// Auth endpoints, mounted at /api/auth.
import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { loginSchema, registerSchema } from '../schemas/auth.schemas.js';

export const authRouter = Router();

authRouter.post('/register', validate({ body: registerSchema }), authController.register);
authRouter.post('/login', validate({ body: loginSchema }), authController.login);
// No requireAuth: logging out with an expired or missing cookie should still succeed.
authRouter.post('/logout', authController.logout);
authRouter.get('/me', requireAuth, authController.me);
