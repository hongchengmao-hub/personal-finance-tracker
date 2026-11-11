// API tests for /api/auth: register, login, logout, and /me.
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createApp } from '../../src/app.js';
import { prisma } from '../../src/lib/prisma.js';
import { resetDatabase } from '../helpers/db.js';

const app = createApp();

const validUser = {
  email: 'sam@example.com',
  password: 'correct-horse-42',
  name: 'Sam',
};

// Returns the raw Set-Cookie header for the login token, if the response set one.
function getTokenCookie(response: request.Response): string | undefined {
  const header = response.headers['set-cookie'] as unknown as string[] | undefined;
  if (!header) {
    return undefined;
  }
  for (const cookie of header) {
    if (cookie.startsWith('token=')) {
      return cookie;
    }
  }
  return undefined;
}

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('POST /api/auth/register', () => {
  it('creates the account, returns the user, and logs them in', async () => {
    const response = await request(app).post('/api/auth/register').send(validUser);

    expect(response.status).toBe(201);
    expect(response.body.user).toMatchObject({
      email: 'sam@example.com',
      name: 'Sam',
      isDemo: false,
    });
    expect(response.body.user.passwordHash).toBeUndefined();

    const cookie = getTokenCookie(response);
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Lax');
  });

  it('stores a bcrypt hash, never the plain password', async () => {
    await request(app).post('/api/auth/register').send(validUser).expect(201);

    const user = await prisma.user.findUniqueOrThrow({ where: { email: validUser.email } });
    expect(user.passwordHash).not.toBe(validUser.password);
    expect(await bcrypt.compare(validUser.password, user.passwordHash)).toBe(true);
  });

  it('trims and lowercases the email', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ ...validUser, email: '  Sam@Example.COM ' });

    expect(response.status).toBe(201);
    expect(response.body.user.email).toBe('sam@example.com');
  });

  it('returns 409 when the email is already registered, in any letter case', async () => {
    await request(app).post('/api/auth/register').send(validUser).expect(201);

    const response = await request(app)
      .post('/api/auth/register')
      .send({ ...validUser, email: 'SAM@example.com' });

    expect(response.status).toBe(409);
    expect(response.body.error.message).toBe('An account with this email already exists');
  });

  it('returns 400 listing each invalid field', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ email: 'not-an-email', password: 'short' });

    expect(response.status).toBe(400);
    const paths = [];
    for (const issue of response.body.error.details) {
      paths.push(issue.path);
    }
    expect(paths).toEqual(['email', 'password', 'name']);
  });

  it('returns 400 for a password over bcrypt’s 72-byte limit', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ ...validUser, password: 'a'.repeat(73) });

    expect(response.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/api/auth/register').send(validUser).expect(201);
  });

  it('logs in with the right password and sets the cookie', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'SAM@example.com', password: validUser.password });

    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe('sam@example.com');
    expect(getTokenCookie(response)).toBeDefined();
  });

  it('returns 401 for a wrong password, without setting a cookie', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: validUser.email, password: 'wrong-password' });

    expect(response.status).toBe(401);
    expect(getTokenCookie(response)).toBeUndefined();
  });

  it('gives the same answer for an unknown email as for a wrong password', async () => {
    const wrongPassword = await request(app)
      .post('/api/auth/login')
      .send({ email: validUser.email, password: 'wrong-password' });
    const unknownEmail = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'wrong-password' });

    expect(unknownEmail.status).toBe(401);
    expect(unknownEmail.body).toEqual(wrongPassword.body);
  });

  it('refuses password login for the demo account', async () => {
    await prisma.user.create({
      data: {
        email: 'demo@example.com',
        name: 'Demo',
        isDemo: true,
        passwordHash: await bcrypt.hash('demo-password', 4),
      },
    });

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'demo@example.com', password: 'demo-password' });

    expect(response.status).toBe(401);
  });

  it('returns 400 when the password is missing', async () => {
    const response = await request(app).post('/api/auth/login').send({ email: validUser.email });

    expect(response.status).toBe(400);
  });
});

describe('GET /api/auth/me', () => {
  it('returns the logged-in user', async () => {
    // An agent keeps cookies between requests, like a browser.
    const agent = request.agent(app);
    await agent.post('/api/auth/register').send(validUser).expect(201);

    const response = await agent.get('/api/auth/me');

    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe('sam@example.com');
    expect(response.body.user.passwordHash).toBeUndefined();
  });

  it('returns 401 without a cookie', async () => {
    const response = await request(app).get('/api/auth/me');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 401 for a forged token', async () => {
    const forged = jwt.sign({}, 'attacker-secret-that-is-at-least-32-chars', { subject: '1' });

    const response = await request(app).get('/api/auth/me').set('Cookie', `token=${forged}`);

    expect(response.status).toBe(401);
  });

  it('returns 401 when the account no longer exists', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/register').send(validUser).expect(201);
    await prisma.user.deleteMany();

    const response = await agent.get('/api/auth/me');

    expect(response.status).toBe(401);
  });
});

describe('POST /api/auth/logout', () => {
  it('clears the cookie so later requests are logged out', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/register').send(validUser).expect(201);

    const response = await agent.post('/api/auth/logout');

    expect(response.status).toBe(204);
    // Clearing a cookie = setting it again with an expiry date in the past.
    expect(getTokenCookie(response)).toContain('Expires=Thu, 01 Jan 1970');
    await agent.get('/api/auth/me').expect(401);
  });

  it('succeeds even when not logged in', async () => {
    await request(app).post('/api/auth/logout').expect(204);
  });
});
