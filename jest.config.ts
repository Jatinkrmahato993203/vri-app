import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    // Mirror the Next.js @/* path alias
    '^@/(.*)$': '<rootDir>/$1',
  },
  // Only run .test.ts files — skip Next.js app routes and page components
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: { strict: true } }],
  },
};

export default config;
