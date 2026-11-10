// Seed script: puts starter data in the database.
// Run with: npm run db:seed
//
// It is idempotent: running it twice gives the same result, no duplicates.
// For now it creates the demo user with the default categories.
// Realistic demo transactions (12 months) are added in M17.
import { prisma } from '../src/lib/prisma.js';
import { DEFAULT_CATEGORIES } from '../src/constants/defaultCategories.js';

const DEMO_EMAIL = 'demo@financetracker.dev';

async function main() {
  // upsert = create if missing, otherwise leave as is.
  const demoUser = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {},
    create: {
      email: DEMO_EMAIL,
      name: 'Demo User',
      isDemo: true,
      // The demo account is entered through a "Try demo" button (M17), never a password,
      // so this placeholder can never match a real bcrypt hash.
      passwordHash: '!demo-account-no-password',
    },
  });

  // Build one row per default category for this user (plain loop for readability).
  const rows = [];
  for (const category of DEFAULT_CATEGORIES) {
    rows.push({
      userId: demoUser.id,
      name: category.name,
      type: category.type,
      color: category.color,
    });
  }

  // skipDuplicates relies on the unique (user_id, name, type) constraint,
  // so categories that already exist are left alone.
  const result = await prisma.category.createMany({ data: rows, skipDuplicates: true });

  console.log(`Seed done: demo user id=${demoUser.id}, ${result.count} new categories.`);
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
