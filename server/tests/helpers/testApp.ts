// Test helper: a tiny Express app with the same middleware order as src/app.ts,
// plus whatever throwaway routes a test adds. Lets us test middleware
// (validation, error handling) before the real feature routes exist.
import express, { type Express } from 'express';
import { notFoundHandler } from '../../src/middleware/notFound.js';
import { errorHandler } from '../../src/middleware/errorHandler.js';

export function buildTestApp(addRoutes: (app: Express) => void) {
  const app = express();
  app.use(express.json({ limit: '100kb' }));
  addRoutes(app);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
