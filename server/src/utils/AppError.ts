// An error we throw on purpose, carrying the HTTP status to send back.
// Services throw these (e.g. `throw notFound('Category not found')`), and the central
// error handler turns them into a JSON response. Any other error becomes a 500.

export class AppError extends Error {
  readonly statusCode: number;
  // Short machine-readable label the frontend can switch on, e.g. 'NOT_FOUND'.
  readonly code: string;
  // Optional extra info, e.g. the list of invalid fields from validation.
  readonly details?: unknown;

  constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

// Small helpers so call sites read like sentences.

export function badRequest(message: string, details?: unknown) {
  return new AppError(400, 'VALIDATION_ERROR', message, details);
}

export function unauthorized(message = 'You need to log in') {
  return new AppError(401, 'UNAUTHORIZED', message);
}

// Also used for records owned by another user: we never reveal that they exist.
export function notFound(message = 'Not found') {
  return new AppError(404, 'NOT_FOUND', message);
}

export function conflict(message: string) {
  return new AppError(409, 'CONFLICT', message);
}
