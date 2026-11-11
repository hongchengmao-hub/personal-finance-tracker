// Central error handler: the one place that turns any error into a JSON response.
// Express 5 forwards errors here automatically, including rejected promises from
// async route handlers, so routes can simply `throw`.
//
// Every error response has the same shape:
//   { "error": { "code": "NOT_FOUND", "message": "Category not found", "details"?: ... } }
import type { ErrorRequestHandler } from 'express';
import { Prisma } from '../generated/prisma/client.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

type ErrorResponseBody = {
  error: { code: string; message: string; details?: unknown };
};

// Express recognizes an error handler by its 4 parameters (err, req, res, next).
export const errorHandler: ErrorRequestHandler = (err, _req, res, next) => {
  // If the response already started streaming, Express must close the connection itself.
  if (res.headersSent) {
    next(err);
    return;
  }

  const appError = toAppError(err);

  // 500s are bugs or outages: log the real error for us, but never send its details
  // (stack traces, SQL) to the client. Tests trigger 500s on purpose, so stay quiet there.
  if (appError.statusCode >= 500 && env.NODE_ENV !== 'test') {
    console.error(err);
  }

  const body: ErrorResponseBody = {
    error: { code: appError.code, message: appError.message },
  };
  if (appError.details !== undefined) {
    body.error.details = appError.details;
  }

  res.status(appError.statusCode).json(body);
};

// Converts known kinds of errors into an AppError; anything unexpected becomes a 500.
export function toAppError(err: unknown): AppError {
  if (err instanceof AppError) {
    return err;
  }

  // Errors from express.json(): the client sent broken JSON or a body that is too big.
  if (isBodyParserError(err)) {
    if (err.type === 'entity.parse.failed') {
      return new AppError(400, 'INVALID_JSON', 'Request body is not valid JSON');
    }
    if (err.type === 'entity.too.large') {
      return new AppError(413, 'PAYLOAD_TOO_LARGE', 'Request body is too large');
    }
  }

  // Database rule violations reported by Prisma (codes: https://pris.ly/d/error-reference).
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Unique constraint, e.g. registering an email that is already taken.
    if (err.code === 'P2002') {
      return new AppError(409, 'CONFLICT', 'A record with these values already exists');
    }
    // Foreign key constraint, e.g. deleting a category that still has transactions (Restrict).
    if (err.code === 'P2003') {
      return new AppError(409, 'CONFLICT', 'This record is still in use by other records');
    }
    // update/delete on a row that does not exist.
    if (err.code === 'P2025') {
      return new AppError(404, 'NOT_FOUND', 'Record not found');
    }
  }

  return new AppError(500, 'INTERNAL_ERROR', 'Something went wrong');
}

function isBodyParserError(err: unknown): err is { type: string } {
  return typeof err === 'object' && err !== null && 'type' in err && typeof err.type === 'string';
}
