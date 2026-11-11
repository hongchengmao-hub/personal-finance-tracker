// Unit tests for creating and checking login tokens. No server or database needed.
import { describe, expect, it } from 'vitest';
import jwt from 'jsonwebtoken';
import { signToken, verifyToken } from '../../src/utils/jwt.js';

const secret = process.env.JWT_SECRET as string;

describe('signToken / verifyToken', () => {
  it('reads back the user id from a token it signed', () => {
    const token = signToken(42);

    expect(verifyToken(token)).toBe(42);
  });

  it('rejects a token whose signature was tampered with', () => {
    const token = signToken(42);
    // Change one character of the signature (the last part).
    const lastChar = token.slice(-1);
    const tampered = token.slice(0, -1) + (lastChar === 'A' ? 'B' : 'A');

    expect(verifyToken(tampered)).toBeNull();
  });

  it('rejects a token signed with a different secret', () => {
    const forged = jwt.sign({}, 'some-other-secret-that-is-at-least-32-chars', { subject: '42' });

    expect(verifyToken(forged)).toBeNull();
  });

  it('rejects an expired token', () => {
    const anHourAgo = Math.floor(Date.now() / 1000) - 60 * 60;
    const expired = jwt.sign({ sub: '42', exp: anHourAgo }, secret);

    expect(verifyToken(expired)).toBeNull();
  });

  it('rejects a token whose subject is not a user id', () => {
    const token = jwt.sign({}, secret, { subject: 'admin' });

    expect(verifyToken(token)).toBeNull();
  });

  it('rejects text that is not a JWT at all', () => {
    expect(verifyToken('not-a-token')).toBeNull();
  });
});
