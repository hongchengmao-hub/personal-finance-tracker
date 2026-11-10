// Builds and configures the Express app, but does NOT start listening.
// Keeping this separate from server.ts lets tests (M3) import the app directly.
import express from 'express';
import { healthRouter } from './routes/health.routes.js';

export function createApp() {
  const app = express();

  // Parse JSON request bodies (limit protects against huge payloads).
  app.use(express.json({ limit: '100kb' }));

  app.use('/health', healthRouter);

  return app;
}
