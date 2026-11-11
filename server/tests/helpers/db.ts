// Test helper: empties every table so each test starts from a known, clean state.
// Call it in beforeEach() in any test file that reads or writes the database.
import { prisma } from '../../src/lib/prisma.js';

// Every app table. The _prisma_migrations table is left alone on purpose.
const TABLES = ['chat_usage', 'transactions', 'budgets', 'recurring_rules', 'categories', 'users'];

export async function resetDatabase() {
  // Safety net: refuse to wipe anything that is not a test database,
  // in case the tests are ever started with the wrong DATABASE_URL.
  const databaseName = new URL(process.env.DATABASE_URL ?? '').pathname;
  if (!databaseName.endsWith('_test')) {
    throw new Error(`Refusing to reset "${databaseName}": not a test database`);
  }

  // TRUNCATE is much faster than DELETE for clearing whole tables.
  // RESTART IDENTITY resets auto-increment ids back to 1; CASCADE handles foreign keys.
  // Table names can't be query parameters, so this uses a fixed string (no user input).
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${TABLES.join(', ')} RESTART IDENTITY CASCADE`);
}
