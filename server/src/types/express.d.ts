// Adds our own field to Express's Request type, so `req.userId` type-checks.
declare global {
  namespace Express {
    interface Request {
      // Set by the requireAuth middleware once it has verified the login cookie.
      userId?: number;
    }
  }
}

export {};
