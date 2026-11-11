// API tests for the 404 handler and the central error handler.
import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { conflict } from '../../src/utils/AppError.js';
import { buildTestApp } from '../helpers/testApp.js';

describe('unknown routes', () => {
  it('returns 404 with the standard JSON error shape', async () => {
    const response = await request(createApp()).get('/api/does-not-exist');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: { code: 'NOT_FOUND', message: 'Route GET /api/does-not-exist not found' },
    });
  });
});

describe('request bodies', () => {
  it('returns 400 for malformed JSON', async () => {
    const response = await request(createApp())
      .post('/health')
      .set('Content-Type', 'application/json')
      .send('{"name": ');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_JSON');
  });

  it('returns 413 for a body over the 100kb limit', async () => {
    const response = await request(createApp())
      .post('/health')
      .send({ text: 'x'.repeat(200 * 1024) });

    expect(response.status).toBe(413);
    expect(response.body.error.code).toBe('PAYLOAD_TOO_LARGE');
  });
});

describe('errors thrown by routes', () => {
  const app = buildTestApp((app) => {
    app.get('/conflict', () => {
      throw conflict('Category is in use');
    });
    // Express 5 catches rejected promises from async handlers on its own.
    app.get('/async-conflict', async () => {
      await Promise.resolve();
      throw conflict('Category is in use');
    });
    app.get('/crash', () => {
      throw new Error('secret internal detail');
    });
  });

  it('sends an AppError with its own status and message', async () => {
    const response = await request(app).get('/conflict');

    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      error: { code: 'CONFLICT', message: 'Category is in use' },
    });
  });

  it('handles errors thrown inside async handlers', async () => {
    const response = await request(app).get('/async-conflict');

    expect(response.status).toBe(409);
  });

  it('hides the details of unexpected errors behind a generic 500', async () => {
    const response = await request(app).get('/crash');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
    });
  });
});
