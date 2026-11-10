// Starter categories every new user gets (copied per user on register in M5,
// and used by the seed script for the demo user).
// Users can add, rename, or delete their own copies later.
import type { TransactionType } from '../generated/prisma/enums.js';

export type DefaultCategory = {
  name: string;
  type: TransactionType;
  color: string;
};

export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  // Expenses
  { name: 'Housing', type: 'EXPENSE', color: '#4F46E5' },
  { name: 'Utilities', type: 'EXPENSE', color: '#0EA5E9' },
  { name: 'Groceries', type: 'EXPENSE', color: '#16A34A' },
  { name: 'Dining Out', type: 'EXPENSE', color: '#F97316' },
  { name: 'Transportation', type: 'EXPENSE', color: '#EAB308' },
  { name: 'Health', type: 'EXPENSE', color: '#DC2626' },
  { name: 'Shopping', type: 'EXPENSE', color: '#DB2777' },
  { name: 'Entertainment', type: 'EXPENSE', color: '#9333EA' },
  { name: 'Subscriptions', type: 'EXPENSE', color: '#7C3AED' },
  { name: 'Travel', type: 'EXPENSE', color: '#0891B2' },
  { name: 'Education', type: 'EXPENSE', color: '#2563EB' },
  { name: 'Other Expense', type: 'EXPENSE', color: '#64748B' },
  // Income
  { name: 'Salary', type: 'INCOME', color: '#059669' },
  { name: 'Freelance', type: 'INCOME', color: '#10B981' },
  { name: 'Investments', type: 'INCOME', color: '#14B8A6' },
  { name: 'Other Income', type: 'INCOME', color: '#6B7280' },
];
