// Prisma 7 reads its settings from this file (not from schema.prisma).
import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    // Command run by `npx prisma db seed`
    seed: 'tsx prisma/seed.ts',
  },
  datasource: { url: env('DATABASE_URL') },
});
