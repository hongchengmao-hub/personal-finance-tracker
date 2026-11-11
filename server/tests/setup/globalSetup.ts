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
    // Show Prisma's own explanation (e.g. "Can't reach database server") as plain text.
    // Attaching the raw error as `cause` would make Vitest print its output as byte arrays.
    const { stderr } = error as { stderr?: Buffer };
    // eslint-disable-next-line preserve-caught-error -- Prisma's message is copied into ours
    throw new Error(
      `Could not migrate the test database. Is Docker running?\n\n${String(stderr ?? '')}`,
    );
  }
}
