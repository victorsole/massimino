/**
 * Database Client for Massimino
 * Centralized Prisma client instance
 */

import { PrismaClient } from '@prisma/client';

// Create a single Prisma client instance
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}