// GET /health - reports whether the API and its database are working.
// Load balancers and uptime monitors call this.
//   200 = API and database OK
//   503 = API is running but cannot reach the database (Service Unavailable)
import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

export const healthRouter = Router();

healthRouter.get('/', async (_req, res) => {
  let databaseOk = true;
  try {
    // The cheapest possible query: just proves the connection works.
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    databaseOk = false;
  }

  res.status(databaseOk ? 200 : 503).json({
    status: databaseOk ? 'ok' : 'degraded',
    database: databaseOk ? 'up' : 'down',
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});
