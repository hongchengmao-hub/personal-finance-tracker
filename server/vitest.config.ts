// Vitest settings. Tests run against a separate database (finance_tracker_test),
// so they can wipe tables freely without touching development data.
import 'dotenv/config';
import { defineConfig } from 'vitest/config';

const testDatabaseUrl = process.env.DATABASE_URL_TEST;
if (!testDatabaseUrl) {
  throw new Error('DATABASE_URL_TEST is not set. Add it to server/.env (see .env.example).');
}

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    // Applied before any test file loads, so src/config/env.ts and the Prisma client
    // see the test database instead of the dev one.
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: testDatabaseUrl,
    },
    // Runs once before all tests: brings the test database schema up to date.
    globalSetup: ['tests/setup/globalSetup.ts'],
    // All test files share one database, so run files one at a time
    // to stop one file's cleanup from deleting another file's data mid-test.
    fileParallelism: false,
  },
});
