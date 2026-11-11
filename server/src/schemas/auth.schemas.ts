// Zod schemas for the auth request bodies. validate() runs these before the controller.
import { z } from 'zod';

// Trim and lowercase before checking, so " Sam@Example.com " and "sam@example.com"
// are the same account.
const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email('Enter a valid email address').max(255));

export const registerSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    // bcrypt silently ignores everything after the first 72 bytes, so two long
    // passwords sharing a prefix would match. Reject them instead.
    .refine((password) => Buffer.byteLength(password) <= 72, 'Password is too long'),
  name: z.string().trim().min(1, 'Name is required').max(50),
});

export const loginSchema = z.object({
  email: emailSchema,
  // No length rules here: login only checks whether the password matches.
  password: z.string().min(1, 'Password is required'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
