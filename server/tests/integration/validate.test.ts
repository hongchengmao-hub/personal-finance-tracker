// API tests for the validate() middleware, using throwaway routes.
import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { z } from 'zod';
import { validate } from '../../src/middleware/validate.js';
import { buildTestApp } from '../helpers/testApp.js';

const bodySchema = z.object({
  name: z.string().trim().min(1),
  amountCents: z.number().int().positive(),
});

// URL params and query strings always arrive as strings, so numbers need z.coerce.
const paramsSchema = z.object({ id: z.coerce.number().int().positive() });
const querySchema = z.object({ page: z.coerce.number().int().min(1).default(1) });

// Each route echoes back what the controller would receive after validation.
const app = buildTestApp((app) => {
  app.post('/items', validate({ body: bodySchema }), (req, res) => {
    res.status(201).json(req.body);
  });
  app.get('/items/:id', validate({ params: paramsSchema, query: querySchema }), (req, res) => {
    res.json({ params: req.params, query: req.query });
  });
});

describe('validate()', () => {
  it('passes valid input through, cleaned up by Zod', async () => {
    const response = await request(app)
      .post('/items')
      .send({ name: '  Rent  ', amountCents: 1250 });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ name: 'Rent', amountCents: 1250 });
  });

  it('returns 400 listing every invalid field', async () => {
    const response = await request(app).post('/items').send({ name: '', amountCents: 12.5 });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');

    const paths = [];
    for (const issue of response.body.error.details) {
      expect(issue.location).toBe('body');
      paths.push(issue.path);
    }
    expect(paths).toEqual(['name', 'amountCents']);
  });

  it('returns 400 when the body is missing', async () => {
    const response = await request(app).post('/items');

    expect(response.status).toBe(400);
  });

  it('turns params and query strings into numbers and fills defaults', async () => {
    const response = await request(app).get('/items/7');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ params: { id: 7 }, query: { page: 1 } });
  });

  it('rejects a non-numeric id in the URL', async () => {
    const response = await request(app).get('/items/abc?page=0');

    expect(response.status).toBe(400);

    const locations = [];
    for (const issue of response.body.error.details) {
      locations.push(issue.location);
    }
    expect(locations).toEqual(['params', 'query']);
  });
});
