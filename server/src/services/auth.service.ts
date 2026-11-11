// Business logic for accounts: creating them, checking passwords, loading the current user.
// Knows nothing about HTTP (no req/res), so the AI tools in M15 could reuse it.
import bcrypt from 'bcryptjs';
import { Prisma, type User } from '../generated/prisma/client.js';
import { prisma } from '../lib/prisma.js';
import { conflict, unauthorized } from '../utils/AppError.js';
import type { LoginInput, RegisterInput } from '../schemas/auth.schemas.js';

// Cost factor: bcrypt runs 2^10 rounds, so each hash takes ~0.1s. That's unnoticeable
// for one login but makes guessing millions of passwords from a stolen database very slow.
const BCRYPT_ROUNDS = 10;

// The only user fields ever sent to the client. passwordHash is never included.
export type PublicUser = Pick<User, 'id' | 'email' | 'name' | 'isDemo' | 'createdAt'>;

const publicUserFields = {
  id: true,
  email: true,
  name: true,
  isDemo: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

// A real hash of a throwaway value, checked when the email doesn't exist. Without it,
// "unknown email" would answer instantly while "wrong password" takes ~0.1s, and that
// timing difference would tell an attacker which emails have accounts.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', BCRYPT_ROUNDS);

export async function register(input: RegisterInput): Promise<PublicUser> {
  // bcrypt adds a random salt and stores it inside the hash, so two users with the
  // same password still get different hashes.
  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

  try {
    return await prisma.user.create({
      data: { email: input.email, name: input.name, passwordHash },
      select: publicUserFields,
    });
  } catch (error) {
    // The unique index on email is the real guard. Checking "does this email exist?"
    // first would still let two signups at the same moment both pass the check.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw conflict('An account with this email already exists');
    }
    throw error;
  }
}

export async function login(input: LoginInput): Promise<PublicUser> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  // Always run one bcrypt comparison, whether or not the user exists (see DUMMY_HASH).
  const hashToCheck = user ? user.passwordHash : DUMMY_HASH;
  const passwordMatches = await bcrypt.compare(input.password, hashToCheck);

  // One message for every failure, so the response never reveals whether the email exists.
  // The demo account has no password; it is entered through "Try demo" (M17).
  if (!user || !passwordMatches || user.isDemo) {
    throw unauthorized('Invalid email or password');
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    isDemo: user.isDemo,
    createdAt: user.createdAt,
  };
}

export async function getCurrentUser(userId: number): Promise<PublicUser> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: publicUserFields,
  });

  // The token was valid, but the account has since been deleted.
  if (!user) {
    throw unauthorized();
  }
  return user;
}
