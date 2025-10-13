// src/test-setup.ts
/**
 * Jest Test Setup
 * Global test configuration and mocks
 */

import '@testing-library/jest-dom';

// Mock environment variables
(process.env as any).NODE_ENV = 'test';
process.env.NEXTAUTH_SECRET = 'test-secret';
process.env.NEXTAUTH_URL = 'http://localhost:3000';

// Mock Next.js modules
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      pathname: '/',
      query: {},
      asPath: '/',
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return '/';
  },
}));

jest.mock('next/headers', () => ({
  headers: () => new Map(),
  cookies: () => ({ get: jest.fn() }),
}));

// Mock Prisma
jest.mock('@/core/database', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    workoutLogEntry: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    exercise: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    workoutSession: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));