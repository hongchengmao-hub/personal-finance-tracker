// One shared Prisma client for the whole app.
// Creating a new client per request would open too many database connections,
// so every module imports this single instance instead.
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';
import { env } from '../config/env.js';

// Prisma 7 talks to Postgres through a "driver adapter" (here: the node-postgres `pg` driver).
const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });

export const prisma = new PrismaClient({
  adapter,
  // Log slow or failed queries while developing; keep production logs quiet.
  log: env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});
