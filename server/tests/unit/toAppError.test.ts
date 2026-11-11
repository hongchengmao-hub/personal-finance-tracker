// Unit tests: toAppError is a plain function, so no server or database is needed.
import { describe, expect, it } from 'vitest';
import { Prisma } from '../../src/generated/prisma/client.js';
import { toAppError } from '../../src/middleware/errorHandler.js';
import { AppError, notFound } from '../../src/utils/AppError.js';

function prismaError(code: string) {
  return new Prisma.PrismaClientKnownRequestError('database error', {
    code,
    clientVersion: 'test',
  });
}

describe('toAppError', () => {
  it('passes an AppError through unchanged', () => {
    const error = notFound('Category not found');

    expect(toAppError(error)).toBe(error);
  });

  it('maps a unique constraint violation (P2002) to 409', () => {
    const result = toAppError(prismaError('P2002'));

    expect(result.statusCode).toBe(409);
    expect(result.code).toBe('CONFLICT');
  });

  it('maps a foreign key violation (P2003) to 409', () => {
    expect(toAppError(prismaError('P2003')).statusCode).toBe(409);
  });

  it('maps a missing record (P2025) to 404', () => {
    expect(toAppError(prismaError('P2025')).statusCode).toBe(404);
  });

  it('turns an unknown error into a generic 500 without leaking its message', () => {
    const result = toAppError(new Error('connection string with password'));

    expect(result).toBeInstanceOf(AppError);
    expect(result.statusCode).toBe(500);
    expect(result.message).toBe('Something went wrong');
  });

  it('treats an unknown Prisma error code as a 500', () => {
    expect(toAppError(prismaError('P9999')).statusCode).toBe(500);
  });
});
