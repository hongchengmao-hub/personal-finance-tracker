// API tests that break real database rules in the test database and check that
// the error handler turns each one into the right HTTP status.
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { prisma } from '../../src/lib/prisma.js';
import { buildTestApp } from '../helpers/testApp.js';
import { resetDatabase } from '../helpers/db.js';

// Throwaway routes that call Prisma directly. Real routes (M4+) go through services.
const app = buildTestApp((app) => {
  app.post('/users', async (req, res) => {
    const user = await prisma.user.create({
      data: { email: req.body.email, name: 'Test User', passwordHash: 'not-a-real-hash' },
    });
    res.status(201).json({ id: user.id });
  });
  app.delete('/categories/:id', async (req, res) => {
    await prisma.category.delete({ where: { id: Number(req.params.id) } });
    res.status(204).end();
  });
});

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('database errors', () => {
  it('returns 409 when a unique value is already taken', async () => {
    await request(app).post('/users').send({ email: 'sam@example.com' }).expect(201);

    const response = await request(app).post('/users').send({ email: 'sam@example.com' });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('CONFLICT');
  });

  it('returns 409 when deleting a category that still has transactions', async () => {
    const user = await prisma.user.create({
      data: { email: 'alex@example.com', name: 'Alex', passwordHash: 'not-a-real-hash' },
    });
    const category = await prisma.category.create({
      data: { userId: user.id, name: 'Groceries', type: 'EXPENSE', color: '#16A34A' },
    });
    await prisma.transaction.create({
      data: {
        userId: user.id,
        categoryId: category.id,
        type: 'EXPENSE',
        amountCents: 4599,
        date: new Date('2026-11-01'),
        description: 'Weekly shop',
      },
    });

    const response = await request(app).delete(`/categories/${category.id}`);

    expect(response.status).toBe(409);
    // The category must still be there: the database refused the delete.
    expect(await prisma.category.count()).toBe(1);
  });

  it('returns 404 when deleting a record that does not exist', async () => {
    const response = await request(app).delete('/categories/999');

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });
});
