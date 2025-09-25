const { pathsToModuleNameMapper } = require('ts-jest');

// Manual path mapping since tsconfig.json has comments
const pathMappings = {
  '@/*': ['./src/*'],
  '@/core': ['./src/core'],
  '@/core/*': ['./src/core/*'],
  '@/services': ['./src/services'],
  '@/services/*': ['./src/services/*'],
  '@/components/*': ['./src/components/*'],
  '@/types/*': ['./src/types/*'],
  '@/hooks/*': ['./src/hooks/*'],
  '@/app/*': ['./src/app/*'],
};

/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
  ],
  moduleNameMapper: {
    ...pathsToModuleNameMapper(pathMappings, {
      prefix: '<rootDir>/',
    }),
    // Handle CSS and other static assets
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$))',
  ],
};