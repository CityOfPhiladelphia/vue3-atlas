import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // API integration tests don't need browser environment
    environment: 'node',
    // Put API tests in a separate folder from Playwright E2E tests
    include: ['src/**/*.test.js', 'src/**/*.test.ts'],
  },
});
