// API test for GET /health against the real app and the test database.
import { afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { prisma } from '../../src/lib/prisma.js';

const app = createApp();

afterAll(async () => {
  await prisma.$disconnect();
});

describe('GET /health', () => {
  it('returns 200 when the API and database are up', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.database).toBe('up');
  });
});
