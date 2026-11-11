// Builds and configures the Express app, but does NOT start listening.
// Keeping this separate from server.ts lets tests import the app directly.
import express from 'express';
import { healthRouter } from './routes/health.routes.js';
import { notFoundHandler } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  // Parse JSON request bodies (limit protects against huge payloads).
  app.use(express.json({ limit: '100kb' }));

  app.use('/health', healthRouter);

  // Order matters: these two must come after every route.
  // 1. No route matched -> 404.
  app.use(notFoundHandler);
  // 2. Anything that threw (including the 404 above) -> one consistent JSON error.
  app.use(errorHandler);

  return app;
}
