// Runs only when no route matched the request, so the client gets our usual
// JSON error shape instead of Express's default HTML "Cannot GET /x" page.
import type { RequestHandler } from 'express';
import { notFound } from '../utils/AppError.js';

export const notFoundHandler: RequestHandler = (req) => {
  throw notFound(`Route ${req.method} ${req.path} not found`);
};
