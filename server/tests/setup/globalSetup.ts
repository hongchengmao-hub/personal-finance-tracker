// Runs once before the whole test run (see vitest.config.ts).
// Applies the committed migrations to the test database, so its tables always
// match schema.prisma. `migrate deploy` only applies existing migrations;
// it never creates new ones or asks questions, which makes it safe for tests and CI.
import { execSync } from 'node:child_process';

export default function setup() {
  try {
    execSync('npx prisma migrate deploy', {
      // Point Prisma at the test database instead of the dev one from .env.
      env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL_TEST },
      // Capture Prisma's output instead of printing it on every test run.
      stdio: 'pipe',
    });
  } catch (error) {
    // Only show Prisma's output when something went wrong (e.g. Docker is not running).
    const { stdout, stderr } = error as { stdout?: Buffer; stderr?: Buffer };
    console.error(String(stdout ?? ''), String(stderr ?? ''));
    throw new Error('Could not migrate the test database. Is Docker running?', { cause: error });
  }
}
