// Validates the request against Zod schemas before the controller runs.
//
// Usage in a route file:
//   router.post('/', validate({ body: createCategorySchema }), controller.create);
//
// If the input is invalid, it responds 400 with every problem listed. If it is valid,
// it replaces req.body / req.params / req.query with Zod's parsed output, so controllers
// get cleaned values (trimmed strings, numbers coerced from "42", defaults filled in).
import type { RequestHandler } from 'express';
import type { z } from 'zod';
import { badRequest } from '../utils/AppError.js';

type RequestSchemas = {
  body?: z.ZodType;
  params?: z.ZodType;
  query?: z.ZodType;
};

// One entry per invalid field, e.g. { location: 'body', path: 'amountCents', message: '...' }
export type ValidationIssue = {
  location: 'body' | 'params' | 'query';
  path: string;
  message: string;
};

export function validate(schemas: RequestSchemas): RequestHandler {
  return (req, _res, next) => {
    const issues: ValidationIssue[] = [];

    if (schemas.body) {
      const result = schemas.body.safeParse(req.body);
      if (result.success) {
        req.body = result.data;
      } else {
        addIssues(issues, 'body', result.error);
      }
    }

    if (schemas.params) {
      const result = schemas.params.safeParse(req.params);
      if (result.success) {
        req.params = result.data as typeof req.params;
      } else {
        addIssues(issues, 'params', result.error);
      }
    }

    if (schemas.query) {
      const result = schemas.query.safeParse(req.query);
      if (result.success) {
        // In Express 5, req.query is a read-only getter, so plain assignment throws.
        // defineProperty puts the parsed value on this one request object instead.
        Object.defineProperty(req, 'query', {
          value: result.data,
          writable: true,
          enumerable: true,
          configurable: true,
        });
      } else {
        addIssues(issues, 'query', result.error);
      }
    }

    // Report all problems at once, so a form can highlight every bad field together.
    if (issues.length > 0) {
      next(badRequest('Invalid request', issues));
      return;
    }

    next();
  };
}

function addIssues(
  issues: ValidationIssue[],
  location: ValidationIssue['location'],
  error: z.ZodError,
) {
  for (const issue of error.issues) {
    issues.push({
      location,
      path: issue.path.map(String).join('.'),
      message: issue.message,
    });
  }
}
